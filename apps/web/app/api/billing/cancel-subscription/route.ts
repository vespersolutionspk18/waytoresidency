import type { NextRequest } from 'next/server';
import { desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { subscription } from '@/lib/db/schema';
import { requireUser } from '@/lib/auth-helpers';
import { handle, json, error } from '@/lib/api-helpers';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  return handle(async () => {
    const me = await requireUser(request);
    const [sub] = await db
      .select()
      .from(subscription)
      .where(eq(subscription.userId, me.id))
      .orderBy(desc(subscription.createdAt))
      .limit(1);
    if (!sub) return error('No subscription found', 404);
    if (sub.status === 'canceled' || sub.status === 'expired') {
      return error(`Subscription is already ${sub.status}`, 409);
    }
    await db
      .update(subscription)
      .set({
        cancelAtPeriodEnd: true,
        status: 'canceled',
        updatedAt: new Date(),
      })
      .where(eq(subscription.id, sub.id));
    return json({ ack: true });
  });
}
