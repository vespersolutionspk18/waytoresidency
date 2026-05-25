import type { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { choice } from '@/lib/db/schema';
import { requireAdmin } from '@/lib/auth-helpers';
import { handle, json, error, readJson } from '@/lib/api-helpers';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; choiceId: string }> },
) {
  return handle(async () => {
    await requireAdmin(request);
    const { id, choiceId } = await params;
    const b = await readJson<{
      text?: string;
      isCorrect?: boolean;
      rationale?: string | null;
    }>(request);
    const patch: Record<string, unknown> = {};
    if (typeof b.text === 'string') patch.text = b.text;
    if (typeof b.isCorrect === 'boolean') patch.isCorrect = b.isCorrect;
    if ('rationale' in b) patch.rationale = b.rationale ?? null;
    if (!Object.keys(patch).length) {
      return error('no valid fields', 400);
    }
    await db.transaction(async (tx) => {
      // If we're marking this choice as the correct one, clear all the others
      // on the same question so the invariant (exactly one correct) holds.
      if (b.isCorrect === true) {
        await tx
          .update(choice)
          .set({ isCorrect: false })
          .where(eq(choice.questionId, id));
      }
      await tx.update(choice).set(patch).where(eq(choice.id, choiceId));
    });
    return json({ ack: true });
  });
}
