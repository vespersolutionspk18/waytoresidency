import type { NextRequest } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { attemptQuestion, choice, question } from '@/lib/db/schema';
import { requireUser } from '@/lib/auth-helpers';
import { handle, json, error, readJson } from '@/lib/api-helpers';
import {
  loadAttemptQuestion,
  loadOwnedAttempt,
  ATTEMPT_NOT_FOUND,
  ATTEMPT_COMPLETED,
  QUESTION_NOT_IN_ATTEMPT,
} from '@/lib/attempts-helpers';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return handle(async () => {
    const me = await requireUser(request);
    const { id } = await params;
    const body = await readJson<{
      attemptQuestionId?: string;
      selectedChoiceId?: string;
      timeSpentSeconds?: number;
    }>(request);

    if (!body.attemptQuestionId || !body.selectedChoiceId) {
      return error(
        'attemptQuestionId and selectedChoiceId are required',
        400,
      );
    }

    const att = await loadOwnedAttempt(id, me.id);
    if (!att) return error(ATTEMPT_NOT_FOUND.error, 404);
    if (att.completedAt) return error(ATTEMPT_COMPLETED.error, 409);

    const aq = await loadAttemptQuestion(body.attemptQuestionId, id);
    if (!aq) return error(QUESTION_NOT_IN_ATTEMPT.error, 404);

    const [chosen] = await db
      .select()
      .from(choice)
      .where(
        and(
          eq(choice.id, body.selectedChoiceId),
          eq(choice.questionId, aq.questionId),
        ),
      );
    if (!chosen) {
      return error('choice does not belong to this question', 400);
    }

    const submittedTime = Math.max(
      0,
      Math.floor(Number(body.timeSpentSeconds) || 0),
    );

    await db
      .update(attemptQuestion)
      .set({
        selectedChoiceId: chosen.id,
        isCorrect: chosen.isCorrect,
        timeSpentSeconds: Math.max(aq.timeSpentSeconds, submittedTime),
        answeredAt: new Date(),
      })
      .where(eq(attemptQuestion.id, aq.id));

    if (att.mode === 'tutor') {
      const allChoices = await db
        .select()
        .from(choice)
        .where(eq(choice.questionId, aq.questionId));
      const correct = allChoices.find((c) => c.isCorrect);
      const [qrow] = await db
        .select({ explanation: question.explanation })
        .from(question)
        .where(eq(question.id, aq.questionId));
      return json({
        ack: true,
        isCorrect: chosen.isCorrect,
        correctChoiceId: correct?.id ?? null,
        explanation: qrow?.explanation ?? null,
      });
    }

    return json({ ack: true });
  });
}
