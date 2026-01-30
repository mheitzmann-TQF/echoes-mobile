import { Platform } from 'react-native';
import { SUBSCRIPTION_SKUS } from './products';
import { iapLog, generateFlowId } from './iosLogger';

let ExpoIap: typeof import('expo-iap') | null = null;
let isConnected = false;
let lastConnectionError: string | null = null;
let connectionAttempts = 0;

export interface IAPDiagnostics {
  isConnected: boolean;
  connectionAttempts: number;
  lastConnectionError: string | null;
}

export function getIAPDiagnostics(): IAPDiagnostics {
  return {
    isConnected,
    connectionAttempts,
    lastConnectionError,
  };
}

async function getExpoIap() {
  if (Platform.OS === 'web') {
    return null;
  }
  if (!ExpoIap) {
    ExpoIap = await import('expo-iap');
  }
  return ExpoIap;
}

const MAX_INIT_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function initIAP(): Promise<() => Promise<void>> {
  const flowId = generateFlowId();
  connectionAttempts++;
  lastConnectionError = null;
  
  try {
    if (Platform.OS === 'web') {
      console.log('[IAP] Skipping IAP init on web');
      return async () => {};
    }

    const iap = await getExpoIap();
    if (!iap) {
      lastConnectionError = 'expo-iap module not available';
      return async () => {};
    }

    // Try to connect with retries
    let connected = false;
    let retryAttempt = 0;
    
    while (!connected && retryAttempt < MAX_INIT_RETRIES) {
      try {
        console.log('[IAP] Initializing connection (attempt', connectionAttempts, ', retry', retryAttempt, ')...');
        iapLog.init.info('Starting IAP connection', { platform: Platform.OS, attempt: connectionAttempts, retry: retryAttempt }, flowId);
        
        connected = !!(await iap.initConnection());
        
        if (!connected && retryAttempt < MAX_INIT_RETRIES - 1) {
          const delay = RETRY_DELAY_MS * Math.pow(2, retryAttempt);
          console.log('[IAP] Connection returned false, retrying in', delay, 'ms...');
          iapLog.init.info('Connection false, retrying', { delay, retry: retryAttempt }, flowId);
          await sleep(delay);
        }
      } catch (err: any) {
        console.log('[IAP] Connection attempt failed:', err?.message);
        if (retryAttempt < MAX_INIT_RETRIES - 1) {
          const delay = RETRY_DELAY_MS * Math.pow(2, retryAttempt);
          console.log('[IAP] Retrying in', delay, 'ms...');
          await sleep(delay);
        } else {
          throw err;
        }
      }
      retryAttempt++;
    }
    
    isConnected = connected;
    
    if (!connected) {
      lastConnectionError = `initConnection returned false after ${MAX_INIT_RETRIES} attempts`;
    }
    
    console.log('[IAP] Connection initialized:', connected, '(after', retryAttempt, 'attempt(s))');
    iapLog.init.info('Connection result', { connected, attempts: retryAttempt }, flowId);
    
    return async () => {
      try {
        const iapModule = await getExpoIap();
        if (iapModule) {
          await iapModule.endConnection();
        }
        isConnected = false;
        console.log('[IAP] Connection ended');
      } catch (error) {
        console.error('[IAP] Error ending connection:', error);
      }
    };
  } catch (error: any) {
    console.error('[IAP] Error initializing connection:', error);
    lastConnectionError = error?.message || 'Unknown error';
    iapLog.init.error('Connection failed', { error: lastConnectionError, attempt: connectionAttempts }, flowId);
    return async () => {};
  }
}

