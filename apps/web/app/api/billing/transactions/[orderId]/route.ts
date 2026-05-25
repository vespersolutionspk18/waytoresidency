import type { NextRequest } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { plan, transaction } from '@/lib/db/schema';
import { requireUser } from '@/lib/auth-helpers';
import { handle, json, error } from '@/lib/api-helpers';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> },
) {
  return handle(async () => {
    const me = await requireUser(request);
    const { orderId } = await params;

    const [tx] = await db
      .select()
      .from(transaction)
      .where(
        and(
          eq(transaction.providerOrderId, orderId),
          eq(transaction.userId, me.id),
        ),
      );
    if (!tx) return error('transaction not found', 404);

    const [p] = await db.select().from(plan).where(eq(plan.id, tx.planId));
    return json({
      transaction: {
        id: tx.id,
        orderId: tx.providerOrderId,
        amountMinorUnits: tx.amountMinorUnits,
        currency: tx.currency,
        status: tx.status,
        responseCode: tx.providerResponseCode,
        responseMessage: tx.providerResponseMessage,
        createdAt: tx.createdAt,
        updatedAt: tx.updatedAt,
      },
      plan: p
        ? {
            slug: p.slug,
            name: p.name,
            priceMinorUnits: p.priceMinorUnits,
            currency: p.currency,
            interval: p.interval,
          }
        : null,
    });
  });
}
