import type { NextRequest } from 'next/server';
import { and, eq, gte, inArray, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { plan, subscription, transaction } from '@/lib/db/schema';
import { requireAdmin } from '@/lib/auth-helpers';
import { handle, json } from '@/lib/api-helpers';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return handle(async () => {
    await requireAdmin(request);

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const startOfPrevMonth = new Date(startOfMonth);
    startOfPrevMonth.setMonth(startOfPrevMonth.getMonth() - 1);

    const [totals] = await db
      .select({
        totalRevenue: sql<number>`coalesce(sum(amount_minor_units), 0)::bigint`,
        txCount: sql<number>`count(*)::int`,
      })
      .from(transaction)
      .where(eq(transaction.status, 'succeeded'));

    const [thisMonth] = await db
      .select({
        monthRevenue: sql<number>`coalesce(sum(amount_minor_units), 0)::bigint`,
        monthCount: sql<number>`count(*)::int`,
      })
      .from(transaction)
      .where(
        and(
          eq(transaction.status, 'succeeded'),
          gte(transaction.createdAt, startOfMonth),
        ),
      );

    const [prevMonth] = await db
      .select({
        revenue: sql<number>`coalesce(sum(amount_minor_units), 0)::bigint`,
      })
      .from(transaction)
      .where(
        and(
          eq(transaction.status, 'succeeded'),
          gte(transaction.createdAt, startOfPrevMonth),
          sql`created_at < ${startOfMonth.toISOString()}`,
        ),
      );

    const byStatus = await db
      .select({
        status: transaction.status,
        n: sql<number>`count(*)::int`,
        amount: sql<number>`coalesce(sum(amount_minor_units), 0)::bigint`,
      })
      .from(transaction)
      .groupBy(transaction.status);

    type StatusBucket = { count: number; amount: number };
    const status = {
      succeeded: { count: 0, amount: 0 } as StatusBucket,
      failed: { count: 0, amount: 0 } as StatusBucket,
      under_review: { count: 0, amount: 0 } as StatusBucket,
      pending: { count: 0, amount: 0 } as StatusBucket,
      refunded: { count: 0, amount: 0 } as StatusBucket,
    };
    for (const s of byStatus) {
      if (s.status in status) {
        (status as Record<string, StatusBucket>)[s.status] = {
          count: s.n,
          amount: Number(s.amount ?? 0),
        };
      }
    }

    const activeSubs = await db
      .select({
        planId: subscription.planId,
        n: sql<number>`count(*)::int`,
      })
      .from(subscription)
      .where(eq(subscription.status, 'active'))
      .groupBy(subscription.planId);

    let mrrMinor = 0;
    let activeSubCount = 0;
    if (activeSubs.length > 0) {
      activeSubCount = activeSubs.reduce((s, r) => s + r.n, 0);
      const planIds = activeSubs.map((r) => r.planId);
      const plans = await db
        .select({
          id: plan.id,
          price: plan.priceMinorUnits,
          interval: plan.interval,
        })
        .from(plan)
        .where(inArray(plan.id, planIds));
      const planById = new Map(plans.map((p) => [p.id, p] as const));
      for (const r of activeSubs) {
        const p = planById.get(r.planId);
        if (!p) continue;
        const monthlyPrice =
          p.interval === 'year' ? Math.round(p.price / 12) : p.price;
        mrrMinor += monthlyPrice * r.n;
      }
    }

    const totalRevenue = Number(totals?.totalRevenue ?? 0);
    const monthRevenue = Number(thisMonth?.monthRevenue ?? 0);
    const prevMonthRevenue = Number(prevMonth?.revenue ?? 0);
    const succeededCount = status.succeeded.count;
    const avgTransactionMinor =
      succeededCount > 0 ? Math.round(totalRevenue / succeededCount) : 0;

    const allCount = Object.values(
      status as Record<string, StatusBucket>,
    ).reduce((s, x) => s + x.count, 0);
    const successRate =
      allCount > 0
        ? Math.round((succeededCount / allCount) * 1000) / 10
        : null;

    let monthDeltaPct: number | null = null;
    if (prevMonthRevenue > 0) {
      monthDeltaPct =
        Math.round(((monthRevenue - prevMonthRevenue) / prevMonthRevenue) * 1000) / 10;
    } else if (monthRevenue > 0) {
      monthDeltaPct = null;
    }

    return json({
      currency: 'PKR',
      totalRevenue,
      monthRevenue,
      monthDeltaPct,
      avgTransactionMinor,
      mrrMinor,
      activeSubscriptions: activeSubCount,
      succeededCount: status.succeeded.count,
      failedCount: status.failed.count,
      underReviewCount: status.under_review.count,
      pendingCount: status.pending.count,
      refundedCount: status.refunded.count,
      successRate,
      breakdown: status,
    });
  });
}
