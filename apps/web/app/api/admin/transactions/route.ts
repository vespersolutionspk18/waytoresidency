import type { NextRequest } from 'next/server';
import { desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { transaction, user } from '@/lib/db/schema';
import { requireAdmin } from '@/lib/auth-helpers';
import { handle, json } from '@/lib/api-helpers';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return handle(async () => {
    await requireAdmin(request);
    const status = request.nextUrl.searchParams.get('status') ?? undefined;
    const rows = await db
      .select({
        id: transaction.id,
        orderId: transaction.providerOrderId,
        amountMinorUnits: transaction.amountMinorUnits,
        currency: transaction.currency,
        status: transaction.status,
        provider: transaction.provider,
        responseCode: transaction.providerResponseCode,
        createdAt: transaction.createdAt,
        userId: transaction.userId,
        userEmail: user.email,
        userName: user.name,
      })
      .from(transaction)
      .leftJoin(user, eq(user.id, transaction.userId))
      .where(
        status && status !== 'all'
          ? eq(
              transaction.status,
              status as
                | 'pending'
                | 'succeeded'
                | 'failed'
                | 'under_review'
                | 'refunded',
            )
          : undefined,
      )
      .orderBy(desc(transaction.createdAt))
      .limit(200);
    return json({ transactions: rows });
  });
}
