import type { NextRequest } from 'next/server';
import { desc, eq, inArray, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { attempt, attemptQuestion, question } from '@/lib/db/schema';
import { requireUser } from '@/lib/auth-helpers';
import { handle, json, error, readJson } from '@/lib/api-helpers';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return handle(async () => {
    const me = await requireUser(request);
    const rows = await db
      .select({
        id: attempt.id,
        mode: attempt.mode,
        questionCount: attempt.questionCount,
        startedAt: attempt.startedAt,
        completedAt: attempt.completedAt,
        scorePercent: attempt.scorePercent,
        correctCount: attempt.correctCount,
        wrongCount: attempt.wrongCount,
        skippedCount: attempt.skippedCount,
      })
      .from(attempt)
      .where(eq(attempt.userId, me.id))
      .orderBy(desc(attempt.startedAt))
      .limit(20);
    return json({ attempts: rows });
  });
}

export async function POST(request: NextRequest) {
  return handle(async () => {
    const me = await requireUser(request);
    const body = await readJson<{
      mode?: unknown;
      questionCount?: unknown;
      timeLimitSeconds?: unknown;
      subjectIds?: unknown;
    }>(request);

    const mode = body.mode === 'quiz' ? 'quiz' : 'tutor';
    const rawCount = Number(body.questionCount);
    if (!Number.isFinite(rawCount) || rawCount < 1) {
      return error('questionCount must be a positive integer', 400);
    }
    const questionCount = Math.max(1, Math.min(60, Math.floor(rawCount)));

    let timeLimitSeconds: number | null = null;
    if (mode === 'quiz') {
      const rawTime = Number(body.timeLimitSeconds);
      timeLimitSeconds =
        Number.isFinite(rawTime) && rawTime > 0
          ? Math.floor(rawTime)
          : questionCount * 60;
      timeLimitSeconds = Math.max(30, Math.min(60 * 60 * 4, timeLimitSeconds));
    }

    const subjectIds = Array.isArray(body.subjectIds)
      ? (body.subjectIds as unknown[]).filter(
          (s): s is string => typeof s === 'string' && s.length > 0,
        )
      : [];

    const picks = await db
      .select({ id: question.id })
      .from(question)
      .where(
        subjectIds.length > 0
          ? inArray(question.subjectId, subjectIds)
          : undefined,
      )
      .orderBy(sql`RANDOM()`)
      .limit(questionCount);

    if (picks.length === 0) {
      return error('no questions available in the bank', 409);
    }

    const created = await db.transaction(async (tx) => {
      const [att] = await tx
        .insert(attempt)
        .values({
          userId: me.id,
          mode,
          questionCount: picks.length,
          timeLimitSeconds,
        })
        .returning();
      if (!att) throw new Error('failed to insert attempt');

      await tx.insert(attemptQuestion).values(
        picks.map((p, i) => ({
          attemptId: att.id,
          questionId: p.id,
          orderIndex: i,
        })),
      );

      return att;
    });

    return json({ id: created.id }, { status: 201 });
  });
}
