import { useState, useEffect, useCallback } from 'react';
import { Platform, AppState, AppStateStatus } from 'react-native';
import {
  initIAP,
  getProducts,
  purchaseSubscription,
  restorePurchases,
  finishTransaction,
  getPurchasePayload,
  purchaseUpdatedListener,
  purchaseErrorListener,
  type ProductSubscription,
  type Purchase,
} from './iap';
import { getInstallId } from './installId';
import { ensureSession, refreshSession } from './sessionManager';
import { SUBSCRIPTION_IDS } from './products';
import Constants from 'expo-constants';
import {
  getDevAccessOverride,
  setDevAccessOverride,
  devStateToEntitlement,
  isDevOverrideAvailable,
  type DevAccessState,
} from './devAccessOverride';
import {
  getAccessCache,
  setAccessCache,
  checkGraceEligibility,
  type GraceResult,
} from './accessCache';

function isDevBackendEnabled(): boolean {
  const expoConfig = Constants.expoConfig || Constants.manifest;
  const extra = (expoConfig as any)?.extra;
  return extra?.devEnableEntitlementBackend === true;
}

export interface EntitlementState {
  isFullAccess: boolean;
  isLoading: boolean;
  products: ProductSubscription[];
  expiresAt: string | null;
  error: string | null;
  devOverride: DevAccessState;
  isDevMode: boolean;
  isGrace: boolean;
  graceReason: 'fresh_install' | 'prior_access' | 'none';
}

export interface EntitlementActions {
  purchaseMonthly: (offerToken?: string) => Promise<boolean>;
  purchaseYearly: (offerToken?: string) => Promise<boolean>;
  restorePurchasesAction: () => Promise<boolean>;
  refresh: () => Promise<void>;
  devSetAccess: (state: DevAccessState) => Promise<void>;
}

function getBillingApiBase(): string {
  // All billing API calls go through source.thequietframe.com
  // This keeps database access centralized and secrets out of the mobile app
  return 'https://source.thequietframe.com';
}

class BackendUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BackendUnavailableError';
  }
}

async function checkEntitlementStatus(installId: string, isRetry = false): Promise<{
  entitlement: 'full' | 'free';
  expiresAt: string | null;
}> {
  console.log('[ENTITLEMENT] Checking status for installId:', installId, isRetry ? '(retry)' : '');
  
  const sessionToken = await ensureSession();
  if (!sessionToken) {
    console.warn('[ENTITLEMENT] No session token available');
    throw new BackendUnavailableError('No session token available');
  }
  
  const apiBase = getBillingApiBase();
  let response: Response;
  
  try {
    response = await fetch(`${apiBase}/api/billing/status?installId=${installId}`, {
      headers: {
        'Authorization': `Bearer ${sessionToken}`,
      },
    });
  } catch (networkError) {
    console.error('[ENTITLEMENT] Network error:', networkError);
    throw new BackendUnavailableError('Network request failed');
  }
  
  if (response.status === 401) {
    if (!isRetry) {
      console.warn('[ENTITLEMENT] Session expired, refreshing and retrying...');
      await refreshSession();
      return checkEntitlementStatus(installId, true);
    }
    console.error('[ENTITLEMENT] Session still invalid after refresh');
    throw new BackendUnavailableError('Session invalid after refresh');
  }
  
  if (!response.ok) {
    console.error('[ENTITLEMENT] Status check failed:', response.status);
    throw new BackendUnavailableError(`API returned ${response.status}`);
  }
  
  const data = await response.json();
  console.log('[ENTITLEMENT] Status response:', data);
  return {
    entitlement: data.entitlement || 'free',
    expiresAt: data.expiresAt || null,
  };
}

