import React, { useState, useEffect, useCallback, useRef, createContext, useContext, type ReactNode } from 'react';
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

// Module-level deduplication - shared across all hook instances
let moduleInstallId: string | null = null;
let moduleInstallIdReady = false;
let moduleInstallIdPromise: Promise<string> | null = null;
let modulePendingRefresh: Promise<void> | null = null;
let moduleIAPInitialized = false;
let moduleIAPPromise: Promise<void> | null = null;
let moduleProducts: ProductSubscription[] = [];
let moduleIAPCleanup: (() => Promise<void>) | null = null;
let modulePurchaseUpdateSub: { remove: () => void } | null = null;
let modulePurchaseErrorSub: { remove: () => void } | null = null;
let moduleHookInstanceCount = 0;
let modulePendingCheckStatus: Promise<{ entitlement: 'full' | 'free'; expiresAt: string | null }> | null = null;
// Track when last successful verification happened to prevent stale status overwrites
let moduleLastVerificationTime: number = 0;
const VERIFICATION_PROTECTION_MS = 10000; // 10 seconds protection window

// Module-level state update registry - allows listeners to update all active instances
type StateUpdater = {
  setIsFullAccess: (v: boolean) => void;
  setExpiresAt: (v: string | null) => void;
  setError: (v: string | null) => void;
  setIsGrace: (v: boolean) => void;
  setGraceReason: (v: 'fresh_install' | 'prior_access' | 'none') => void;
};
const moduleStateUpdaters: Set<StateUpdater> = new Set();

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

async function checkEntitlementStatusInternal(installId: string, isRetry = false): Promise<{
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
      return checkEntitlementStatusInternal(installId, true);
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
  // Normalize 'pro' to 'full' for consistent internal state
  const entitlement = (data.entitlement === 'pro' || data.entitlement === 'full') ? 'full' : 'free';
  return {
    entitlement,
    expiresAt: data.expiresAt || null,
  };
}

