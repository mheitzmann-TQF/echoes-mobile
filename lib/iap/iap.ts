import { Platform } from 'react-native';
import * as ExpoIap from 'expo-iap';
import type { Purchase, ProductSubscription } from 'expo-iap';
import { SUBSCRIPTION_SKUS } from './products';

let isConnected = false;

export async function initIAP(): Promise<() => Promise<void>> {
  try {
    if (Platform.OS === 'web') {
      console.log('[IAP] Skipping IAP init on web');
      return async () => {};
    }

    console.log('[IAP] Initializing connection...');
    const connected = await ExpoIap.initConnection();
    isConnected = !!connected;
    console.log('[IAP] Connection initialized:', connected);
    
    return async () => {
      try {
        await ExpoIap.endConnection();
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

export async function getProducts(): Promise<ProductSubscription[]> {
  try {
    if (Platform.OS === 'web' || !isConnected) {
      console.log('[IAP] Cannot get products - not connected or on web');
      return [];
    }

    console.log('[IAP] Fetching products...', SUBSCRIPTION_SKUS);
    const products = await ExpoIap.fetchProducts({
      skus: SUBSCRIPTION_SKUS || [],
      type: 'subs',
    });
    console.log('[IAP] Fetched products:', products?.length ?? 0);
    return (products ?? []) as ProductSubscription[];
  } catch (error) {
    console.error('[IAP] Error fetching products:', error);
    return [];
  }
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

    console.log('[IAP] Requesting subscription purchase:', sku);

    const purchaseArgs: ExpoIap.MutationRequestPurchaseArgs = {
      type: 'subs',
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

    const purchase = await ExpoIap.requestPurchase(purchaseArgs);

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

    console.log('[IAP] Restoring purchases...');
    const purchases = await ExpoIap.getAvailablePurchases();
    console.log('[IAP] Restored purchases:', purchases.length);
    return purchases;
  } catch (error) {
    console.error('[IAP] Error restoring purchases:', error);
    return [];
  }
}

export async function finishTransaction(purchase: Purchase): Promise<void> {
  try {
    console.log('[IAP] Finishing transaction...');
    await ExpoIap.finishTransaction({ purchase, isConsumable: false });
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

export { purchaseUpdatedListener, purchaseErrorListener } from 'expo-iap';