async function verifyPurchaseWithBackend(
  installId: string,
  purchase: Purchase,
  isRetry = false
): Promise<{
  entitlement: 'full' | 'free';
  expiresAt: string | null;
}> {
  try {
    const payload = getPurchasePayload(purchase);
    console.log('[ENTITLEMENT] Verifying purchase with backend:', payload, isRetry ? '(retry)' : '');
    
    const sessionToken = await ensureSession();
    if (!sessionToken) {
      console.error('[ENTITLEMENT] No session token available for verification');
      return { entitlement: 'free', expiresAt: null };
    }
    
    const apiBase = getBillingApiBase();
    const response = await fetch(`${apiBase}/api/billing/verify`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionToken}`,
      },
      body: JSON.stringify({
        installId,
        ...payload,
      }),
    });
    
    if (response.status === 401) {
      if (!isRetry) {
        console.warn('[ENTITLEMENT] Session expired during verification, refreshing and retrying...');
        await refreshSession();
        return verifyPurchaseWithBackend(installId, purchase, true);
      }
      console.error('[ENTITLEMENT] Session still invalid after refresh during verification');
      return { entitlement: 'free', expiresAt: null };
    }
    
    if (!response.ok) {
      console.error('[ENTITLEMENT] Verification failed:', response.status);
      return { entitlement: 'free', expiresAt: null };
    }
    
    const data = await response.json();
    console.log('[ENTITLEMENT] Verification response:', data);
    
    await finishTransaction(purchase);
    
    return {
      entitlement: data.entitlement || 'free',
      expiresAt: data.expiresAt || null,
    };
  } catch (error) {
    console.error('[ENTITLEMENT] Error verifying purchase:', error);
    return { entitlement: 'free', expiresAt: null };
  }
}

export function useEntitlement(): EntitlementState & EntitlementActions {
  const [isFullAccess, setIsFullAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [products, setProducts] = useState<ProductSubscription[]>([]);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [installId, setInstallId] = useState<string | null>(null);
  const [devOverride, setDevOverride] = useState<DevAccessState>(null);
  const [isDevMode] = useState(isDevOverrideAvailable());
  const [isGrace, setIsGrace] = useState(false);
  const [graceReason, setGraceReason] = useState<'fresh_install' | 'prior_access' | 'none'>('none');

  const refresh = useCallback(async () => {
    if (isDevMode) {
      const override = await getDevAccessOverride();
      setDevOverride(override);
      
      // If dev override is set, use it
      if (override) {
        const mapped = devStateToEntitlement(override);
        if (mapped) {
          setIsFullAccess(mapped.isFullAccess);
          setExpiresAt(mapped.expiresAt);
          setError(null);
          setIsLoading(false);
          console.log('[ENTITLEMENT] Dev mode using override:', override);
          return;
        }
      }
      
      // If backend testing is enabled, call the backend
      if (isDevBackendEnabled()) {
        console.log('[ENTITLEMENT] Dev mode with backend enabled, calling API...');
        // Fall through to backend call below
      } else {
        // Default to trial when backend is disabled
        const mapped = devStateToEntitlement('trial');
        if (mapped) {
          setIsFullAccess(mapped.isFullAccess);
          setExpiresAt(mapped.expiresAt);
          setError(null);
          setIsLoading(false);
          console.log('[ENTITLEMENT] Dev mode defaulting to trial');
          return;
        }
      }
    }
    
    if (!installId) {
      console.log('[ENTITLEMENT] No installId, skipping refresh');
      return;
    }
    
    setIsLoading(true);
    try {
      const status = await checkEntitlementStatus(installId);
      const hasAccess = status.entitlement === 'full';
      setIsFullAccess(hasAccess);
      setExpiresAt(status.expiresAt);
      setError(null);
      setIsGrace(false);
      setGraceReason('none');
      await setAccessCache(status.entitlement, status.expiresAt);
      console.log('[ENTITLEMENT] Refreshed from backend:', status);
    } catch (err) {
      console.error('[ENTITLEMENT] Error refreshing:', err);
      const graceCheck = await checkGraceEligibility();
      if (graceCheck.shouldGrantGrace) {
        setIsFullAccess(true);
        setIsGrace(true);
        setGraceReason(graceCheck.reason);
        setError(null);
        console.log('[ENTITLEMENT] Granting grace access:', graceCheck.reason, graceCheck.hoursRemaining, 'hours remaining');
      } else {
        setError('paywall.checkFailed');
      }
    } finally {
      setIsLoading(false);
    }
  }, [installId, isDevMode]);

  useEffect(() => {
    let cleanup: (() => Promise<void>) | null = null;
    let purchaseUpdateSub: { remove: () => void } | null = null;
    let purchaseErrorSub: { remove: () => void } | null = null;

    async function initialize() {
      try {
        const id = await getInstallId();
        setInstallId(id);
        
        if (isDevMode) {
          const override = await getDevAccessOverride();
          setDevOverride(override);
          
          // If dev override is set, use it and skip everything
          if (override) {
            const mapped = devStateToEntitlement(override);
            if (mapped) {
              setIsFullAccess(mapped.isFullAccess);
              setExpiresAt(mapped.expiresAt);
              setIsLoading(false);
              console.log('[ENTITLEMENT] Init dev mode with override:', override);
              return;
            }
          }
          
          // Check if backend testing is enabled
          if (isDevBackendEnabled()) {
            console.log('[ENTITLEMENT] Init dev mode with backend enabled, calling API...');
            const status = await checkEntitlementStatus(id);
            setIsFullAccess(status.entitlement === 'full');
            setExpiresAt(status.expiresAt);
            setIsLoading(false);
            console.log('[ENTITLEMENT] Backend returned:', status);
            // Skip StoreKit init in dev mode
            return;
          } else {
            // Default to trial when backend is disabled
            const mapped = devStateToEntitlement('trial');
            if (mapped) {
              setIsFullAccess(mapped.isFullAccess);
              setExpiresAt(mapped.expiresAt);
              setIsLoading(false);
              console.log('[ENTITLEMENT] Init dev mode defaulting to trial');
              return;
            }
          }
        }
        
        let hasAccess = false;
        let backendSucceeded = false;
        
        try {
          const status = await checkEntitlementStatus(id);
          hasAccess = status.entitlement === 'full';
          setIsFullAccess(hasAccess);
          setExpiresAt(status.expiresAt);
          setIsGrace(false);
          setGraceReason('none');
          await setAccessCache(status.entitlement, status.expiresAt);
          backendSucceeded = true;
          console.log('[ENTITLEMENT] Init backend returned:', status);
        } catch (backendErr) {
          console.error('[ENTITLEMENT] Backend check failed during init:', backendErr);
          const graceCheck = await checkGraceEligibility();
          if (graceCheck.shouldGrantGrace) {
            setIsFullAccess(true);
            setIsGrace(true);
            setGraceReason(graceCheck.reason);
            hasAccess = true;
            console.log('[ENTITLEMENT] Init granting grace access:', graceCheck.reason, graceCheck.hoursRemaining, 'hours remaining');
          } else {
            setIsFullAccess(false);
            console.log('[ENTITLEMENT] Init no grace available, blocking');
          }
        }

        if (Platform.OS !== 'web') {
          try {
            cleanup = await initIAP();
            const fetchedProducts = await getProducts();
            setProducts(fetchedProducts);
            
            purchaseUpdateSub = purchaseUpdatedListener(async (purchase) => {
              console.log('[ENTITLEMENT] Purchase updated:', purchase.productId);
              const result = await verifyPurchaseWithBackend(id, purchase);
              setIsFullAccess(result.entitlement === 'full');
              setExpiresAt(result.expiresAt);
              setIsGrace(false);
              setGraceReason('none');
              if (result.entitlement === 'full') {
                await setAccessCache('full', result.expiresAt);
              }
            });
            
            purchaseErrorSub = purchaseErrorListener((err) => {
              console.error('[ENTITLEMENT] Purchase error:', err);
              setError(err.message || 'Purchase failed');
            });
          } catch (storeErr) {
            console.error('[ENTITLEMENT] Store init error (non-blocking):', storeErr);
          }
        }
      } catch (err) {
        console.error('[ENTITLEMENT] Initialization error:', err);
        const graceCheck = await checkGraceEligibility();
        if (graceCheck.shouldGrantGrace) {
          setIsFullAccess(true);
          setIsGrace(true);
          setGraceReason(graceCheck.reason);
          console.log('[ENTITLEMENT] Init error, granting grace:', graceCheck.reason);
        } else {
          setError('Failed to initialize');
        }
      } finally {
        setIsLoading(false);
      }
    }

    initialize();

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && installId) {
        refresh();
      }
    };

    const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      cleanup?.();
      purchaseUpdateSub?.remove();
      purchaseErrorSub?.remove();
      appStateSubscription.remove();
    };
  }, []);

  useEffect(() => {
    if (installId) {
      refresh();
    }
  }, [installId, refresh]);

  const devSetAccess = useCallback(async (state: DevAccessState): Promise<void> => {
    if (!isDevMode) return;
    
    await setDevAccessOverride(state);
    setDevOverride(state);
    const effectiveState = state ?? 'trial';
    const mapped = devStateToEntitlement(effectiveState);
    if (mapped) {
      setIsFullAccess(mapped.isFullAccess);
      setExpiresAt(mapped.expiresAt);
      setError(null);
    }
    console.log('[ENTITLEMENT] Dev access set to:', state);
  }, [isDevMode]);

  const purchaseMonthly = useCallback(async (offerToken?: string): Promise<boolean> => {
    // In dev mode, simulate purchase by setting override to 'paid'
    if (isDevMode) {
      await devSetAccess('paid');
      return true;
    }
    
    if (!installId) return false;
    
    setError(null);
    const result = await purchaseSubscription(SUBSCRIPTION_IDS.monthly, offerToken);
    
    if (!result.success) {
      setError(result.error || 'Purchase failed');
      return false;
    }
    
    if (result.purchase) {
      const verification = await verifyPurchaseWithBackend(installId, result.purchase);
      setIsFullAccess(verification.entitlement === 'full');
      setExpiresAt(verification.expiresAt);
      return verification.entitlement === 'full';
    }
    
    return false;
  }, [installId, isDevMode, devSetAccess]);

  const purchaseYearly = useCallback(async (offerToken?: string): Promise<boolean> => {
    // In dev mode, simulate purchase by setting override to 'paid'
    if (isDevMode) {
      await devSetAccess('paid');
      return true;
    }
    
    if (!installId) return false;
    
    setError(null);
    const result = await purchaseSubscription(SUBSCRIPTION_IDS.yearly, offerToken);
    
    if (!result.success) {
      setError(result.error || 'Purchase failed');
      return false;
    }
    
    if (result.purchase) {
      const verification = await verifyPurchaseWithBackend(installId, result.purchase);
      setIsFullAccess(verification.entitlement === 'full');
      setExpiresAt(verification.expiresAt);
      return verification.entitlement === 'full';
    }
    
    return false;
  }, [installId, isDevMode, devSetAccess]);

  const restorePurchasesAction = useCallback(async (): Promise<boolean> => {
    // In dev mode, simulate restore by setting override to 'paid'
    if (isDevMode) {
      await devSetAccess('paid');
      return true;
    }
    
    if (!installId) return false;
    
    setError(null);
    setIsLoading(true);
    
    try {
      const purchases = await restorePurchases();
      
      if (purchases.length === 0) {
        setError('paywall.noPurchasesFound');
        return false;
      }
      
      for (const purchase of purchases) {
        const verification = await verifyPurchaseWithBackend(installId, purchase);
        if (verification.entitlement === 'full') {
          setIsFullAccess(true);
          setExpiresAt(verification.expiresAt);
          return true;
        }
      }
      
      setError('paywall.noActiveSubscription');
      return false;
    } catch (err) {
      console.error('[ENTITLEMENT] Restore error:', err);
      setError('paywall.restoreFailed');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [installId, isDevMode, devSetAccess]);

  return {
    isFullAccess,
    isLoading,
    products,
    expiresAt,
    error,
    devOverride,
    isDevMode,
    isGrace,
    graceReason,
    purchaseMonthly,
    purchaseYearly,
    restorePurchasesAction,
    refresh,
    devSetAccess,
  };
}
