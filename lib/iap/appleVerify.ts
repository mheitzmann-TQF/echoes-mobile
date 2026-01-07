/**
 * Apple App Store Server API Verification
 * 
 * Uses App Store Server API v1 to verify transactions and get subscription status.
 * Requires ES256 JWT authentication.
 * 
 * Documentation: https://developer.apple.com/documentation/appstoreserverapi
 */

import * as crypto from 'crypto';

interface AppleVerificationResult {
  valid: boolean;
  entitled: boolean;
  productId?: string;
  expiresAt?: Date;
  originalTransactionId?: string;
  environment?: 'sandbox' | 'production';
  error?: string;
}

interface DecodedTransaction {
  transactionId: string;
  originalTransactionId: string;
  productId: string;
  purchaseDate: number;
  expiresDate?: number;
  environment: string;
  type: string;
  revocationDate?: number;
  revocationReason?: number;
}

function base64UrlEncode(data: string | Buffer): string {
  const base64 = Buffer.isBuffer(data) 
    ? data.toString('base64') 
    : Buffer.from(data).toString('base64');
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function generateAppleJWT(
  privateKey: string,
  keyId: string,
  issuerId: string,
  bundleId: string
): string {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + 3600; // 1 hour

  const header = {
    alg: 'ES256',
    kid: keyId,
    typ: 'JWT'
  };

  const payload = {
    iss: issuerId,
    iat: now,
    exp: exp,
    aud: 'appstoreconnect-v1',
    bid: bundleId
  };

  const headerBase64 = base64UrlEncode(JSON.stringify(header));
  const payloadBase64 = base64UrlEncode(JSON.stringify(payload));
  const signingInput = `${headerBase64}.${payloadBase64}`;

  // Sign with ES256 (ECDSA using P-256 and SHA-256)
  const sign = crypto.createSign('SHA256');
  sign.update(signingInput);
  sign.end();

  // Apple private key is in PEM format
  const signature = sign.sign(privateKey);
  
  // Convert DER signature to raw r||s format for JWT
  const signatureBase64 = base64UrlEncode(derToRaw(signature));

  return `${signingInput}.${signatureBase64}`;
}

function derToRaw(derSignature: Buffer): Buffer {
  // DER signature format: 0x30 [length] 0x02 [r-length] [r] 0x02 [s-length] [s]
  let offset = 2; // Skip 0x30 and length byte
  
  if (derSignature[offset] === 0x02) {
    offset++;
    const rLength = derSignature[offset++];
    let r = derSignature.subarray(offset, offset + rLength);
    offset += rLength;
    
    if (derSignature[offset] === 0x02) {
      offset++;
      const sLength = derSignature[offset++];
      let s = derSignature.subarray(offset, offset + sLength);
      
      // Remove leading zeros if present (for 33-byte values)
      if (r.length === 33 && r[0] === 0) r = r.subarray(1);
      if (s.length === 33 && s[0] === 0) s = s.subarray(1);
      
      // Pad to 32 bytes if needed
      const rPadded = Buffer.alloc(32);
      const sPadded = Buffer.alloc(32);
      r.copy(rPadded, 32 - r.length);
      s.copy(sPadded, 32 - s.length);
      
      return Buffer.concat([rPadded, sPadded]);
    }
  }
  
  throw new Error('Invalid DER signature format');
}

function decodeJWSPayload(jws: string): any {
  const parts = jws.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid JWS format');
  }
  
  const payload = parts[1];
  // Add padding if needed
  const padded = payload + '='.repeat((4 - payload.length % 4) % 4);
  const decoded = Buffer.from(padded.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
  return JSON.parse(decoded.toString('utf-8'));
}

export async function verifyAppleTransaction(
  transactionId: string,
  privateKey: string,
  keyId: string,
  issuerId: string,
  bundleId: string,
  environment: 'sandbox' | 'production'
): Promise<AppleVerificationResult> {
  console.log('[APPLE_VERIFY] Starting verification for transaction:', transactionId);
  
  try {
    // Generate JWT for authentication
    const jwt = generateAppleJWT(privateKey, keyId, issuerId, bundleId);
    
    // Determine API endpoint based on environment
    const baseUrl = environment === 'sandbox'
      ? 'https://api.storekit-sandbox.itunes.apple.com'
      : 'https://api.storekit.itunes.apple.com';
    
    // Call Get Transaction Info endpoint
    const url = `${baseUrl}/inApps/v1/transactions/${transactionId}`;
    console.log('[APPLE_VERIFY] Calling:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${jwt}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[APPLE_VERIFY] API error:', response.status, errorText);
      
      if (response.status === 404) {
        return { valid: false, entitled: false, error: 'Transaction not found' };
      }
      if (response.status === 401) {
        return { valid: false, entitled: false, error: 'Authentication failed - check credentials' };
      }
      return { valid: false, entitled: false, error: `API error: ${response.status}` };
    }
    
    const data = await response.json();
    console.log('[APPLE_VERIFY] Response received');
    
    // Decode the signed transaction
    if (!data.signedTransactionInfo) {
      return { valid: false, entitled: false, error: 'No signed transaction in response' };
    }
    
    const transaction: DecodedTransaction = decodeJWSPayload(data.signedTransactionInfo);
    console.log('[APPLE_VERIFY] Decoded transaction:', {
      productId: transaction.productId,
      originalTransactionId: transaction.originalTransactionId,
      type: transaction.type
    });
    
    // Check if subscription is active
    const now = Date.now();
    const expiresAt = transaction.expiresDate ? new Date(transaction.expiresDate) : undefined;
    
    // Check for revocation (refund granted by Apple)
    // If revocationDate is set, the purchase has been refunded and access should be revoked
    if (transaction.revocationDate) {
      console.log('[APPLE_VERIFY] Transaction was revoked/refunded at:', new Date(transaction.revocationDate));
      return {
        valid: true,
        entitled: false,
        productId: transaction.productId,
        expiresAt: undefined,
        originalTransactionId: transaction.originalTransactionId,
        environment: transaction.environment === 'Sandbox' ? 'sandbox' : 'production',
        error: 'Purchase was refunded'
      };
    }
    
    const isActive = expiresAt ? expiresAt.getTime() > now : true;
    
    return {
      valid: true,
      entitled: isActive,
      productId: transaction.productId,
      expiresAt,
      originalTransactionId: transaction.originalTransactionId,
      environment: transaction.environment === 'Sandbox' ? 'sandbox' : 'production'
    };
    
  } catch (error) {
    console.error('[APPLE_VERIFY] Error:', error);
    return { 
      valid: false, 
      entitled: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

export async function getAppleSubscriptionStatus(
  originalTransactionId: string,
  privateKey: string,
  keyId: string,
  issuerId: string,
  bundleId: string,
  environment: 'sandbox' | 'production'
): Promise<AppleVerificationResult> {
  console.log('[APPLE_VERIFY] Getting subscription status for:', originalTransactionId);
  
  try {
    const jwt = generateAppleJWT(privateKey, keyId, issuerId, bundleId);
    
    const baseUrl = environment === 'sandbox'
      ? 'https://api.storekit-sandbox.itunes.apple.com'
      : 'https://api.storekit.itunes.apple.com';
    
    // Use Get All Subscription Statuses endpoint
    const url = `${baseUrl}/inApps/v1/subscriptions/${originalTransactionId}`;
    console.log('[APPLE_VERIFY] Calling subscription status:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${jwt}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[APPLE_VERIFY] Subscription status error:', response.status, errorText);
      return { valid: false, entitled: false, error: `API error: ${response.status}` };
    }
    
    const data = await response.json();
    
    // Parse subscription groups and find active subscription
    if (data.data && Array.isArray(data.data)) {
      for (const group of data.data) {
        if (group.lastTransactions && Array.isArray(group.lastTransactions)) {
          for (const item of group.lastTransactions) {
            if (item.status === 1) { // 1 = Active
              const transaction = decodeJWSPayload(item.signedTransactionInfo);
              const expiresAt = transaction.expiresDate ? new Date(transaction.expiresDate) : undefined;
              
              return {
                valid: true,
                entitled: true,
                productId: transaction.productId,
                expiresAt,
                originalTransactionId: transaction.originalTransactionId,
                environment: transaction.environment === 'Sandbox' ? 'sandbox' : 'production'
              };
            }
          }
        }
      }
    }
    
    return { valid: true, entitled: false, error: 'No active subscription found' };
    
  } catch (error) {
    console.error('[APPLE_VERIFY] Subscription status error:', error);
    return { 
      valid: false, 
      entitled: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}
