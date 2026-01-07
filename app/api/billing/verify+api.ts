import { db } from '@/lib/db';
import { entitlementRecords } from '@/shared/schema';
import { eq, sql } from 'drizzle-orm';

/**
 * Receipt Validation Configuration
 * =================================
 * 
 * Apple App Store Server API:
 * 1. Generate private key in App Store Connect > Keys > In-App Purchase
 * 2. Store as APPLE_IAP_PRIVATE_KEY secret
 * 3. Set APPLE_IAP_KEY_ID, APPLE_IAP_ISSUER_ID, APPLE_BUNDLE_ID env vars
 * 4. For sandbox testing, use sandbox environment
 * 
 * Google Play Developer API:
 * 1. Create service account in Google Cloud Console
 * 2. Grant "View financial data" permission in Play Console
 * 3. Store service account JSON as GOOGLE_SERVICE_ACCOUNT_KEY secret
 * 4. Package name: com.thequietframe.echoes
 */

interface VerifyRequest {
  installId: string;
  platform: 'ios' | 'android';
  sku: string;
  purchaseToken?: string;
  transactionId?: string;
}

interface AppleVerificationResult {
  valid: boolean;
  expiresAt?: Date;
  productId?: string;
}

interface GoogleVerificationResult {
  valid: boolean;
  expiresAt?: Date;
  productId?: string;
}

async function verifyApplePurchase(
  transactionId: string,
  sku: string
): Promise<AppleVerificationResult> {
  console.log('[BILLING_VERIFY] Verifying Apple purchase for SKU:', sku);
  
  const applePrivateKey = process.env.APPLE_IAP_PRIVATE_KEY;
  const appleKeyId = process.env.APPLE_IAP_KEY_ID;
  const appleIssuerId = process.env.APPLE_IAP_ISSUER_ID;
  const isSandbox = process.env.NODE_ENV !== 'production';
  
  if (!applePrivateKey || !appleKeyId || !appleIssuerId) {
    console.error('[BILLING_VERIFY] Apple credentials not configured - rejecting purchase');
    console.error('[BILLING_VERIFY] Required: APPLE_IAP_PRIVATE_KEY, APPLE_IAP_KEY_ID, APPLE_IAP_ISSUER_ID');
    return { valid: false };
  }

  if (!transactionId) {
    console.error('[BILLING_VERIFY] Missing transactionId for Apple purchase');
    return { valid: false };
  }

  try {
    // TODO: Implement actual App Store Server API verification
    // 1. Generate JWT using ES256 algorithm with Apple's private key
    // 2. Call GET https://api.storekit{-sandbox}.itunes.apple.com/inApps/v1/transactions/{transactionId}
    // 3. Decode and verify the signed transaction response
    // 4. Extract expiresDate from the decoded transaction
    
    console.log('[BILLING_VERIFY] Apple Server API verification not yet implemented');
    console.log('[BILLING_VERIFY] TransactionId received:', transactionId);
    
    // SECURITY: In production, this should call Apple's API
    // For now, reject all purchases until API is properly implemented
    if (!isSandbox) {
      console.error('[BILLING_VERIFY] Production Apple verification not implemented - rejecting');
      return { valid: false };
    }
    
    // Sandbox testing: Allow with warning (development only)
    console.warn('[BILLING_VERIFY] SANDBOX MODE: Allowing purchase for testing');
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1);
    return { valid: true, expiresAt, productId: sku };
  } catch (error) {
    console.error('[BILLING_VERIFY] Apple verification error:', error);
    return { valid: false };
  }
}

async function verifyGooglePurchase(
  purchaseToken: string,
  sku: string
): Promise<GoogleVerificationResult> {
  console.log('[BILLING_VERIFY] Verifying Google purchase for SKU:', sku);
  
  const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  const isSandbox = process.env.NODE_ENV !== 'production';
  
  if (!serviceAccountKey) {
    console.error('[BILLING_VERIFY] Google credentials not configured - rejecting purchase');
    console.error('[BILLING_VERIFY] Required: GOOGLE_SERVICE_ACCOUNT_KEY');
    return { valid: false };
  }

  if (!purchaseToken) {
    console.error('[BILLING_VERIFY] Missing purchaseToken for Google purchase');
    return { valid: false };
  }

  try {
    // TODO: Implement actual Google Play Developer API verification
    // 1. Parse service account JSON and generate OAuth2 token
    // 2. Call GET https://androidpublisher.googleapis.com/androidpublisher/v3/applications/{packageName}/purchases/subscriptions/{subscriptionId}/tokens/{token}
    // 3. Verify subscription state is ACTIVE
    // 4. Extract expiryTimeMillis from response
    
    console.log('[BILLING_VERIFY] Google Play API verification not yet implemented');
    console.log('[BILLING_VERIFY] PurchaseToken received:', purchaseToken.substring(0, 20) + '...');
    
    // SECURITY: In production, this should call Google's API
    // For now, reject all purchases until API is properly implemented
    if (!isSandbox) {
      console.error('[BILLING_VERIFY] Production Google verification not implemented - rejecting');
      return { valid: false };
    }
    
    // Sandbox testing: Allow with warning (development only)
    console.warn('[BILLING_VERIFY] SANDBOX MODE: Allowing purchase for testing');
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1);
    return { valid: true, expiresAt, productId: sku };
  } catch (error) {
    console.error('[BILLING_VERIFY] Google verification error:', error);
    return { valid: false };
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const body: VerifyRequest = await request.json();
    const { installId, platform, sku, purchaseToken, transactionId } = body;

    if (!installId || !platform || !sku) {
      return Response.json(
        { error: 'installId, platform, and sku are required' },
        { status: 400 }
      );
    }

    console.log('[BILLING_VERIFY] Verifying purchase:', { installId, platform, sku });

    let verificationResult: AppleVerificationResult | GoogleVerificationResult;

    if (platform === 'ios') {
      verificationResult = await verifyApplePurchase(purchaseToken || '', sku);
    } else {
      verificationResult = await verifyGooglePurchase(purchaseToken || '', sku);
    }

    if (!verificationResult.valid) {
      console.log('[BILLING_VERIFY] Verification failed for installId:', installId);
      return Response.json({
        entitlement: 'free',
        expiresAt: null,
        source: 'server',
        error: 'Verification failed',
      });
    }

    const existingRecord = await db
      .select()
      .from(entitlementRecords)
      .where(eq(entitlementRecords.installId, installId))
      .limit(1);

    if (existingRecord.length) {
      await db
        .update(entitlementRecords)
        .set({
          entitlement: 'pro',
          platform,
          sku,
          purchaseToken,
          transactionId,
          expiresAt: verificationResult.expiresAt,
          lastVerifiedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(entitlementRecords.installId, installId));
      
      console.log('[BILLING_VERIFY] Updated entitlement for installId:', installId);
    } else {
      await db.insert(entitlementRecords).values({
        installId,
        entitlement: 'pro',
        platform,
        sku,
        purchaseToken,
        transactionId,
        expiresAt: verificationResult.expiresAt,
        lastVerifiedAt: new Date(),
      });
      
      console.log('[BILLING_VERIFY] Created entitlement for installId:', installId);
    }

    return Response.json({
      entitlement: 'pro',
      expiresAt: verificationResult.expiresAt?.toISOString() || null,
      source: 'server',
    });
  } catch (error) {
    console.error('[BILLING_VERIFY] Error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
