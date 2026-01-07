/**
 * Google Play Developer API Verification
 * 
 * Uses Google Play Developer API v3 to verify subscriptions.
 * Requires service account OAuth2 authentication.
 * 
 * Documentation: https://developers.google.com/android-publisher/api-ref/rest/v3/purchases.subscriptions
 */

import * as crypto from 'crypto';

interface GoogleVerificationResult {
  valid: boolean;
  entitled: boolean;
  productId?: string;
  expiresAt?: Date;
  purchaseToken?: string;
  environment?: 'test' | 'production';
  error?: string;
}

interface ServiceAccountCredentials {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
}

interface SubscriptionPurchase {
  kind: string;
  startTimeMillis: string;
  expiryTimeMillis: string;
  autoRenewing: boolean;
  priceCurrencyCode: string;
  priceAmountMicros: string;
  countryCode: string;
  developerPayload: string;
  paymentState: number;
  cancelReason?: number;
  userCancellationTimeMillis?: string;
  orderId: string;
  purchaseType?: number;
  acknowledgementState: number;
}

interface SubscriptionPurchaseV2 {
  kind: string;
  regionCode: string;
  lineItems: Array<{
    productId: string;
    expiryTime: string;
    autoRenewingPlan?: {
      autoRenewEnabled: boolean;
    };
  }>;
  subscriptionState: string;
  latestOrderId: string;
  acknowledgementState: string;
  testPurchase?: object;
}

function base64UrlEncode(data: string | Buffer): string {
  const base64 = Buffer.isBuffer(data) 
    ? data.toString('base64') 
    : Buffer.from(data).toString('base64');
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function getAccessToken(credentials: ServiceAccountCredentials): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + 3600;

  const header = {
    alg: 'RS256',
    typ: 'JWT'
  };

  const payload = {
    iss: credentials.client_email,
    scope: 'https://www.googleapis.com/auth/androidpublisher',
    aud: credentials.token_uri,
    iat: now,
    exp: exp
  };

  const headerBase64 = base64UrlEncode(JSON.stringify(header));
  const payloadBase64 = base64UrlEncode(JSON.stringify(payload));
  const signingInput = `${headerBase64}.${payloadBase64}`;

  // Sign with RS256
  const sign = crypto.createSign('SHA256');
  sign.update(signingInput);
  sign.end();
  const signature = sign.sign(credentials.private_key);
  const signatureBase64 = base64UrlEncode(signature);

  const jwt = `${signingInput}.${signatureBase64}`;

  // Exchange JWT for access token
  const response = await fetch(credentials.token_uri, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token exchange failed: ${error}`);
  }

  const data = await response.json();
  return data.access_token;
}

export async function verifyGoogleSubscription(
  packageName: string,
  subscriptionId: string,
  purchaseToken: string,
  serviceAccountKeyJson: string
): Promise<GoogleVerificationResult> {
  console.log('[GOOGLE_VERIFY] Starting verification for subscription:', subscriptionId);
  
  try {
    // Parse service account credentials
    let credentials: ServiceAccountCredentials;
    try {
      credentials = JSON.parse(serviceAccountKeyJson);
    } catch {
      return { valid: false, entitled: false, error: 'Invalid service account JSON' };
    }

    if (!credentials.private_key || !credentials.client_email) {
      return { valid: false, entitled: false, error: 'Missing required fields in service account' };
    }

    // Get OAuth2 access token
    console.log('[GOOGLE_VERIFY] Getting access token...');
    const accessToken = await getAccessToken(credentials);
    
    // Try v2 API first (recommended for subscriptions with base plans)
    const urlV2 = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${packageName}/purchases/subscriptionsv2/tokens/${purchaseToken}`;
    console.log('[GOOGLE_VERIFY] Calling subscriptions v2 API...');
    
    let response = await fetch(urlV2, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const purchase: SubscriptionPurchaseV2 = await response.json();
      console.log('[GOOGLE_VERIFY] V2 response:', {
        state: purchase.subscriptionState,
        lineItems: purchase.lineItems?.length
      });
      
      // Check subscription state
      const isActive = purchase.subscriptionState === 'SUBSCRIPTION_STATE_ACTIVE' ||
                       purchase.subscriptionState === 'SUBSCRIPTION_STATE_IN_GRACE_PERIOD';
      
      // Get expiry from first line item
      const lineItem = purchase.lineItems?.[0];
      const expiresAt = lineItem?.expiryTime ? new Date(lineItem.expiryTime) : undefined;
      const productId = lineItem?.productId;
      
      return {
        valid: true,
        entitled: isActive,
        productId,
        expiresAt,
        purchaseToken,
        environment: purchase.testPurchase ? 'test' : 'production'
      };
    }
    
    // Fall back to v1 API for older subscriptions
    console.log('[GOOGLE_VERIFY] V2 failed, trying v1 API...');
    const urlV1 = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${packageName}/purchases/subscriptions/${subscriptionId}/tokens/${purchaseToken}`;
    
    response = await fetch(urlV1, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[GOOGLE_VERIFY] API error:', response.status, errorText);
      
      if (response.status === 404) {
        return { valid: false, entitled: false, error: 'Purchase not found' };
      }
      if (response.status === 401 || response.status === 403) {
        return { valid: false, entitled: false, error: 'Authentication failed - check service account permissions' };
      }
      return { valid: false, entitled: false, error: `API error: ${response.status}` };
    }
    
    const purchase: SubscriptionPurchase = await response.json();
    console.log('[GOOGLE_VERIFY] V1 response:', {
      orderId: purchase.orderId,
      paymentState: purchase.paymentState,
      cancelReason: purchase.cancelReason
    });
    
    // Check if subscription is active based on expiry time
    // NOTE: cancelReason indicates the user has turned off auto-renew or canceled,
    // but they retain access until expiryTimeMillis. Do NOT revoke early.
    const now = Date.now();
    const expiryTime = parseInt(purchase.expiryTimeMillis, 10);
    const isActive = expiryTime > now;
    
    return {
      valid: true,
      entitled: isActive,
      productId: subscriptionId,
      expiresAt: new Date(expiryTime),
      purchaseToken,
      environment: purchase.purchaseType === 0 ? 'test' : 'production'
    };
    
  } catch (error) {
    console.error('[GOOGLE_VERIFY] Error:', error);
    return { 
      valid: false, 
      entitled: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

export async function acknowledgeGooglePurchase(
  packageName: string,
  subscriptionId: string,
  purchaseToken: string,
  serviceAccountKeyJson: string
): Promise<boolean> {
  console.log('[GOOGLE_VERIFY] Acknowledging purchase...');
  
  try {
    const credentials: ServiceAccountCredentials = JSON.parse(serviceAccountKeyJson);
    const accessToken = await getAccessToken(credentials);
    
    const url = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${packageName}/purchases/subscriptions/${subscriptionId}/tokens/${purchaseToken}:acknowledge`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[GOOGLE_VERIFY] Acknowledge error:', response.status, errorText);
      return false;
    }
    
    console.log('[GOOGLE_VERIFY] Purchase acknowledged successfully');
    return true;
    
  } catch (error) {
    console.error('[GOOGLE_VERIFY] Acknowledge error:', error);
    return false;
  }
}