export async function reinitIAP(): Promise<boolean> {
  const flowId = generateFlowId();
  console.log('[IAP] Forcing reconnection...');
  iapLog.init.info('Force reconnect requested', { previouslyConnected: isConnected }, flowId);
  
  try {
    const iap = await getExpoIap();
    if (!iap) {
      lastConnectionError = 'expo-iap module not available';
      return false;
    }
    
    // End existing connection first
    if (isConnected) {
      try {
        await iap.endConnection();
        isConnected = false;
      } catch (e) {
        console.log('[IAP] Error ending existing connection:', e);
      }
    }
    
    // Reinitialize
    await initIAP();
    return isConnected;
  } catch (error: any) {
    console.error('[IAP] Error during reinit:', error);
    lastConnectionError = error?.message || 'Reinit failed';
    return false;
  }
}

export interface ProductSubscription {
  productId: string;
  title: string;
  description: string;
  price: string;
  currency: string;
  localizedPrice?: string;
  subscriptionOffers?: Array<{ offerToken: string }>;
}

export async function getProducts(): Promise<ProductSubscription[]> {
  try {
    if (Platform.OS === 'web' || !isConnected) {
      console.log('[IAP] Cannot get products - not connected or on web');
      return [];
    }

    const iap = await getExpoIap();
    if (!iap) return [];

    console.log('[IAP] Fetching products...', SUBSCRIPTION_SKUS);
    const products = await iap.fetchProducts({
      skus: SUBSCRIPTION_SKUS || [],
      type: 'subs',
    });
    console.log('[IAP] Fetched products:', products?.length ?? 0);
    return (products ?? []) as unknown as ProductSubscription[];
  } catch (error) {
    console.error('[IAP] Error fetching products:', error);
    return [];
  }
}

export interface Purchase {
  productId: string;
  transactionId?: string;
  purchaseToken?: string;
  transactionReceipt?: string;
}

export interface PurchaseResult {
  success: boolean;
  purchase?: Purchase;
  error?: string;
}

export async function purchaseSubscription(sku: string, offerToken?: string): Promise<PurchaseResult> {
  const flowId = generateFlowId();
  try {
    if (Platform.OS === 'web' || !isConnected) {
      return { success: false, error: 'IAP not available on web' };
    }

    const iap = await getExpoIap();
    if (!iap) return { success: false, error: 'IAP module not available' };

    console.log('[IAP] Requesting subscription purchase:', sku);
    iapLog.purchase.info('Starting purchase', { sku, hasOfferToken: !!offerToken }, flowId);

    const purchaseArgs = {
      type: 'subs' as const,
      request: Platform.OS === 'ios' 
        ? { apple: { sku } }
        : { 
            google: { 
              skus: [sku],
              subscriptionOffers: offerToken 
                ? [{ sku, offerToken }] 
                : undefined
            } 
          },
    };

    iapLog.purchase.info('Calling requestPurchase', { args: JSON.stringify(purchaseArgs) }, flowId);
    const purchaseResult = await iap.requestPurchase(purchaseArgs);

    console.log('[IAP] Purchase successful:', purchaseResult);
    iapLog.purchase.info('Purchase returned', { 
      isArray: Array.isArray(purchaseResult),
      count: Array.isArray(purchaseResult) ? purchaseResult.length : 1
    }, flowId);
    
    // requestPurchase returns an array of purchases - extract the first one
    const purchase = Array.isArray(purchaseResult) ? purchaseResult[0] : purchaseResult;
    
    if (!purchase) {
      iapLog.purchase.error('No purchase in result', {}, flowId);
      return { success: false, error: 'No purchase returned' };
    }
    
    iapLog.purchase.info('Purchase success', { 
      productId: (purchase as any).productId,
      transactionId: (purchase as any).transactionId,
      hasToken: !!(purchase as any).purchaseToken
    }, flowId);
    
    return { success: true, purchase: purchase as Purchase };
  } catch (error: any) {
    console.error('[IAP] Purchase error:', error);
    iapLog.purchase.error('Purchase failed', { 
      code: error?.code,
      message: error?.message 
    }, flowId);
    
    if (error?.code === 'E_USER_CANCELLED') {
      return { success: false, error: 'Purchase cancelled' };
    }
    
    return { success: false, error: error?.message || 'Purchase failed' };
  }
}

