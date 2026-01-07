import { db } from '@/lib/db';
import { entitlementRecords } from '@/shared/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const installId = url.searchParams.get('installId');

    if (!installId) {
      return Response.json(
        { error: 'installId is required' },
        { status: 400 }
      );
    }

    console.log('[BILLING_STATUS] Checking status for installId:', installId);

    const record = await db
      .select()
      .from(entitlementRecords)
      .where(eq(entitlementRecords.installId, installId))
      .limit(1);

    if (!record.length) {
      console.log('[BILLING_STATUS] No record found, returning free');
      return Response.json({
        entitlement: 'free',
        expiresAt: null,
        source: 'server',
      });
    }

    const entitlement = record[0];
    const now = new Date();
    const isExpired = entitlement.expiresAt && new Date(entitlement.expiresAt) < now;

    if (isExpired) {
      console.log('[BILLING_STATUS] Subscription expired for installId:', installId);
      return Response.json({
        entitlement: 'free',
        expiresAt: entitlement.expiresAt?.toISOString() || null,
        source: 'server',
        expired: true,
      });
    }

    console.log('[BILLING_STATUS] Returning entitlement:', entitlement.entitlement);
    return Response.json({
      entitlement: entitlement.entitlement,
      expiresAt: entitlement.expiresAt?.toISOString() || null,
      source: 'server',
    });
  } catch (error) {
    console.error('[BILLING_STATUS] Error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
