import type { NextRequest } from 'next/server';
import { desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { transaction } from '@/lib/db/schema';
import { requireUser } from '@/lib/auth-helpers';
import { handle, json } from '@/lib/api-helpers';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return handle(async () => {
    const me = await requireUser(request);
    const rows = await db
      .select({
        id: transaction.id,
        providerOrderId: transaction.providerOrderId,
        amountMinorUnits: transaction.amountMinorUnits,
        currency: transaction.currency,
        status: transaction.status,
        providerResponseCode: transaction.providerResponseCode,
        createdAt: transaction.createdAt,
      })
      .from(transaction)
      .where(eq(transaction.userId, me.id))
      .orderBy(desc(transaction.createdAt))
      .limit(50);
    return json({ transactions: rows });
  });
}
