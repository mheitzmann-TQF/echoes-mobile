import { db } from '@/lib/db';
import { entitlementRecords } from '@/shared/schema';
import { eq } from 'drizzle-orm';
import { verifyAppleTransaction } from '@/lib/iap/appleVerify';
import { verifyGoogleSubscription } from '@/lib/iap/googleVerify';

/**
 * Receipt Validation Endpoint
 * ===========================
 * 
 * Verifies purchases with Apple/Google and returns standardized entitlement response.
 * 
 * Required Environment Variables:
 * 
 * APPLE:
 * - APPLE_IAP_PRIVATE_KEY: PEM-encoded private key from App Store Connect
 * - APPLE_IAP_KEY_ID: Key ID from App Store Connect
 * - APPLE_IAP_ISSUER_ID: Issuer ID from App Store Connect
 * - APPLE_BUNDLE_ID: Your app's bundle identifier (default: com.thequietframe.echoes)
 * - APPLE_ENV: 'sandbox' or 'production' (default: sandbox in dev, production otherwise)
 * 
 * GOOGLE:
 * - GOOGLE_SERVICE_ACCOUNT_KEY: JSON string of service account credentials
 * - GOOGLE_PACKAGE_NAME: Your app's package name (default: com.thequietframe.echoes)
 */

interface VerifyRequest {
  installId: string;
  platform: 'ios' | 'android';
  sku: string;
  purchaseToken?: string;
  transactionId?: string;
}

interface VerificationResult {
  valid: boolean;
  entitled: boolean;
  productId?: string;
  expiresAt?: Date;
  source: 'apple' | 'google';
  error?: string;
}

async function verifyApplePurchase(
  transactionId: string,
  sku: string
): Promise<VerificationResult> {
  console.log('[BILLING_VERIFY] Verifying Apple purchase for SKU:', sku);
  
  const privateKey = process.env.APPLE_IAP_PRIVATE_KEY;
  const keyId = process.env.APPLE_IAP_KEY_ID;
  const issuerId = process.env.APPLE_IAP_ISSUER_ID;
  const bundleId = process.env.APPLE_BUNDLE_ID || 'com.thequietframe.echoes';
  const environment = (process.env.APPLE_ENV || (process.env.NODE_ENV === 'production' ? 'production' : 'sandbox')) as 'sandbox' | 'production';
  
  if (!privateKey || !keyId || !issuerId) {
    console.error('[BILLING_VERIFY] Apple credentials not configured');
    console.error('[BILLING_VERIFY] Required: APPLE_IAP_PRIVATE_KEY, APPLE_IAP_KEY_ID, APPLE_IAP_ISSUER_ID');
    return { 
      valid: false, 
      entitled: false, 
      source: 'apple',
      error: 'Apple credentials not configured' 
    };
  }

  if (!transactionId) {
    console.error('[BILLING_VERIFY] Missing transactionId for Apple purchase');
    return { 
      valid: false, 
      entitled: false, 
      source: 'apple',
      error: 'Missing transactionId' 
    };
  }

  console.log('[BILLING_VERIFY] Calling Apple API with environment:', environment);
  
  const result = await verifyAppleTransaction(
    transactionId,
    privateKey,
    keyId,
    issuerId,
    bundleId,
    environment
  );
  
  return {
    valid: result.valid,
    entitled: result.entitled,
    productId: result.productId,
    expiresAt: result.expiresAt,
    source: 'apple',
    error: result.error
  };
}

async function verifyGooglePurchase(
  purchaseToken: string,
  sku: string
): Promise<VerificationResult> {
  console.log('[BILLING_VERIFY] Verifying Google purchase for SKU:', sku);
  
  const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  const packageName = process.env.GOOGLE_PACKAGE_NAME || 'com.thequietframe.echoes';
  
  if (!serviceAccountKey) {
    console.error('[BILLING_VERIFY] Google credentials not configured');
    console.error('[BILLING_VERIFY] Required: GOOGLE_SERVICE_ACCOUNT_KEY');
    return { 
      valid: false, 
      entitled: false, 
      source: 'google',
      error: 'Google credentials not configured' 
    };
  }

  if (!purchaseToken) {
    console.error('[BILLING_VERIFY] Missing purchaseToken for Google purchase');
    return { 
      valid: false, 
      entitled: false, 
      source: 'google',
      error: 'Missing purchaseToken' 
    };
  }

  console.log('[BILLING_VERIFY] Calling Google Play API for package:', packageName);
  
  const result = await verifyGoogleSubscription(
    packageName,
    sku,
    purchaseToken,
    serviceAccountKey
  );
  
  return {
    valid: result.valid,
    entitled: result.entitled,
    productId: result.productId,
    expiresAt: result.expiresAt,
    source: 'google',
    error: result.error
  };
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

    let verificationResult: VerificationResult;

    if (platform === 'ios') {
      verificationResult = await verifyApplePurchase(transactionId || '', sku);
    } else {
      verificationResult = await verifyGooglePurchase(purchaseToken || '', sku);
    }

    // Return error response if verification failed
    if (!verificationResult.valid || !verificationResult.entitled) {
      console.log('[BILLING_VERIFY] Verification failed:', verificationResult.error);
      return Response.json({
        entitled: false,
        entitlement: 'free',
        expiresAt: null,
        source: verificationResult.source,
        productId: null,
        error: verificationResult.error || 'Verification failed',
      });
    }

    // Update database with verified entitlement
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
          sku: verificationResult.productId || sku,
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
        sku: verificationResult.productId || sku,
        purchaseToken,
        transactionId,
        expiresAt: verificationResult.expiresAt,
        lastVerifiedAt: new Date(),
      });
      
      console.log('[BILLING_VERIFY] Created entitlement for installId:', installId);
    }

    // Return standardized successful response
    return Response.json({
      entitled: true,
      entitlement: 'pro',
      expiresAt: verificationResult.expiresAt?.toISOString() || null,
      source: verificationResult.source,
      productId: verificationResult.productId || sku,
    });
    
  } catch (error) {
    console.error('[BILLING_VERIFY] Error:', error);
    return Response.json(
      { 
        entitled: false,
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}
