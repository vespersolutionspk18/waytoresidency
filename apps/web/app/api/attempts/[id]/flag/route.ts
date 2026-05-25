import type { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { attemptQuestion } from '@/lib/db/schema';
import { requireUser } from '@/lib/auth-helpers';
import { handle, json, error, readJson } from '@/lib/api-helpers';
import {
  loadAttemptQuestion,
  loadOwnedAttempt,
  ATTEMPT_NOT_FOUND,
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
      flagged?: boolean;
    }>(request);

    if (!body.attemptQuestionId || typeof body.flagged !== 'boolean') {
      return error(
        'attemptQuestionId and flagged (boolean) are required',
        400,
      );
    }

    const att = await loadOwnedAttempt(id, me.id);
    if (!att) return error(ATTEMPT_NOT_FOUND.error, 404);

    const aq = await loadAttemptQuestion(body.attemptQuestionId, id);
    if (!aq) return error(QUESTION_NOT_IN_ATTEMPT.error, 404);

    await db
      .update(attemptQuestion)
      .set({ flagged: body.flagged })
      .where(eq(attemptQuestion.id, aq.id));

    return json({ ack: true, flagged: body.flagged });
  });
}
