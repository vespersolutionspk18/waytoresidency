import { and, eq } from 'drizzle-orm';
import { db } from './db';
import { attempt, attemptQuestion } from './db/schema';

export const ATTEMPT_NOT_FOUND = { error: 'attempt not found' } as const;
export const QUESTION_NOT_IN_ATTEMPT = {
  error: 'question not in attempt',
} as const;
export const ATTEMPT_COMPLETED = {
  error: 'attempt already completed',
} as const;

/** Verify attempt exists and belongs to the user. */
export async function loadOwnedAttempt(attemptId: string, userId: string) {
  const [att] = await db
    .select()
    .from(attempt)
    .where(and(eq(attempt.id, attemptId), eq(attempt.userId, userId)));
  return att ?? null;
}

/** Load an attempt_question row and confirm it belongs to the given attempt. */
export async function loadAttemptQuestion(aqId: string, attemptId: string) {
  if (!aqId) return null;
  const [aq] = await db
    .select()
    .from(attemptQuestion)
    .where(
      and(
        eq(attemptQuestion.id, aqId),
        eq(attemptQuestion.attemptId, attemptId),
      ),
    );
  return aq ?? null;
}
