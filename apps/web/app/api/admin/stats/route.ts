import type { NextRequest } from 'next/server';
import { eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import {
  attempt,
  question,
  subject,
  subscription,
  transaction,
  user,
} from '@/lib/db/schema';
import { requireAdmin } from '@/lib/auth-helpers';
import { handle, json } from '@/lib/api-helpers';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return handle(async () => {
    await requireAdmin(request);

    const usersRow = (
      await db.select({ users: sql<number>`count(*)::int` }).from(user)
    )[0];
    const adminsRow = (
      await db
        .select({ admins: sql<number>`count(*)::int` })
        .from(user)
        .where(eq(user.isAdmin, true))
    )[0];
    const activeSubsRow = (
      await db
        .select({ activeSubs: sql<number>`count(*)::int` })
        .from(subscription)
        .where(eq(subscription.status, 'active'))
    )[0];
    const paidUsersRow = (
      await db
        .select({
          paidUsers: sql<number>`count(distinct user_id)::int`,
        })
        .from(subscription)
        .where(eq(subscription.status, 'active'))
    )[0];
    const pendingTxRow = (
      await db
        .select({ pendingTx: sql<number>`count(*)::int` })
        .from(transaction)
        .where(eq(transaction.status, 'pending'))
    )[0];
    const totalAttemptsRow = (
      await db
        .select({ totalAttempts: sql<number>`count(*)::int` })
        .from(attempt)
    )[0];
    const completedAttemptsRow = (
      await db
        .select({ completedAttempts: sql<number>`count(*)::int` })
        .from(attempt)
        .where(sql`completed_at is not null`)
    )[0];
    const totalQuestionsRow = (
      await db
        .select({ totalQuestions: sql<number>`count(*)::int` })
        .from(question)
    )[0];
    const totalSubjectsRow = (
      await db
        .select({ totalSubjects: sql<number>`count(*)::int` })
        .from(subject)
    )[0];
    const revenueRow = (
      await db
        .select({
          revenueMinor: sql<number>`coalesce(sum(amount_minor_units), 0)::bigint`,
        })
        .from(transaction)
        .where(eq(transaction.status, 'succeeded'))
    )[0];

    return json({
      users: {
        total: usersRow?.users ?? 0,
        admins: adminsRow?.admins ?? 0,
        paying: paidUsersRow?.paidUsers ?? 0,
      },
      subscriptions: { active: activeSubsRow?.activeSubs ?? 0 },
      transactions: {
        pending: pendingTxRow?.pendingTx ?? 0,
        revenueMinor: Number(revenueRow?.revenueMinor ?? 0),
      },
      attempts: {
        total: totalAttemptsRow?.totalAttempts ?? 0,
        completed: completedAttemptsRow?.completedAttempts ?? 0,
      },
      content: {
        questions: totalQuestionsRow?.totalQuestions ?? 0,
        subjects: totalSubjectsRow?.totalSubjects ?? 0,
      },
    });
  });
}
