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
  updateRestoreDiagnosticsVerify,
  updateRestoreDiagnosticsVerifyRequest,
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
import { iapLog, generateFlowId } from './iosLogger';

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

// Track auto-restore attempts to prevent loops
let moduleLastAutoRestoreTime: number = 0;
const AUTO_RESTORE_COOLDOWN_MS = 60000; // 1 minute cooldown between auto-restore attempts
let moduleAutoRestoreInProgress = false;

// Deduplication for purchase verification - prevent duplicate requests for same token
const modulePendingVerifications: Map<string, Promise<{ entitlement: 'full' | 'free'; expiresAt: string | null }>> = new Map();

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

async function verifyPurchaseWithBackendInternal(
  installId: string,
  purchase: Purchase,
  isRetry = false,
  flowId?: string
): Promise<{
  entitlement: 'full' | 'free';
  expiresAt: string | null;
}> {
  const fid = flowId || generateFlowId();
  try {
    const payload = getPurchasePayload(purchase) as Record<string, any>;
    console.log('[ENTITLEMENT] Verifying purchase with backend:', payload, isRetry ? '(retry)' : '');
    iapLog.verify.info('Starting verification', {
      installId: installId.substring(0, 8) + '...',
      productId: purchase.productId,
      transactionId: purchase.transactionId,
      isRetry
    }, fid);
    
    // Capture verify request for diagnostics
    updateRestoreDiagnosticsVerifyRequest({
      installId: installId.substring(0, 8) + '...' + installId.substring(installId.length - 4),
      platform: payload.platform || Platform.OS,
      sku: payload.sku || purchase.productId,
      transactionId: payload.transactionId,
      hasReceipt: !!payload.transactionReceipt,
    });
    
    const sessionToken = await ensureSession();
    if (!sessionToken) {
      console.error('[ENTITLEMENT] No session token available for verification');
      iapLog.verify.error('No session token', {}, fid);
      updateRestoreDiagnosticsVerify({
        called: false,
        error: 'No session token',
      });
      return { entitlement: 'free', expiresAt: null };
    }
    
    const apiBase = getBillingApiBase();
    iapLog.verify.info('Calling backend verify', { apiBase }, fid);
    
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
    
    iapLog.verify.info('Backend response', { status: response.status }, fid);
    
    if (response.status === 401) {
      if (!isRetry) {
        console.warn('[ENTITLEMENT] Session expired during verification, refreshing and retrying...');
        iapLog.verify.warn('Session expired, retrying', {}, fid);
        await refreshSession();
        return verifyPurchaseWithBackendInternal(installId, purchase, true, fid);
      }
      console.error('[ENTITLEMENT] Session still invalid after refresh during verification');
      iapLog.verify.error('Session invalid after retry', {}, fid);
      return { entitlement: 'free', expiresAt: null };
    }
    
    if (!response.ok) {
      console.error('[ENTITLEMENT] Verification failed:', response.status);
      const errorText = await response.text().catch(() => 'unknown');
      iapLog.verify.error('Backend rejected', { status: response.status, body: errorText }, fid);
      updateRestoreDiagnosticsVerify({
        called: true,
        status: response.status,
        entitlement: 'free',
        error: errorText.substring(0, 200),
        rawBody: errorText.substring(0, 500),
      });
      return { entitlement: 'free', expiresAt: null };
    }
    
    const data = await response.json();
    console.log('[ENTITLEMENT] Verification response:', data);
    iapLog.verify.info('Verification response', data, fid);
    
    await finishTransaction(purchase);
    
    // Normalize 'pro' to 'full' for consistent internal state
    const entitlement = (data.entitlement === 'pro' || data.entitlement === 'full') ? 'full' : 'free';
    console.log('[ENTITLEMENT] Verification result:', { entitlement, expiresAt: data.expiresAt });
    iapLog.result.info('Verification complete', { entitlement, expiresAt: data.expiresAt }, fid);
    
    // Update diagnostics with full verify response including any Apple debug info
    updateRestoreDiagnosticsVerify({
      called: true,
      status: response.status,
      entitlement,
      expiresAt: data.expiresAt,
      appleEnvironment: data.appleEnvironment || data.environment || data.debug?.environment,
      appleStatus: data.appleStatus || data.subscriptionStatus || data.debug?.status,
      rawBody: JSON.stringify(data).substring(0, 500),
    });
    
    // Mark successful verification time to protect against stale status overwrites
    if (entitlement === 'full') {
      moduleLastVerificationTime = Date.now();
      console.log('[ENTITLEMENT] Set verification protection timestamp');
    }
    
    return {
      entitlement,
      expiresAt: data.expiresAt || null,
    };
  } catch (error: any) {
    console.error('[ENTITLEMENT] Error verifying purchase:', error);
    iapLog.verify.error('Exception', { message: error?.message }, fid);
    updateRestoreDiagnosticsVerify({
      called: true,
      error: error?.message?.substring(0, 100) || 'exception',
    });
    return { entitlement: 'free', expiresAt: null };
  }
}