// Restore diagnostics for debugging
export interface RestoreDiagnostics {
  timestamp: string;
  getAvailablePurchases: { tried: boolean; count: number; error?: string };
  getActiveSubscriptions: { tried: boolean; count: number; error?: string };
  currentEntitlement: { tried: boolean; found: boolean; productId?: string; error?: string };
  finalCount: number;
  purchaseDetails?: {
    productId: string;
    hasTransactionId: boolean;
    transactionId?: string;
    transactionIdSource?: string;
    hasTransactionReceipt: boolean;
    hasPurchaseToken: boolean;
    receiptLength?: number;
    rawObjectKeys?: string;
  };
  verifyRequest?: {
    installId: string;
    platform: string;
    sku: string;
    transactionId?: string;
    hasReceipt: boolean;
  };
  verifyResponse?: {
    called: boolean;
    status?: number;
    entitlement?: string;
    error?: string;
    rawBody?: string;
    appleEnvironment?: string;
    appleStatus?: string;
    expiresAt?: string;
  };
}

let lastRestoreDiagnostics: RestoreDiagnostics | null = null;
let lastTransactionIdSource: string = '';
let lastRawObjectKeys: string = '';

export function getLastRestoreDiagnostics(): RestoreDiagnostics | null {
  return lastRestoreDiagnostics;
}

export function updateRestoreDiagnosticsVerifyRequest(request: {
  installId: string;
  platform: string;
  sku: string;
  transactionId?: string;
  hasReceipt: boolean;
}): void {
  if (lastRestoreDiagnostics) {
    lastRestoreDiagnostics.verifyRequest = request;
  }
}

export function updateRestoreDiagnosticsVerify(verifyResult: {
  called: boolean;
  status?: number;
  entitlement?: string;
  error?: string;
  rawBody?: string;
  appleEnvironment?: string;
  appleStatus?: string;
  expiresAt?: string;
}): void {
  if (lastRestoreDiagnostics) {
    lastRestoreDiagnostics.verifyResponse = verifyResult;
  }
}