async function checkEntitlementStatus(installId: string): Promise<{
  entitlement: 'full' | 'free';
  expiresAt: string | null;
}> {
  if (modulePendingCheckStatus) {
    console.log('[ENTITLEMENT] Reusing pending status check');
    return modulePendingCheckStatus;
  }
  
  modulePendingCheckStatus = checkEntitlementStatusInternal(installId).finally(() => {
    modulePendingCheckStatus = null;
  });
  
  return modulePendingCheckStatus;
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
    
    // Normalize 'pro' to 'full' for consistent internal state
    const entitlement = (data.entitlement === 'pro' || data.entitlement === 'full') ? 'full' : 'free';
    console.log('[ENTITLEMENT] Verification result:', { entitlement, expiresAt: data.expiresAt });
    
    // Mark successful verification time to protect against stale status overwrites
    if (entitlement === 'full') {
      moduleLastVerificationTime = Date.now();
      console.log('[ENTITLEMENT] Set verification protection timestamp');
    }
    
    return {
      entitlement,
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
  
  // Local ref to track module state for this instance
  const installIdRef = useRef<string | null>(moduleInstallId);

  const refresh = useCallback(async () => {
    if (isDevMode) {
      const override = await getDevAccessOverride();
      setDevOverride(override);
      
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
      
      if (isDevBackendEnabled()) {
        console.log('[ENTITLEMENT] Dev mode with backend enabled, calling API...');
      } else {
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
    
    if (!moduleInstallIdReady) {
      console.log('[ENTITLEMENT] Not initialized yet, skipping refresh');
      return;
    }
    
    const currentInstallId = moduleInstallId;
    if (!currentInstallId) {
      console.log('[ENTITLEMENT] No installId available, skipping refresh');
      return;
    }
    
    if (modulePendingRefresh) {
      console.log('[ENTITLEMENT] Refresh already in progress, waiting...');
      return modulePendingRefresh;
    }
    
    const doRefresh = async () => {
      setIsLoading(true);
      try {
        const status = await checkEntitlementStatus(currentInstallId);
        const hasAccess = status.entitlement === 'full';
        
        // Protect against stale status overwrites after successful verification
        const timeSinceVerification = Date.now() - moduleLastVerificationTime;
        if (!hasAccess && timeSinceVerification < VERIFICATION_PROTECTION_MS) {
          console.log('[ENTITLEMENT] Skipping stale status (within protection window):', timeSinceVerification, 'ms since verification');
          return; // Don't overwrite fresh verification with stale status
        }
        
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
        modulePendingRefresh = null;
      }
    };
    
    modulePendingRefresh = doRefresh();
    return modulePendingRefresh;
  }, [isDevMode]);

  useEffect(() => {
    // Track hook instances for cleanup reference counting
    moduleHookInstanceCount++;
    
    // Register this instance's state updaters for listener callbacks
    const thisUpdater: StateUpdater = {
      setIsFullAccess,
      setExpiresAt,
      setError,
      setIsGrace,
      setGraceReason,
    };
    moduleStateUpdaters.add(thisUpdater);
    
    async function initialize() {
      let id: string;
      
      // Module-level dedup for installId fetching
      if (moduleInstallIdReady && moduleInstallId) {
        id = moduleInstallId;
        installIdRef.current = id;
        setInstallId(id);
        console.log('[ENTITLEMENT] Using cached installId:', id);
      } else if (moduleInstallIdPromise) {
        console.log('[ENTITLEMENT] InstallId fetch in progress, waiting...');
        try {
          id = await moduleInstallIdPromise;
          installIdRef.current = id;
          setInstallId(id);
        } catch (err) {
          console.error('[ENTITLEMENT] InstallId fetch failed:', err);
          throw err;
        }
      } else {
        // First instance to initialize - fetch installId
        moduleInstallIdPromise = getInstallId();
        try {
          id = await moduleInstallIdPromise;
          moduleInstallId = id;
          moduleInstallIdReady = true;
          moduleInstallIdPromise = null; // Clear after success
          installIdRef.current = id;
          setInstallId(id);
          console.log('[ENTITLEMENT] Initialized with installId:', id);
        } catch (err) {
          moduleInstallIdPromise = null; // Clear on failure so retry is possible
          throw err;
        }
      }
      
      try {
        
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
          // Module-level dedup for IAP initialization
          if (moduleIAPInitialized) {
            setProducts(moduleProducts);
            console.log('[ENTITLEMENT] Using cached IAP products');
          } else if (moduleIAPPromise) {
            console.log('[ENTITLEMENT] IAP init in progress, waiting...');
            await moduleIAPPromise;
            setProducts(moduleProducts);
          } else {
            const doIAPInit = async () => {
              moduleIAPCleanup = await initIAP();
              const fetchedProducts = await getProducts();
              moduleProducts = fetchedProducts;
              setProducts(fetchedProducts);
              
              // Set up module-level listeners (only once) that notify ALL active instances
              modulePurchaseUpdateSub = purchaseUpdatedListener(async (purchase) => {
                console.log('[ENTITLEMENT] Purchase updated:', purchase.productId);
                
                // Skip purchases with missing required fields (prevents duplicate/malformed calls)
                if (!purchase.purchaseToken || !purchase.productId) {
                  console.log('[ENTITLEMENT] Skipping purchase with missing token or productId');
                  return;
                }
                
                const currentId = moduleInstallId;
                if (!currentId) {
                  console.error('[ENTITLEMENT] No installId for purchase verification');
                  return;
                }
                const result = await verifyPurchaseWithBackend(currentId, purchase);
                const hasAccess = result.entitlement === 'full';
                
                // Update ALL active hook instances
                moduleStateUpdaters.forEach(updater => {
                  updater.setIsFullAccess(hasAccess);
                  updater.setExpiresAt(result.expiresAt);
                  updater.setIsGrace(false);
                  updater.setGraceReason('none');
                });
                
                if (hasAccess) {
                  await setAccessCache('full', result.expiresAt);
                }
              });
              
              modulePurchaseErrorSub = purchaseErrorListener(async (err: { message?: string; code?: string }) => {
                console.error('[ENTITLEMENT] Purchase error:', err);
                
                // Handle 'already-owned' by automatically restoring purchases
                if (err.code === 'already-owned' || err.message?.includes('already owned')) {
                  console.log('[ENTITLEMENT] Already owned - triggering automatic restore');
                  try {
                    const purchases = await restorePurchases();
                    console.log('[ENTITLEMENT] Auto-restore got', purchases.length, 'purchases');
                    
                    if (purchases.length > 0 && moduleInstallId) {
                      for (const purchase of purchases) {
                        console.log('[ENTITLEMENT] Auto-restore verifying:', purchase.productId);
                        const verification = await verifyPurchaseWithBackend(moduleInstallId, purchase);
                        if (verification.entitlement === 'full') {
                          console.log('[ENTITLEMENT] Auto-restore successful');
                          moduleStateUpdaters.forEach(updater => {
                            updater.setIsFullAccess(true);
                            updater.setExpiresAt(verification.expiresAt);
                            updater.setError(null);
                          });
                          await setAccessCache('full', verification.expiresAt);
                          return; // Success - exit early
                        }
                      }
                    }
                    // If we get here, restore didn't find valid subscription
                    moduleStateUpdaters.forEach(updater => {
                      updater.setError('paywall.restoreFailed');
                    });
                  } catch (restoreErr) {
                    console.error('[ENTITLEMENT] Auto-restore failed:', restoreErr);
                    moduleStateUpdaters.forEach(updater => {
                      updater.setError('paywall.restoreFailed');
                    });
                  }
                  return;
                }
                
                // For other errors, notify ALL active instances
                moduleStateUpdaters.forEach(updater => {
                  updater.setError(err.message || 'Purchase failed');
                });
              });
              
              moduleIAPInitialized = true;
              moduleIAPPromise = null; // Clear after success
            };
            
            try {
              moduleIAPPromise = doIAPInit();
              await moduleIAPPromise;
            } catch (storeErr) {
              console.error('[ENTITLEMENT] Store init error (non-blocking):', storeErr);
              moduleIAPPromise = null; // Allow retry on failure
            }
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
      if (nextAppState === 'active' && moduleInstallIdReady && moduleInstallId) {
        refresh();
      }
    };

    const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      appStateSubscription.remove();
      
      // Unregister this instance's state updaters
      moduleStateUpdaters.delete(thisUpdater);
      
      // Reference counting for module-level cleanup
      moduleHookInstanceCount--;
      if (moduleHookInstanceCount === 0) {
        // Last instance unmounting - clean up module resources
        moduleIAPCleanup?.();
        modulePurchaseUpdateSub?.remove();
        modulePurchaseErrorSub?.remove();
        
        // Reset module state so next mount can reinitialize
        moduleIAPInitialized = false;
        moduleIAPCleanup = null;
        modulePurchaseUpdateSub = null;
        modulePurchaseErrorSub = null;
        moduleProducts = [];
      }
    };
  }, []);

  useEffect(() => {
    if (installId) {
      installIdRef.current = installId;
      if (moduleInstallIdReady) {
        refresh();
      }
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
    if (isDevMode) {
      await devSetAccess('paid');
      return true;
    }
    
    const currentInstallId = installIdRef.current;
    if (!currentInstallId) {
      console.log('[ENTITLEMENT] No installId available for purchase');
      return false;
    }
    
    setError(null);
    const result = await purchaseSubscription(SUBSCRIPTION_IDS.monthly, offerToken);
    
    if (!result.success) {
      setError(result.error || 'Purchase failed');
      return false;
    }
    
    if (result.purchase) {
      const verification = await verifyPurchaseWithBackend(currentInstallId, result.purchase);
      setIsFullAccess(verification.entitlement === 'full');
      setExpiresAt(verification.expiresAt);
      return verification.entitlement === 'full';
    }
    
    return false;
  }, [isDevMode, devSetAccess]);

  const purchaseYearly = useCallback(async (offerToken?: string): Promise<boolean> => {
    if (isDevMode) {
      await devSetAccess('paid');
      return true;
    }
    
    const currentInstallId = installIdRef.current;
    if (!currentInstallId) {
      console.log('[ENTITLEMENT] No installId available for purchase');
      return false;
    }
    
    setError(null);
    const result = await purchaseSubscription(SUBSCRIPTION_IDS.yearly, offerToken);
    
    if (!result.success) {
      setError(result.error || 'Purchase failed');
      return false;
    }
    
    if (result.purchase) {
      const verification = await verifyPurchaseWithBackend(currentInstallId, result.purchase);
      setIsFullAccess(verification.entitlement === 'full');
      setExpiresAt(verification.expiresAt);
      return verification.entitlement === 'full';
    }
    
    return false;
  }, [isDevMode, devSetAccess]);

  const restorePurchasesAction = useCallback(async (): Promise<boolean> => {
    console.log('[ENTITLEMENT] Restore purchases started');
    
    if (isDevMode) {
      console.log('[ENTITLEMENT] Dev mode - simulating restore');
      await devSetAccess('paid');
      return true;
    }
    
    const currentInstallId = installIdRef.current;
    if (!currentInstallId) {
      console.log('[ENTITLEMENT] No installId available for restore');
      return false;
    }
    
    setError(null);
    setIsLoading(true);
    
    try {
      const purchases = await restorePurchases();
      console.log('[ENTITLEMENT] Got', purchases.length, 'purchases from store');
      
      if (purchases.length === 0) {
        console.log('[ENTITLEMENT] No purchases found in store');
        setError('paywall.noPurchasesFound');
        return false;
      }
      
      for (const purchase of purchases) {
        console.log('[ENTITLEMENT] Verifying purchase:', purchase.productId);
        const verification = await verifyPurchaseWithBackend(currentInstallId, purchase);
        console.log('[ENTITLEMENT] Verification result:', verification);
        if (verification.entitlement === 'full') {
          setIsFullAccess(true);
          setExpiresAt(verification.expiresAt);
          setIsGrace(false);
          setGraceReason('none');
          return true;
        }
      }
      
      console.log('[ENTITLEMENT] No active subscription found after verification');
      setError('paywall.noActiveSubscription');
      return false;
    } catch (err) {
      console.error('[ENTITLEMENT] Restore error:', err);
      setError('paywall.restoreFailed');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isDevMode, devSetAccess]);

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

// Context for sharing entitlement state across the app
type EntitlementContextType = EntitlementState & EntitlementActions;

const EntitlementContext = createContext<EntitlementContextType | null>(null);

// Provider component - use this at app root
export function EntitlementProvider({ children }: { children: ReactNode }): React.ReactElement {
  const entitlement = useEntitlement();
  return React.createElement(EntitlementContext.Provider, { value: entitlement }, children);
}

// Consumer hook - use this in components instead of useEntitlement directly
export function useEntitlementContext(): EntitlementContextType {
  const context = useContext(EntitlementContext);
  if (!context) {
    throw new Error('useEntitlementContext must be used within an EntitlementProvider');
  }
  return context;
}
