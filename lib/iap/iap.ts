import { Platform } from 'react-native';
import { SUBSCRIPTION_SKUS } from './products';

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
  try {
    if (Platform.OS === 'web') {
      console.log('[IAP] Skipping IAP init on web');
      return async () => {};
    }

    const iap = await getExpoIap();
    if (!iap) return async () => {};

    console.log('[IAP] Initializing connection...');
    const connected = await iap.initConnection();
    isConnected = !!connected;
    console.log('[IAP] Connection initialized:', connected);
    
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
  try {
    if (Platform.OS === 'web' || !isConnected) {
      return { success: false, error: 'IAP not available on web' };
    }

    const iap = await getExpoIap();
    if (!iap) return { success: false, error: 'IAP module not available' };

    console.log('[IAP] Requesting subscription purchase:', sku);

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

    const purchase = await iap.requestPurchase(purchaseArgs);

    console.log('[IAP] Purchase successful:', purchase);
    return { success: true, purchase: purchase as Purchase };
  } catch (error: any) {
    console.error('[IAP] Purchase error:', error);
    
    if (error?.code === 'E_USER_CANCELLED') {
      return { success: false, error: 'Purchase cancelled' };
    }
    
    return { success: false, error: error?.message || 'Purchase failed' };
  }
}

export async function restorePurchases(): Promise<Purchase[]> {
  try {
    if (Platform.OS === 'web' || !isConnected) {
      console.log('[IAP] Cannot restore - not connected or on web');
      return [];
    }

    const iap = await getExpoIap();
    if (!iap) return [];

    console.log('[IAP] Restoring purchases...');
    const purchases = await iap.getAvailablePurchases();
    console.log('[IAP] Restored purchases:', purchases.length);
    return purchases as Purchase[];
  } catch (error) {
    console.error('[IAP] Error restoring purchases:', error);
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