export async function restorePurchases(): Promise<Purchase[]> {
  const flowId = generateFlowId();
  
  // Reset transaction ID tracking for this restore attempt
  lastTransactionIdSource = '';
  lastRawObjectKeys = '';
  
  // Initialize FRESH diagnostics - clear any stale verify data from previous attempts
  const diagnostics: RestoreDiagnostics = {
    timestamp: new Date().toISOString(),
    getAvailablePurchases: { tried: false, count: 0 },
    getActiveSubscriptions: { tried: false, count: 0 },
    currentEntitlement: { tried: false, found: false },
    finalCount: 0,
    // Explicitly clear verify fields to prevent stale data from showing
    purchaseDetails: undefined,
    verifyRequest: undefined,
    verifyResponse: undefined,
  };
  
  // Set diagnostics immediately so any concurrent reads see fresh state
  lastRestoreDiagnostics = diagnostics;
  
  try {
    if (Platform.OS === 'web' || !isConnected) {
      console.log('[IAP] Cannot restore - not connected or on web');
      iapLog.restore.warn('Cannot restore', { connected: isConnected, platform: Platform.OS }, flowId);
      lastRestoreDiagnostics = diagnostics;
      return [];
    }

    const iap = await getExpoIap();
    if (!iap) {
      lastRestoreDiagnostics = diagnostics;
      return [];
    }

    // iOS StoreKit 2 fix: Must populate product store before getAvailablePurchases works
    // This is NOT needed on Android - only iOS has this dependency
    if (Platform.OS === 'ios') {
      console.log('[IAP] iOS: Fetching subscriptions first (StoreKit 2 requirement)...');
      iapLog.restore.info('iOS: Fetching subscriptions first', { skus: SUBSCRIPTION_SKUS }, flowId);
      try {
        await iap.fetchProducts({ skus: SUBSCRIPTION_SKUS, type: 'subs' });
        console.log('[IAP] iOS: Subscriptions fetched, now getting available purchases');
      } catch (subErr: any) {
        console.warn('[IAP] iOS: Failed to fetch subscriptions, continuing anyway:', subErr?.message);
        iapLog.restore.warn('iOS: fetchProducts failed', { error: subErr?.message }, flowId);
      }
    }

    // Method 1: getAvailablePurchases
    console.log('[IAP] Restoring purchases...');
    iapLog.restore.info('Calling getAvailablePurchases', {}, flowId);
    diagnostics.getAvailablePurchases.tried = true;
    let purchases: Purchase[] = [];
    try {
      const available = await iap.getAvailablePurchases();
      purchases = available as Purchase[];
      diagnostics.getAvailablePurchases.count = purchases.length;
      console.log('[IAP] getAvailablePurchases count:', purchases.length);
      iapLog.restore.info('getAvailablePurchases result', { count: purchases.length }, flowId);
    } catch (availErr: any) {
      diagnostics.getAvailablePurchases.error = availErr?.message;
      console.warn('[IAP] getAvailablePurchases failed:', availErr?.message);
      iapLog.restore.warn('getAvailablePurchases failed', { error: availErr?.message }, flowId);
    }
    
    // iOS fallback #1: try getActiveSubscriptions if getAvailablePurchases returns empty
    if (purchases.length === 0 && Platform.OS === 'ios') {
      console.log('[IAP] iOS: getAvailablePurchases empty, trying getActiveSubscriptions...');
      iapLog.restore.info('iOS: Trying getActiveSubscriptions fallback', { skus: SUBSCRIPTION_SKUS }, flowId);
      diagnostics.getActiveSubscriptions.tried = true;
      try {
        const activeSubs = await iap.getActiveSubscriptions(SUBSCRIPTION_SKUS);
        diagnostics.getActiveSubscriptions.count = activeSubs?.length ?? 0;
        console.log('[IAP] iOS: getActiveSubscriptions returned:', activeSubs?.length ?? 0);
        iapLog.restore.info('iOS: getActiveSubscriptions result', { count: activeSubs?.length ?? 0 }, flowId);
        if (activeSubs && activeSubs.length > 0) {
          // Log ALL fields from the first subscription to understand expo-iap structure
          const firstSub = activeSubs[0] as any;
          lastRawObjectKeys = Object.keys(firstSub).join(',');
          console.log('[IAP] iOS: getActiveSubscriptions raw object keys:', lastRawObjectKeys);
          console.log('[IAP] iOS: getActiveSubscriptions raw object:', JSON.stringify(firstSub, null, 2));
          iapLog.restore.info('iOS: activeSubscription raw fields', {
            keys: lastRawObjectKeys,
            transactionId: firstSub.transactionId,
            originalTransactionId: firstSub.originalTransactionId,
            originalTransactionIdIOS: firstSub.originalTransactionIdIOS,
            latestTransactionId: firstSub.latestTransactionId,
            id: firstSub.id,
          }, flowId);
          
          // Map ActiveSubscription to our Purchase type
          // Priority: transactionId > latestTransactionId > id > originalTransactionIdIOS
          // We want the CURRENT transaction, not the original
          const mappedPurchases: Purchase[] = activeSubs.map((sub: any) => {
            const source = sub.transactionId ? 'transactionId' : sub.latestTransactionId ? 'latestTransactionId' : sub.id ? 'id' : 'originalTransactionIdIOS';
            const currentTransactionId = sub.transactionId || sub.latestTransactionId || sub.id || sub.originalTransactionIdIOS;
            lastTransactionIdSource = `getActiveSubscriptions.${source}`;
            console.log('[IAP] iOS: Mapped transactionId:', currentTransactionId, '(from:', source, ')');
            return {
              productId: sub.productId,
              transactionId: currentTransactionId,
              transactionReceipt: sub.transactionReceipt,
            };
          });
          purchases = mappedPurchases;
        }
      } catch (activeSubsErr: any) {
        diagnostics.getActiveSubscriptions.error = activeSubsErr?.message;
        console.warn('[IAP] iOS: getActiveSubscriptions failed:', activeSubsErr?.message);
        iapLog.restore.warn('iOS: getActiveSubscriptions failed', { error: activeSubsErr?.message }, flowId);
      }
    }
    
    // iOS fallback #2: try currentEntitlementIOS for each subscription SKU
    if (purchases.length === 0 && Platform.OS === 'ios') {
      console.log('[IAP] iOS: Still no purchases, trying currentEntitlementIOS...');
      iapLog.restore.info('iOS: Trying currentEntitlementIOS fallback', { skus: SUBSCRIPTION_SKUS }, flowId);
      diagnostics.currentEntitlement.tried = true;
      try {
        for (const sku of SUBSCRIPTION_SKUS) {
          console.log('[IAP] iOS: Checking currentEntitlement for:', sku);
          const entitlement = await iap.currentEntitlementIOS(sku);
          if (entitlement) {
            const ent = entitlement as any;
            lastRawObjectKeys = Object.keys(ent).join(',');
            console.log('[IAP] iOS: currentEntitlementIOS found entitlement for:', sku);
            console.log('[IAP] iOS: currentEntitlementIOS raw object keys:', lastRawObjectKeys);
            console.log('[IAP] iOS: currentEntitlementIOS raw object:', JSON.stringify(ent, null, 2));
            iapLog.restore.info('iOS: currentEntitlementIOS found', { 
              keys: lastRawObjectKeys,
              productId: ent.productId,
              transactionId: ent.transactionId,
              originalTransactionId: ent.originalTransactionId,
              originalTransactionIdIOS: ent.originalTransactionIdIOS,
              latestTransactionId: ent.latestTransactionId,
              id: ent.id,
            }, flowId);
            diagnostics.currentEntitlement.found = true;
            diagnostics.currentEntitlement.productId = ent.productId;
            
            // Priority: transactionId > latestTransactionId > id > originalTransactionIdIOS
            // We want the CURRENT transaction, not the original
            const source = ent.transactionId ? 'transactionId' : ent.latestTransactionId ? 'latestTransactionId' : ent.id ? 'id' : 'originalTransactionIdIOS';
            const currentTransactionId = ent.transactionId || ent.latestTransactionId || ent.id || ent.originalTransactionIdIOS;
            lastTransactionIdSource = `currentEntitlementIOS.${source}`;
            console.log('[IAP] iOS: currentEntitlementIOS mapped transactionId:', currentTransactionId, '(from:', source, ')');
            
            // Map to Purchase type
            const mappedPurchase: Purchase = {
              productId: ent.productId || sku,
              transactionId: currentTransactionId,
              transactionReceipt: ent.transactionReceipt,
            };
            purchases = [mappedPurchase];
            break; // Found one, no need to check others
          }
        }
        if (!diagnostics.currentEntitlement.found) {
          console.log('[IAP] iOS: currentEntitlementIOS found nothing for any SKU');
          iapLog.restore.warn('iOS: currentEntitlementIOS found nothing', {}, flowId);
        }
      } catch (entitlementErr: any) {
        diagnostics.currentEntitlement.error = entitlementErr?.message;
        console.warn('[IAP] iOS: currentEntitlementIOS failed:', entitlementErr?.message);
        iapLog.restore.warn('iOS: currentEntitlementIOS failed', { error: entitlementErr?.message }, flowId);
      }
    }
    
    diagnostics.finalCount = purchases.length;
    
    // Capture first purchase details for debugging
    if (purchases.length > 0) {
      const firstPurchase = purchases[0] as any;
      diagnostics.purchaseDetails = {
        productId: firstPurchase.productId || 'unknown',
        hasTransactionId: !!firstPurchase.transactionId,
        transactionId: firstPurchase.transactionId || undefined,
        transactionIdSource: lastTransactionIdSource || 'unknown',
        hasTransactionReceipt: !!firstPurchase.transactionReceipt,
        hasPurchaseToken: !!firstPurchase.purchaseToken,
        receiptLength: firstPurchase.transactionReceipt?.length || 0,
        rawObjectKeys: lastRawObjectKeys || undefined,
      };
      
      console.log('[IAP] Restored purchases details:', JSON.stringify(purchases, null, 2));
      for (const p of purchases) {
        iapLog.restore.info('Purchase found', {
          productId: (p as any).productId,
          transactionId: (p as any).transactionId,
          hasToken: !!(p as any).purchaseToken,
          hasReceipt: !!(p as any).transactionReceipt,
          receiptLen: (p as any).transactionReceipt?.length || 0
        }, flowId);
      }
    } else {
      iapLog.restore.warn('No purchases found from any method', { diagnostics }, flowId);
    }
    
    lastRestoreDiagnostics = diagnostics;
    return purchases;
  } catch (error: any) {
    console.error('[IAP] Error restoring purchases:', error);
    iapLog.restore.error('Restore failed', { message: error?.message }, flowId);
    lastRestoreDiagnostics = diagnostics;
    return [];
  }
}

