import React, { useState } from 'react';
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
import { Sparkles, Check, RotateCcw } from 'lucide-react-native';
import { useEntitlement } from '@/lib/iap/useEntitlement';
import { HAS_TRIAL_OFFER, TRIAL_DAYS, LEGAL_URLS, SUBSCRIPTION_IDS } from '@/lib/iap/products';
import type { ProductSubscription } from 'expo-iap';

interface PaywallProps {
  onClose?: () => void;
  onSubscribed?: () => void;
}

function getLocalizedPrice(products: ProductSubscription[], sku: string, fallback: string): string {
  const product = products.find(p => p.id === sku);
  if (product && product.displayPrice) {
    return product.displayPrice;
  }
  return fallback;
}

function getPeriodLabel(sku: string): string {
  if (sku.includes('yearly')) return 'year';
  return 'month';
}

export default function Paywall({ onClose, onSubscribed }: PaywallProps) {
  const {
    isPro,
    isLoading,
    products,
    error,
    purchaseMonthly,
    purchaseYearly,
    restorePurchasesAction,
  } = useEntitlement();

  const [purchasing, setPurchasing] = useState<'monthly' | 'yearly' | null>(null);
  const [restoring, setRestoring] = useState(false);

  const monthlyPrice = getLocalizedPrice(products, SUBSCRIPTION_IDS.monthly, '$7.99');
  const yearlyPrice = getLocalizedPrice(products, SUBSCRIPTION_IDS.yearly, '$79.90');

  const handlePurchaseMonthly = async () => {
    setPurchasing('monthly');
    const success = await purchaseMonthly();
    setPurchasing(null);
    if (success) {
      onSubscribed?.();
    }
  };

  const handlePurchaseYearly = async () => {
    setPurchasing('yearly');
    const success = await purchaseYearly();
    setPurchasing(null);
    if (success) {
      onSubscribed?.();
    }
  };

  const handleRestore = async () => {
    setRestoring(true);
    const success = await restorePurchasesAction();
    setRestoring(false);
    if (success) {
      onSubscribed?.();
    }
  };

  const handleOpenTerms = () => {
    Linking.openURL(LEGAL_URLS.terms);
  };

  const handleOpenPrivacy = () => {
    Linking.openURL(LEGAL_URLS.privacy);
  };

  if (isPro) {
    return (
      <View style={styles.container}>
        <View style={styles.successCard}>
          <Check size={48} color="#10B981" />
          <Text style={styles.successTitle}>You're subscribed!</Text>
          <Text style={styles.successText}>
            Thank you for supporting Echoes. Enjoy full access to all features.
          </Text>
          {onClose && (
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={onClose}
              data-testid="button-close-paywall"
            >
              <Text style={styles.closeButtonText}>Continue</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Sparkles size={32} color="#F59E0B" />
          <Text style={styles.title}>Unlock Echoes</Text>
          <Text style={styles.subtitle}>
            Get full access to cosmic wisdom, planetary insights, and personalized echoes.
          </Text>
        </View>

        <View style={styles.features}>
          <FeatureItem text="Unlimited daily echoes" />
          <FeatureItem text="Full planetary field analysis" />
          <FeatureItem text="Cultural calendar insights" />
          <FeatureItem text="Personalized content" />
        </View>

        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
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
              <Text style={styles.planBadgeText}>Best Value</Text>
            </View>
            <Text style={styles.planTitle}>Yearly</Text>
            <Text style={styles.planPrice}>{yearlyPrice}</Text>
            <Text style={styles.planPeriod}>per year</Text>
            <Text style={styles.planSavings}>~2 months free</Text>
            {purchasing === 'yearly' ? (
              <ActivityIndicator color="#FFFFFF" style={styles.planLoader} />
            ) : (
              <Text style={styles.planCta}>
                {HAS_TRIAL_OFFER ? `Start ${TRIAL_DAYS}-day free trial` : 'Subscribe'}
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
            <Text style={styles.planTitle}>Monthly</Text>
            <Text style={styles.planPrice}>{monthlyPrice}</Text>
            <Text style={styles.planPeriod}>per month</Text>
            {purchasing === 'monthly' ? (
              <ActivityIndicator color="#FFFFFF" style={styles.planLoader} />
            ) : (
              <Text style={styles.planCta}>
                {HAS_TRIAL_OFFER ? `Start ${TRIAL_DAYS}-day free trial` : 'Subscribe'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {HAS_TRIAL_OFFER && (
          <Text style={styles.trialNote}>
            {TRIAL_DAYS}-day free trial, then {monthlyPrice}/month or {yearlyPrice}/year.{'\n'}
            Cancel anytime. Payment charged to {Platform.OS === 'ios' ? 'Apple ID' : 'Google account'} after trial.
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
              <Text style={styles.restoreText}>Restore Purchases</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.restoreNote}>
          Already subscribed? Use Restore Purchases if you're on a new device or reinstalled the app.
        </Text>

        <View style={styles.legalLinks}>
          <TouchableOpacity onPress={handleOpenTerms} data-testid="link-terms">
            <Text style={styles.legalLink}>Terms of Service</Text>
          </TouchableOpacity>
          <Text style={styles.legalDivider}>·</Text>
          <TouchableOpacity onPress={handleOpenPrivacy} data-testid="link-privacy">
            <Text style={styles.legalLink}>Privacy Policy</Text>
          </TouchableOpacity>
        </View>

        {onClose && (
          <TouchableOpacity 
            style={styles.skipButton} 
            onPress={onClose}
            data-testid="button-skip-paywall"
          >
            <Text style={styles.skipText}>Maybe later</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
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
  trialNote: {
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
