import type { NextRequest } from 'next/server';
import { desc, inArray, like, or, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { attempt, subscription, user } from '@/lib/db/schema';
import { requireAdmin } from '@/lib/auth-helpers';
import { handle, json } from '@/lib/api-helpers';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return handle(async () => {
    await requireAdmin(request);
    const url = request.nextUrl;
    const q = url.searchParams.get('q')?.trim() ?? '';
    const limit = Math.min(
      200,
      Math.max(1, Number(url.searchParams.get('limit')) || 50),
    );

    const rows = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        createdAt: user.createdAt,
      })
      .from(user)
      .where(
        q ? or(like(user.email, `%${q}%`), like(user.name, `%${q}%`)) : undefined,
      )
      .orderBy(desc(user.createdAt))
      .limit(limit);
    const userIds = rows.map((r) => r.id);
    const subs = userIds.length
      ? await db
          .select()
          .from(subscription)
          .where(inArray(subscription.userId, userIds))
      : [];
    const subByUser = new Map(subs.map((s) => [s.userId, s] as const));
    const attemptCounts = userIds.length
      ? await db
          .select({
            userId: attempt.userId,
            total: sql<number>`count(*)::int`,
            completed: sql<number>`count(*) filter (where completed_at is not null)::int`,
          })
          .from(attempt)
          .where(inArray(attempt.userId, userIds))
          .groupBy(attempt.userId)
      : [];
    const countsByUser = new Map(
      attemptCounts.map((r) => [r.userId, r] as const),
    );
    return json({
      users: rows.map((u) => {
        const sub = subByUser.get(u.id);
        const c = countsByUser.get(u.id);
        return {
          ...u,
          subscription: sub
            ? {
                status: sub.status,
                currentPeriodEnd: sub.currentPeriodEnd,
                provider: sub.provider,
              }
            : null,
          attempts: { total: c?.total ?? 0, completed: c?.completed ?? 0 },
        };
      }),
    });
  });
}