export async function finishTransaction(purchase: Purchase): Promise<void> {
  try {
    const iap = await getExpoIap();
    if (!iap) return;

    console.log('[IAP] Finishing transaction...');
    await iap.finishTransaction({ purchase: purchase as any, isConsumable: false });
    console.log('[IAP] Transaction finished');
  } catch (error) {
    console.error('[IAP] Error finishing transaction:', error);
  }
}

export function getPurchasePayload(purchase: Purchase): object {
  if (Platform.OS === 'ios') {
    // For iOS StoreKit 2: Backend uses App Store Server API with transactionId
    // Only include fields that are actually present to signal verification mode
    const payload: Record<string, any> = {
      platform: 'ios',
      sku: purchase.productId,
      transactionId: purchase.transactionId,
    };
    
    // Only include receipt data if available (usually only present during original purchase)
    // For restores, transactionId alone is sufficient for backend verification
    if (purchase.transactionReceipt) {
      payload.transactionReceipt = purchase.transactionReceipt;
    }
    
    console.log('[IAP] iOS payload:', {
      sku: payload.sku,
      hasTransactionId: !!payload.transactionId,
      hasReceipt: !!payload.transactionReceipt,
      receiptLen: payload.transactionReceipt?.length || 0
    });
    
    return payload;
  } else {
    return {
      platform: 'android',
      sku: purchase.productId,
      purchaseToken: purchase.purchaseToken,
      packageName: 'com.thequietframe.echoes',
      productId: purchase.productId,
    };
  }
}

export function isConnectedToStore(): boolean {
  return isConnected;
}

type PurchaseListener = (purchase: Purchase) => void;
type ErrorListener = (error: { message: string }) => void;

export function purchaseUpdatedListener(callback: PurchaseListener): { remove: () => void } {
  if (Platform.OS === 'web') {
    return { remove: () => {} };
  }
  
  let subscription: { remove: () => void } | null = null;
  
  getExpoIap().then((iap) => {
    if (iap) {
      subscription = iap.purchaseUpdatedListener(callback as any);
    }
  });
  
  return {
    remove: () => {
      subscription?.remove();
    }
  };
}

export function purchaseErrorListener(callback: ErrorListener): { remove: () => void } {
  if (Platform.OS === 'web') {
    return { remove: () => {} };
  }
  
  let subscription: { remove: () => void } | null = null;
  
  getExpoIap().then((iap) => {
    if (iap) {
      subscription = iap.purchaseErrorListener(callback as any);
    }
  });
  
  return {
    remove: () => {
      subscription?.remove();
    }
  };
}
