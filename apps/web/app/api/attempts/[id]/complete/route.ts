import type { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { attempt, attemptQuestion } from '@/lib/db/schema';
import { requireUser } from '@/lib/auth-helpers';
import { handle, json, error } from '@/lib/api-helpers';
import { loadOwnedAttempt, ATTEMPT_NOT_FOUND } from '@/lib/attempts-helpers';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return handle(async () => {
    const me = await requireUser(request);
    const { id } = await params;

    const att = await loadOwnedAttempt(id, me.id);
    if (!att) return error(ATTEMPT_NOT_FOUND.error, 404);

    if (att.completedAt) {
      return json({
        ack: true,
        alreadyCompleted: true,
        score: {
          percent: att.scorePercent,
          correct: att.correctCount,
          wrong: att.wrongCount,
          skipped: att.skippedCount,
          total: att.questionCount,
        },
      });
    }

    const aqs = await db
      .select({
        isCorrect: attemptQuestion.isCorrect,
        selectedChoiceId: attemptQuestion.selectedChoiceId,
        answeredAt: attemptQuestion.answeredAt,
      })
      .from(attemptQuestion)
      .where(eq(attemptQuestion.attemptId, id));

    let correct = 0;
    let wrong = 0;
    let skipped = 0;
    for (const aq of aqs) {
      if (aq.isCorrect === true) correct++;
      else if (aq.isCorrect === false) wrong++;
      else skipped++; // explicit skip + "never answered"
    }
    const total = aqs.length;
    const scorePercent =
      total > 0 ? Math.round((correct / total) * 10000) / 100 : 0;

    await db
      .update(attempt)
      .set({
        completedAt: new Date(),
        correctCount: correct,
        wrongCount: wrong,
        skippedCount: skipped,
        scorePercent: String(scorePercent),
      })
      .where(eq(attempt.id, id));

    return json({
      ack: true,
      alreadyCompleted: false,
      score: {
        percent: scorePercent,
        correct,
        wrong,
        skipped,
        total,
      },
    });
  });
}
