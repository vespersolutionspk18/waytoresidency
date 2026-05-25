import type { NextRequest } from 'next/server';
import { desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { attempt, subscription, transaction, user } from '@/lib/db/schema';
import { requireAdmin } from '@/lib/auth-helpers';
import { handle, json, error, readJson } from '@/lib/api-helpers';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return handle(async () => {
    await requireAdmin(request);
    const { id } = await params;
    const [u] = await db.select().from(user).where(eq(user.id, id));
    if (!u) return error('user not found', 404);
    const attempts = await db
      .select()
      .from(attempt)
      .where(eq(attempt.userId, id))
      .orderBy(desc(attempt.startedAt))
      .limit(50);
    const txs = await db
      .select()
      .from(transaction)
      .where(eq(transaction.userId, id))
      .orderBy(desc(transaction.createdAt))
      .limit(50);
    const subs = await db
      .select()
      .from(subscription)
      .where(eq(subscription.userId, id))
      .orderBy(desc(subscription.createdAt));
    return json({
      user: {
        id: u.id,
        name: u.name,
        email: u.email,
        emailVerified: u.emailVerified,
        isAdmin: u.isAdmin,
        createdAt: u.createdAt,
      },
      attempts,
      transactions: txs,
      subscriptions: subs,
    });
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return handle(async () => {
    await requireAdmin(request);
    const { id } = await params;
    const body = await readJson<{
      isAdmin?: boolean;
      emailVerified?: boolean;
    }>(request);
    const patch: Record<string, unknown> = {};
    if (typeof body.isAdmin === 'boolean') patch.isAdmin = body.isAdmin;
    if (typeof body.emailVerified === 'boolean')
      patch.emailVerified = body.emailVerified;
    if (Object.keys(patch).length === 0) {
      return error('no valid fields', 400);
    }
    patch.updatedAt = new Date();
    await db.update(user).set(patch).where(eq(user.id, id));
    return json({ ack: true });
  });
}
