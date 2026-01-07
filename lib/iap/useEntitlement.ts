import { useState, useEffect, useCallback } from 'react';
import { Platform, AppState, AppStateStatus } from 'react-native';
import type { ProductSubscription, Purchase } from 'expo-iap';
import {
  initIAP,
  getProducts,
  purchaseSubscription,
  restorePurchases,
  finishTransaction,
  getPurchasePayload,
  purchaseUpdatedListener,
  purchaseErrorListener,
} from './iap';
import { getInstallId } from './installId';
import { SUBSCRIPTION_IDS } from './products';

export interface EntitlementState {
  isPro: boolean;
  isLoading: boolean;
  products: ProductSubscription[];
  expiresAt: string | null;
  error: string | null;
}

export interface EntitlementActions {
  purchaseMonthly: (offerToken?: string) => Promise<boolean>;
  purchaseYearly: (offerToken?: string) => Promise<boolean>;
  restorePurchasesAction: () => Promise<boolean>;
  refresh: () => Promise<void>;
}

const API_BASE = '';

async function checkEntitlementStatus(installId: string): Promise<{
  entitlement: 'pro' | 'free';
  expiresAt: string | null;
}> {
  try {
    console.log('[ENTITLEMENT] Checking status for installId:', installId);
    const response = await fetch(`${API_BASE}/api/billing/status?installId=${installId}`);
    
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
  entitlement: 'pro' | 'free';
  expiresAt: string | null;
}> {
  try {
    const payload = getPurchasePayload(purchase);
    console.log('[ENTITLEMENT] Verifying purchase with backend:', payload);
    
    const response = await fetch(`${API_BASE}/api/billing/verify`, {
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
  const [isPro, setIsPro] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [products, setProducts] = useState<ProductSubscription[]>([]);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [installId, setInstallId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!installId) return;
    
    setIsLoading(true);
    try {
      const status = await checkEntitlementStatus(installId);
      setIsPro(status.entitlement === 'pro');
      setExpiresAt(status.expiresAt);
      setError(null);
    } catch (err) {
      console.error('[ENTITLEMENT] Error refreshing:', err);
      setError('Failed to check subscription status');
    } finally {
      setIsLoading(false);
    }
  }, [installId]);

  useEffect(() => {
    let cleanup: (() => Promise<void>) | null = null;
    let purchaseUpdateSub: { remove: () => void } | null = null;
    let purchaseErrorSub: { remove: () => void } | null = null;

    async function initialize() {
      try {
        const id = await getInstallId();
        setInstallId(id);
        
        const status = await checkEntitlementStatus(id);
        setIsPro(status.entitlement === 'pro');
        setExpiresAt(status.expiresAt);

        if (Platform.OS !== 'web') {
          cleanup = await initIAP();
          
          const fetchedProducts = await getProducts();
          setProducts(fetchedProducts);
          
          purchaseUpdateSub = purchaseUpdatedListener(async (purchase) => {
            console.log('[ENTITLEMENT] Purchase updated:', purchase.productId);
            const result = await verifyPurchaseWithBackend(id, purchase);
            setIsPro(result.entitlement === 'pro');
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

  const purchaseMonthly = useCallback(async (offerToken?: string): Promise<boolean> => {
    if (!installId) return false;
    
    setError(null);
    const result = await purchaseSubscription(SUBSCRIPTION_IDS.monthly, offerToken);
    
    if (!result.success) {
      setError(result.error || 'Purchase failed');
      return false;
    }
    
    if (result.purchase) {
      const verification = await verifyPurchaseWithBackend(installId, result.purchase);
      setIsPro(verification.entitlement === 'pro');
      setExpiresAt(verification.expiresAt);
      return verification.entitlement === 'pro';
    }
    
    return false;
  }, [installId]);

  const purchaseYearly = useCallback(async (offerToken?: string): Promise<boolean> => {
    if (!installId) return false;
    
    setError(null);
    const result = await purchaseSubscription(SUBSCRIPTION_IDS.yearly, offerToken);
    
    if (!result.success) {
      setError(result.error || 'Purchase failed');
      return false;
    }
    
    if (result.purchase) {
      const verification = await verifyPurchaseWithBackend(installId, result.purchase);
      setIsPro(verification.entitlement === 'pro');
      setExpiresAt(verification.expiresAt);
      return verification.entitlement === 'pro';
    }
    
    return false;
  }, [installId]);

  const restorePurchasesAction = useCallback(async (): Promise<boolean> => {
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
        if (verification.entitlement === 'pro') {
          setIsPro(true);
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
  }, [installId]);

  return {
    isPro,
    isLoading,
    products,
    expiresAt,
    error,
    purchaseMonthly,
    purchaseYearly,
    restorePurchasesAction,
    refresh,
  };
}
