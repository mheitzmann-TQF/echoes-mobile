import { Platform } from 'react-native';

/**
 * App Store Connect / Google Play Console Configuration Checklist
 * ================================================================
 * 
 * iOS (App Store Connect):
 * 1. Create a Subscription Group called "Echoes Premium"
 * 2. Add products:
 *    - com.thequietframe.echoes.monthly ($7.99/month)
 *    - com.thequietframe.echoes.yearly ($79.99/year)
 * 3. For each product, add Introductory Offer:
 *    - Type: Free Trial
 *    - Duration: 3 days
 *    - Eligibility: New subscribers only
 * 4. Ensure products are "Ready to Submit" or approved
 * 5. Add Sandbox testers in Users and Access > Sandbox Testers
 * 6. iOS Bundle ID: com.ignea.thequietframe
 *    (Note: IAP product SKUs use the com.thequietframe.echoes prefix,
 *     which is independent of the iOS bundle identifier)
 * 
 * Android (Google Play Console):
 * 1. Create subscription products:
 *    - com.thequietframe.echoes.monthly ($7.99/month)
 *    - com.thequietframe.echoes.yearly ($79.99/year)
 * 2. For each subscription, create a base plan with:
 *    - Free trial offer: 3 days
 * 3. Package name must match: com.thequietframe.echoes
 * 4. Add license testers in Setup > License testing
 * 5. Products must be active (not draft)
 * 
 * Testing Notes:
 * - iOS sandbox subscription durations are shortened (1 month = 5 min, 1 year = 1 hour)
 * - Android test purchases use license tester accounts
 * - Both platforms require development builds (not Expo Go)
 */

export const SUBSCRIPTION_IDS = {
  monthly: 'com.thequietframe.echoes.monthly',
  yearly: 'com.thequietframe.echoes.yearly',
} as const;

export const SUBSCRIPTION_SKUS = Platform.select({
  ios: [SUBSCRIPTION_IDS.monthly, SUBSCRIPTION_IDS.yearly],
  android: [SUBSCRIPTION_IDS.monthly, SUBSCRIPTION_IDS.yearly],
  default: [],
});

export const PRICING = {
  monthly: {
    price: 7.99,
    currency: 'USD',
    period: 'month',
  },
  yearly: {
    price: 79.99,
    currency: 'USD',
    period: 'year',
    savings: '2 months free',
  },
} as const;

export const LEGAL_URLS = {
  terms: 'https://thequietframe.com/terms',
  privacy: 'https://thequietframe.com/privacy',
} as const;