async function verifyPurchaseWithBackend(
  installId: string,
  purchase: Purchase,
  isRetry = false
): Promise<{
  entitlement: 'full' | 'free';
  expiresAt: string | null;
}> {
  // Build dedupe key from purchase fields directly
  // iOS uses transactionId, Android uses purchaseToken
  const platform = Platform.OS;
  const uniqueId = platform === 'ios' 
    ? purchase.transactionId 
    : purchase.purchaseToken;
  
  // Skip deduplication if no unique identifier available
  if (!uniqueId) {
    console.warn('[ENTITLEMENT] No unique ID for deduplication, proceeding without');
    return verifyPurchaseWithBackendInternal(installId, purchase, isRetry);
  }
  
  const dedupeKey = `${installId}:${platform}:${uniqueId}`;
  
  // Check if there's already a pending verification for this token
  const existing = modulePendingVerifications.get(dedupeKey);
  if (existing) {
    console.log('[ENTITLEMENT] Reusing pending verification for:', purchase.productId);
    return existing;
  }
  
  // Start new verification and track it
  const promise = verifyPurchaseWithBackendInternal(installId, purchase, isRetry);
  modulePendingVerifications.set(dedupeKey, promise);
  
  // Clean up after completion
  promise.finally(() => {
    modulePendingVerifications.delete(dedupeKey);
  });
  
  return promise;
}

