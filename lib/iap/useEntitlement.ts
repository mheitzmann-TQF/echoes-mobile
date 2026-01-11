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
import { SUBSCRIPTION_IDS } from './products';
import Constants from 'expo-constants';
import {
  getDevAccessOverride,
  setDevAccessOverride,
  devStateToEntitlement,
  isDevOverrideAvailable,
  type DevAccessState,
} from './devAccessOverride';

export interface EntitlementState {
  isFullAccess: boolean;
  isLoading: boolean;
  products: ProductSubscription[];
  expiresAt: string | null;
  error: string | null;
  devOverride: DevAccessState;
  isDevMode: boolean;
}

export interface EntitlementActions {
  purchaseMonthly: (offerToken?: string) => Promise<boolean>;
  purchaseYearly: (offerToken?: string) => Promise<boolean>;
  restorePurchasesAction: () => Promise<boolean>;
  refresh: () => Promise<void>;
  devSetAccess: (state: DevAccessState) => Promise<void>;
}

function getApiBase(): string {
  const expoConfig = Constants.expoConfig || Constants.manifest;
  const extra = (expoConfig as any)?.extra as { apiUrl?: string } | undefined;
  if (extra?.apiUrl) {
    return extra.apiUrl;
  }
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return '';
}

async function checkEntitlementStatus(installId: string): Promise<{
  entitlement: 'full' | 'free';
  expiresAt: string | null;
}> {
  try {
    console.log('[ENTITLEMENT] Checking status for installId:', installId);
    const apiBase = getApiBase();
    const response = await fetch(`${apiBase}/api/billing/status?installId=${installId}`);
    
    if (!response.ok) {
      console.error('[ENTITLEMENT] Status check failed:', response.status);
      return { entitlement: 'free', expiresAt: null };
    }
    
    const data = await response.json();
    console.log('[ENTITLEMENT] Status response:', data);
    return {
      entitlement: data.entitlement || 'free',
      expiresAt: data.expiresAt || null,
    };
  } catch (error) {
    console.error('[ENTITLEMENT] Error checking status:', error);
    return { entitlement: 'free', expiresAt: null };
  }
}

async function verifyPurchaseWithBackend(
  installId: string,
  purchase: Purchase
): Promise<{
  entitlement: 'full' | 'free';
  expiresAt: string | null;
}> {
  try {
    const payload = getPurchasePayload(purchase);
    console.log('[ENTITLEMENT] Verifying purchase with backend:', payload);
    
    const apiBase = getApiBase();
    const response = await fetch(`${apiBase}/api/billing/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        installId,
        ...payload,
      }),
    });
    
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

  const refresh = useCallback(async () => {
    if (isDevMode) {
      const override = await getDevAccessOverride();
      setDevOverride(override);
      
      // In dev mode, use override or default to trial - never call backend
      const effectiveState = override ?? 'trial';
      const mapped = devStateToEntitlement(effectiveState);
      if (mapped) {
        setIsFullAccess(mapped.isFullAccess);
        setExpiresAt(mapped.expiresAt);
        setError(null);
        setIsLoading(false);
        console.log('[ENTITLEMENT] Dev mode active, state:', effectiveState);
        return;
      }
    }
    
    if (!installId) {
      console.log('[ENTITLEMENT] No installId, skipping refresh');
      return;
    }
    
    setIsLoading(true);
    try {
      const status = await checkEntitlementStatus(installId);
      setIsFullAccess(status.entitlement === 'full');
      setExpiresAt(status.expiresAt);
      setError(null);
      console.log('[ENTITLEMENT] Refreshed from backend:', status);
    } catch (err) {
      console.error('[ENTITLEMENT] Error refreshing:', err);
      setError('Failed to check subscription status');
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
          // In dev mode, use override or default to trial - never call backend or init StoreKit
          const override = await getDevAccessOverride();
          setDevOverride(override);
          const effectiveState = override ?? 'trial';
          const mapped = devStateToEntitlement(effectiveState);
          if (mapped) {
            setIsFullAccess(mapped.isFullAccess);
            setExpiresAt(mapped.expiresAt);
            setIsLoading(false);
            console.log('[ENTITLEMENT] Init dev mode, state:', effectiveState);
            return;
          }
        }
        
        const status = await checkEntitlementStatus(id);
        setIsFullAccess(status.entitlement === 'full');
        setExpiresAt(status.expiresAt);

        if (Platform.OS !== 'web') {
          cleanup = await initIAP();
          
          const fetchedProducts = await getProducts();
          setProducts(fetchedProducts);
          
          purchaseUpdateSub = purchaseUpdatedListener(async (purchase) => {
            console.log('[ENTITLEMENT] Purchase updated:', purchase.productId);
            const result = await verifyPurchaseWithBackend(id, purchase);
            setIsFullAccess(result.entitlement === 'full');
            setExpiresAt(result.expiresAt);
          });
          
          purchaseErrorSub = purchaseErrorListener((err) => {
            console.error('[ENTITLEMENT] Purchase error:', err);
            setError(err.message || 'Purchase failed');
          });
        }
      } catch (err) {
        console.error('[ENTITLEMENT] Initialization error:', err);
        setError('Failed to initialize');
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
        setError('No purchases found to restore');
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
      
      setError('No active subscriptions found');
      return false;
    } catch (err) {
      console.error('[ENTITLEMENT] Restore error:', err);
      setError('Failed to restore purchases');
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
    purchaseMonthly,
    purchaseYearly,
    restorePurchasesAction,
    refresh,
    devSetAccess,
  };
}
