import { Platform } from 'react-native';
import { SUBSCRIPTION_SKUS } from './products';
import { iapLog, generateFlowId } from './iosLogger';

let ExpoIap: typeof import('expo-iap') | null = null;
let isConnected = false;

async function getExpoIap() {
  if (Platform.OS === 'web') {
    return null;
  }
  if (!ExpoIap) {
    ExpoIap = await import('expo-iap');
  }
  return ExpoIap;
}

export async function initIAP(): Promise<() => Promise<void>> {
  const flowId = generateFlowId();
  try {
    if (Platform.OS === 'web') {
      console.log('[IAP] Skipping IAP init on web');
      return async () => {};
    }

    const iap = await getExpoIap();
    if (!iap) return async () => {};

    console.log('[IAP] Initializing connection...');
    iapLog.init.info('Starting IAP connection', { platform: Platform.OS }, flowId);
    const connected = await iap.initConnection();
    isConnected = !!connected;
    console.log('[IAP] Connection initialized:', connected);
    iapLog.init.info('Connection result', { connected: !!connected }, flowId);
    
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
  } catch (error) {
    console.error('[IAP] Error initializing connection:', error);
    return async () => {};
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

export async function restorePurchases(): Promise<Purchase[]> {
  const flowId = generateFlowId();
  try {
    if (Platform.OS === 'web' || !isConnected) {
      console.log('[IAP] Cannot restore - not connected or on web');
      iapLog.restore.warn('Cannot restore', { connected: isConnected, platform: Platform.OS }, flowId);
      return [];
    }

    const iap = await getExpoIap();
    if (!iap) return [];

    console.log('[IAP] Restoring purchases...');
    iapLog.restore.info('Calling getAvailablePurchases', {}, flowId);
    const purchases = await iap.getAvailablePurchases();
    console.log('[IAP] Restored purchases count:', purchases.length);
    iapLog.restore.info('Got purchases', { count: purchases.length }, flowId);
    
    if (purchases.length > 0) {
      console.log('[IAP] Restored purchases details:', JSON.stringify(purchases, null, 2));
      for (const p of purchases) {
        iapLog.restore.info('Purchase found', {
          productId: (p as any).productId,
          transactionId: (p as any).transactionId,
          hasToken: !!(p as any).purchaseToken
        }, flowId);
      }
    } else {
      iapLog.restore.warn('No purchases found in StoreKit', {}, flowId);
    }
    return purchases as Purchase[];
  } catch (error: any) {
    console.error('[IAP] Error restoring purchases:', error);
    iapLog.restore.error('Restore failed', { message: error?.message }, flowId);
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
    return {
      platform: 'ios',
      sku: purchase.productId,
      transactionId: purchase.transactionId,
      purchaseToken: purchase.purchaseToken,
    };
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
