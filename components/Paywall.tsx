import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Linking,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Sparkles, Check, RotateCcw, X } from 'lucide-react-native';
import { useEntitlementContext } from '@/lib/iap/useEntitlement';
import { HAS_TRIAL_OFFER, TRIAL_DAYS, LEGAL_URLS, SUBSCRIPTION_IDS } from '@/lib/iap/products';
import type { ProductSubscription } from '@/lib/iap/iap';
import { useTranslation } from 'react-i18next';

interface PaywallProps {
  onClose?: () => void;
  onSubscribed?: () => void;
}

function getLocalizedPrice(products: ProductSubscription[], sku: string, fallback: string): string {
  const product = products.find((p: any) => p.productId === sku || p.id === sku);
  if (product) {
    // expo-iap may use different field names across versions
    const price = (product as any).localizedPrice || (product as any).displayPrice || (product as any).price;
    if (price) return price;
  }
  return fallback;
}

function getPeriodLabel(sku: string): string {
  if (sku.includes('yearly')) return 'year';
  return 'month';
}

export default function Paywall({ onClose, onSubscribed }: PaywallProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const {
    isFullAccess,
    isLoading,
    products,
    error,
    purchaseMonthly,
    purchaseYearly,
    restorePurchasesAction,
  } = useEntitlementContext();

  const [purchasing, setPurchasing] = useState<'monthly' | 'yearly' | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [wasNotFullAccess, setWasNotFullAccess] = useState(!isFullAccess);
  const didAutoCloseRef = useRef(false);

  useEffect(() => {
    if (wasNotFullAccess && isFullAccess && !didAutoCloseRef.current) {
      didAutoCloseRef.current = true;
      console.log('[Paywall] Full access gained, auto-closing');
      onSubscribed?.();
      const timer = setTimeout(() => onClose?.(), 1500);
      return () => clearTimeout(timer);
    }
  }, [isFullAccess, wasNotFullAccess, onClose, onSubscribed]);

  useEffect(() => {
    if (!isFullAccess) {
      setWasNotFullAccess(true);
      didAutoCloseRef.current = false;
    }
  }, [isFullAccess]);

  const monthlyPrice = getLocalizedPrice(products, SUBSCRIPTION_IDS.monthly, '$7.99');
  const yearlyPrice = getLocalizedPrice(products, SUBSCRIPTION_IDS.yearly, '$79.90');

  const handlePurchaseMonthly = async () => {
    setPurchasing('monthly');
    await purchaseMonthly();
    setPurchasing(null);
  };

  const handlePurchaseYearly = async () => {
    setPurchasing('yearly');
    await purchaseYearly();
    setPurchasing(null);
  };

  const handleRestore = async () => {
    setRestoring(true);
    await restorePurchasesAction();
    setRestoring(false);
  };

  const handleOpenTerms = () => {
    Linking.openURL(LEGAL_URLS.terms);
  };

  const handleOpenPrivacy = () => {
    Linking.openURL(LEGAL_URLS.privacy);
  };

  if (isFullAccess) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.container}>
          <View style={styles.successCard}>
            <Check size={48} color="#10B981" />
            <Text style={styles.successTitle}>{t('paywall.subscribed')}</Text>
            <Text style={styles.successText}>
              {t('paywall.thankYou')}
            </Text>
            {onClose && (
              <TouchableOpacity 
                style={styles.closeButton} 
                onPress={onClose}
                data-testid="button-close-paywall"
              >
                <Text style={styles.closeButtonText}>{t('common.continue')}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 20) + 60 }]}
      >
        <View style={styles.container}>
          {onClose && (
            <TouchableOpacity
              style={[styles.headerCloseButton, { top: 8 }]}
              onPress={onClose}
              data-testid="button-close-paywall-x"
            >
              <X size={24} color="rgba(255,255,255,0.6)" />
            </TouchableOpacity>
          )}
          <View style={styles.header}>
          <Sparkles size={32} color="#F59E0B" />
          <Text style={styles.title}>{t('paywall.continue')}</Text>
          <Text style={styles.subtitle}>
            {t('paywall.subtitle')}
          </Text>
        </View>

        <View style={styles.features}>
          <FeatureItem text={t('paywall.features.pulseWisdom')} />
          <FeatureItem text={t('paywall.features.mediaClimate')} />
          <FeatureItem text={t('paywall.features.calendars')} />
          <FeatureItem text={t('paywall.features.timing')} />
        </View>

        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error.startsWith('paywall.') ? t(error) : error}</Text>
          </View>
        )}

        <View style={styles.plansContainer}>
          <TouchableOpacity
            style={[
              styles.planCard,
              styles.yearlyCard,
              purchasing === 'yearly' && styles.planCardDisabled,
            ]}
            onPress={handlePurchaseYearly}
            disabled={purchasing !== null || isLoading}
            data-testid="button-purchase-yearly"
          >
            <View style={styles.planBadge}>
              <Text style={styles.planBadgeText}>{t('paywall.bestValue')}</Text>
            </View>
            <Text style={styles.planTitle}>{t('paywall.yearly')}</Text>
            <Text style={styles.planPrice}>{yearlyPrice}</Text>
            <Text style={styles.planPeriod}>{t('paywall.perYear')}</Text>
            <Text style={styles.planSavings}>{t('paywall.monthsFree')}</Text>
            {purchasing === 'yearly' ? (
              <ActivityIndicator color="#FFFFFF" style={styles.planLoader} />
            ) : (
              <Text style={styles.planCta}>
                {HAS_TRIAL_OFFER ? t('paywall.startAccess', { days: TRIAL_DAYS }) : t('paywall.subscribe')}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.planCard,
              purchasing === 'monthly' && styles.planCardDisabled,
            ]}
            onPress={handlePurchaseMonthly}
            disabled={purchasing !== null || isLoading}
            data-testid="button-purchase-monthly"
          >
            <Text style={styles.planTitle}>{t('paywall.monthly')}</Text>
            <Text style={styles.planPrice}>{monthlyPrice}</Text>
            <Text style={styles.planPeriod}>{t('paywall.perMonth')}</Text>
            {purchasing === 'monthly' ? (
              <ActivityIndicator color="#FFFFFF" style={styles.planLoader} />
            ) : (
              <Text style={styles.planCta}>
                {HAS_TRIAL_OFFER ? t('paywall.startAccess', { days: TRIAL_DAYS }) : t('paywall.subscribe')}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {HAS_TRIAL_OFFER && (
          <Text style={styles.accessNote}>
            {t('paywall.accessNote', { days: TRIAL_DAYS, monthlyPrice, yearlyPrice })}
          </Text>
        )}

        <TouchableOpacity
          style={styles.restoreButton}
          onPress={handleRestore}
          disabled={restoring || purchasing !== null}
          data-testid="button-restore-purchases"
        >
          {restoring ? (
            <ActivityIndicator color="#9CA3AF" size="small" />
          ) : (
            <>
              <RotateCcw size={16} color="#9CA3AF" />
              <Text style={styles.restoreText}>{t('paywall.restorePurchases')}</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.restoreNote}>
          {t('paywall.restoreNote')}
        </Text>

        <View style={styles.legalLinks}>
          <TouchableOpacity onPress={handleOpenTerms} data-testid="link-terms">
            <Text style={styles.legalLink}>{t('paywall.termsOfService')}</Text>
          </TouchableOpacity>
          <Text style={styles.legalDivider}>·</Text>
          <TouchableOpacity onPress={handleOpenPrivacy} data-testid="link-privacy">
            <Text style={styles.legalLink}>{t('paywall.privacyPolicy')}</Text>
          </TouchableOpacity>
        </View>

        {onClose && (
          <TouchableOpacity 
            style={styles.skipButton} 
            onPress={onClose}
            data-testid="button-skip-paywall"
          >
            <Text style={styles.skipText}>{t('paywall.maybeLater')}</Text>
          </TouchableOpacity>
        )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function FeatureItem({ text }: { text: string }) {
  return (
    <View style={styles.featureItem}>
      <Check size={18} color="#10B981" />
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#000000',
  },
  headerCloseButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    padding: 8,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    paddingTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    lineHeight: 24,
  },
  features: {
    marginBottom: 32,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    fontSize: 16,
    color: '#FFFFFF',
    marginLeft: 12,
  },
  errorBanner: {
    backgroundColor: 'rgba(239,68,68,0.2)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    textAlign: 'center',
  },
  plansContainer: {
    gap: 16,
    marginBottom: 24,
  },
  planCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  yearlyCard: {
    borderColor: '#F59E0B',
    borderWidth: 2,
  },
  planCardDisabled: {
    opacity: 0.6,
  },
  planBadge: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  planBadgeText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '600',
  },
  planTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  planPrice: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  planPeriod: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 8,
  },
  planSavings: {
    fontSize: 14,
    color: '#10B981',
    marginBottom: 12,
  },
  planLoader: {
    marginTop: 8,
  },
  planCta: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 8,
  },
  accessNote: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  restoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    gap: 8,
  },
  restoreText: {
    fontSize: 15,
    color: '#9CA3AF',
  },
  restoreNote: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.3)',
    textAlign: 'center',
    marginBottom: 24,
  },
  legalLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  legalLink: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.4)',
    textDecorationLine: 'underline',
  },
  legalDivider: {
    color: 'rgba(255,255,255,0.3)',
    marginHorizontal: 8,
  },
  skipButton: {
    alignItems: 'center',
    padding: 12,
  },
  skipText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.4)',
  },
  successCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  successText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  closeButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