export function useEntitlement(): EntitlementState & EntitlementActions {
  // DIAGNOSTIC: This should be the FIRST log from useEntitlement
  console.log('[ENTITLEMENT:BOOT] useEntitlement hook called, Platform:', Platform.OS, '__DEV__:', __DEV__);
  
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
  
  // DIAGNOSTIC: Log isDevMode decision
  console.log('[ENTITLEMENT:BOOT] isDevMode:', isDevMode);
  
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
        
        // Auto-restore: If subscription expired, check if Google has a renewed subscription
        if (!hasAccess && status.expiresAt && moduleIAPInitialized && !moduleAutoRestoreInProgress) {
          const expiry = new Date(status.expiresAt).getTime();
          const now = Date.now();
          const timeSinceLastRestore = now - moduleLastAutoRestoreTime;
          
          // Only attempt auto-restore if:
          // 1. Subscription has actually expired (not just free tier)
          // 2. Not in cooldown period
          if (expiry < now && timeSinceLastRestore > AUTO_RESTORE_COOLDOWN_MS) {
            console.log('[ENTITLEMENT] Subscription expired, attempting auto-restore to check renewals');
            moduleAutoRestoreInProgress = true;
            moduleLastAutoRestoreTime = now;
            
            try {
              const purchases = await restorePurchases();
              console.log('[ENTITLEMENT] Auto-restore got', purchases.length, 'purchases');
              
              if (purchases.length > 0) {
                const currentInstallId = moduleInstallId;
                if (currentInstallId) {
                  for (const purchase of purchases) {
                    console.log('[ENTITLEMENT] Auto-restore verifying:', purchase.productId);
                    const verification = await verifyPurchaseWithBackend(currentInstallId, purchase);
                    console.log('[ENTITLEMENT] Auto-restore verification result:', verification);
                    
                    if (verification.entitlement === 'full') {
                      // Update all active hook instances
                      for (const updater of moduleStateUpdaters) {
                        updater.setIsFullAccess(true);
                        updater.setExpiresAt(verification.expiresAt);
                        updater.setError(null);
                        updater.setIsGrace(false);
                        updater.setGraceReason('none');
                      }
                      // Update cache to prevent future overwrites
                      await setAccessCache('full', verification.expiresAt);
                      moduleLastVerificationTime = Date.now();
                      console.log('[ENTITLEMENT] Auto-restore successful, subscription renewed');
                      break;
                    }
                  }
                }
              }
            } catch (restoreErr) {
              console.log('[ENTITLEMENT] Auto-restore failed (non-critical):', restoreErr);
            } finally {
              moduleAutoRestoreInProgress = false;
            }
          }
        }
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
      console.log('[ENTITLEMENT:INIT] initialize() called');
      
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
        const initFlowId = generateFlowId();
        
        iapLog.status.info('Starting init', { installId: id.substring(0, 8) + '...' }, initFlowId);
        
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
          iapLog.status.info('Backend status', { entitlement: status.entitlement, hasAccess }, initFlowId);
        } catch (backendErr: any) {
          console.error('[ENTITLEMENT] Backend check failed during init:', backendErr);
          iapLog.status.error('Backend check failed', { message: backendErr?.message }, initFlowId);
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
          // iOS-SPECIFIC: If user doesn't have access, check StoreKit for existing subscriptions
          // This recovers subscriptions that failed to verify originally or when backend is down
          if (Platform.OS === 'ios' && !hasAccess) {
            iapLog.restore.info('No access, checking StoreKit for iOS subscriptions', { backendSucceeded }, initFlowId);
            console.log('[ENTITLEMENT] iOS: No access yet, checking StoreKit for existing subscriptions...');
            
            try {
              // Ensure IAP is fully initialized before checking StoreKit
              if (moduleIAPInitialized) {
                iapLog.init.info('IAP already initialized', {}, initFlowId);
              } else if (moduleIAPPromise) {
                iapLog.init.info('Waiting for IAP init in progress', {}, initFlowId);
                await moduleIAPPromise;
              } else {
                iapLog.init.info('Initializing IAP for StoreKit check', {}, initFlowId);
                moduleIAPPromise = (async () => {
                  moduleIAPCleanup = await initIAP();
                  moduleIAPInitialized = true;
                })();
                await moduleIAPPromise;
                moduleIAPPromise = null;
              }
              
              const storeKitPurchases = await restorePurchases();
              iapLog.restore.info('StoreKit returned', { count: storeKitPurchases.length }, initFlowId);
              
              if (storeKitPurchases.length > 0) {
                console.log('[ENTITLEMENT] iOS: Found', storeKitPurchases.length, 'purchases in StoreKit, verifying...');
                
                for (const purchase of storeKitPurchases) {
                  iapLog.verify.info('Verifying StoreKit purchase', {
                    productId: purchase.productId,
                    transactionId: purchase.transactionId
                  }, initFlowId);
                  
                  const verification = await verifyPurchaseWithBackend(id, purchase);
                  
                  if (verification.entitlement === 'full') {
                    iapLog.result.info('StoreKit verification SUCCESS', {
                      entitlement: verification.entitlement,
                      expiresAt: verification.expiresAt
                    }, initFlowId);
                    console.log('[ENTITLEMENT] iOS: StoreKit subscription verified successfully!');
                    
                    setIsFullAccess(true);
                    setExpiresAt(verification.expiresAt);
                    setIsGrace(false);
                    setGraceReason('none');
                    hasAccess = true;
                    await setAccessCache('full', verification.expiresAt);
                    break; // Found valid subscription, stop checking
                  } else {
                    iapLog.verify.warn('StoreKit purchase not entitled', {
                      productId: purchase.productId,
                      result: verification.entitlement
                    }, initFlowId);
                  }
                }
                
                if (!hasAccess) {
                  iapLog.result.info('No valid StoreKit subscription found', {}, initFlowId);
                  console.log('[ENTITLEMENT] iOS: No valid subscription found in StoreKit');
                }
              } else {
                iapLog.restore.info('No purchases in StoreKit', {}, initFlowId);
                console.log('[ENTITLEMENT] iOS: No purchases found in StoreKit');
              }
            } catch (storeKitErr: any) {
              iapLog.restore.error('StoreKit check failed', { message: storeKitErr?.message }, initFlowId);
              console.error('[ENTITLEMENT] iOS: Error checking StoreKit:', storeKitErr);
              // Non-fatal - continue with whatever status we have
            }
          }
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
                const listenerFlowId = generateFlowId();
                console.log('[ENTITLEMENT] Purchase updated:', purchase.productId);
                iapLog.listener.info('Purchase listener fired', {
                  productId: purchase.productId,
                  transactionId: purchase.transactionId,
                  hasToken: !!purchase.purchaseToken
                }, listenerFlowId);
                
                // Check for required fields - need productId plus at least one identifier
                // iOS typically uses transactionId, Android uses purchaseToken
                // Accept if we have productId and at least one of: transactionId, purchaseToken
                const hasProductId = !!purchase.productId;
                const hasAnyIdentifier = !!purchase.transactionId || !!purchase.purchaseToken;
                
                if (!hasProductId || !hasAnyIdentifier) {
                  console.log('[ENTITLEMENT] Skipping purchase with missing fields');
                  iapLog.listener.warn('Missing required fields', {
                    platform: Platform.OS,
                    hasTransactionId: !!purchase.transactionId,
                    hasToken: !!purchase.purchaseToken,
                    hasProductId: hasProductId
                  }, listenerFlowId);
                  return;
                }
                
                const currentId = moduleInstallId;
                if (!currentId) {
                  console.error('[ENTITLEMENT] No installId for purchase verification');
                  iapLog.listener.error('No installId', {}, listenerFlowId);
                  return;
                }
                
                iapLog.listener.info('Starting verification from listener', { installId: currentId.substring(0, 8) + '...' }, listenerFlowId);
                const result = await verifyPurchaseWithBackend(currentId, purchase);
                const newHasAccess = result.entitlement === 'full';
                
                iapLog.result.info('Listener verification complete', {
                  hasAccess: newHasAccess,
                  expiresAt: result.expiresAt
                }, listenerFlowId);
                
                // Update ALL active hook instances
                moduleStateUpdaters.forEach(updater => {
                  updater.setIsFullAccess(newHasAccess);
                  updater.setExpiresAt(result.expiresAt);
                  updater.setIsGrace(false);
                  updater.setGraceReason('none');
                });
                
                if (newHasAccess) {
                  await setAccessCache('full', result.expiresAt);
                }
              });
              
              modulePurchaseErrorSub = purchaseErrorListener(async (err: { message?: string; code?: string }) => {
                const errorFlowId = generateFlowId();
                console.error('[ENTITLEMENT] Purchase error:', err);
                iapLog.listener.error('Purchase error received', {
                  code: err.code,
                  message: err.message
                }, errorFlowId);
                
                // Handle 'already-owned' by automatically restoring purchases
                if (err.code === 'already-owned' || err.message?.includes('already owned')) {
                  console.log('[ENTITLEMENT] Already owned - triggering automatic restore');
                  iapLog.restore.info('Already owned - auto-restoring', {}, errorFlowId);
                  try {
                    const purchases = await restorePurchases();
                    console.log('[ENTITLEMENT] Auto-restore got', purchases.length, 'purchases');
                    iapLog.restore.info('Auto-restore got purchases', { count: purchases.length }, errorFlowId);
                    
                    if (purchases.length > 0 && moduleInstallId) {
                      for (const purchase of purchases) {
                        console.log('[ENTITLEMENT] Auto-restore verifying:', purchase.productId);
                        iapLog.verify.info('Verifying from auto-restore', {
                          productId: purchase.productId,
                          transactionId: purchase.transactionId
                        }, errorFlowId);
                        const verification = await verifyPurchaseWithBackend(moduleInstallId, purchase);
                        if (verification.entitlement === 'full') {
                          console.log('[ENTITLEMENT] Auto-restore successful');
                          iapLog.result.info('Auto-restore SUCCESS', {
                            entitlement: verification.entitlement,
                            expiresAt: verification.expiresAt
                          }, errorFlowId);
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
                    iapLog.result.error('Auto-restore failed - no valid subscription', {}, errorFlowId);
                    moduleStateUpdaters.forEach(updater => {
                      updater.setError('paywall.restoreFailed');
                    });
                  } catch (restoreErr: any) {
                    console.error('[ENTITLEMENT] Auto-restore failed:', restoreErr);
                    iapLog.restore.error('Auto-restore exception', { message: restoreErr?.message }, errorFlowId);
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
        // iOS-specific error message to help users with StoreKit issues
        if (Platform.OS === 'ios') {
          setError('paywall.iosRestoreEmpty');
        } else {
          setError('paywall.noPurchasesFound');
        }
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
  console.log('[ENTITLEMENT:PROVIDER] EntitlementProvider called');
  const entitlement = useEntitlement();
  console.log('[ENTITLEMENT:PROVIDER] useEntitlement returned');
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
