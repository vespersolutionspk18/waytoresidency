import type { NextRequest } from 'next/server';
import { asc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { choice, question, subject } from '@/lib/db/schema';
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
    const [q] = await db
      .select({ question: question, subject: subject })
      .from(question)
      .leftJoin(subject, eq(subject.id, question.subjectId))
      .where(eq(question.id, id));
    if (!q) return error('question not found', 404);
    const cs = await db
      .select()
      .from(choice)
      .where(eq(choice.questionId, id))
      .orderBy(asc(choice.label));
    return json({
      question: q.question,
      choices: cs,
      subject: q.subject
        ? { id: q.subject.id, slug: q.subject.slug, name: q.subject.name }
        : null,
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
    const b = await readJson<Record<string, unknown>>(request);
    const patch: Record<string, unknown> = {};
    for (const k of [
      'vignette',
      'explanation',
      'difficulty',
      'source',
      'subjectId',
    ]) {
      if (k in b) patch[k] = b[k];
    }
    if (!Object.keys(patch).length) {
      return error('no valid fields', 400);
    }
    patch.updatedAt = new Date();
    await db.update(question).set(patch).where(eq(question.id, id));
    return json({ ack: true });
  });
}

/**
 * PUT — Atomic full-question save: replaces question fields + all choices in one transaction.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return handle(async () => {
    await requireAdmin(request);
    const { id } = await params;
    const b = await readJson<{
      vignette?: string;
      explanation?: string;
      difficulty?: 'easy' | 'medium' | 'hard';
      subjectId?: string | null;
      source?: string | null;
      choices?: {
        id: string;
        text: string;
        isCorrect: boolean;
        rationale?: string | null;
      }[];
    }>(request);

    if (
      !b.vignette ||
      !b.explanation ||
      !Array.isArray(b.choices) ||
      b.choices.length === 0
    ) {
      return error('vignette, explanation, and choices are required', 400);
    }
    const correctCount = b.choices.filter((c) => c.isCorrect).length;
    if (correctCount !== 1) {
      return error('exactly one choice must be marked correct', 400);
    }
    for (const c of b.choices) {
      if (!c.id || typeof c.text !== 'string' || !c.text.trim()) {
        return error('every choice needs a non-empty text and id', 400);
      }
    }

    const existing = await db
      .select()
      .from(choice)
      .where(eq(choice.questionId, id));
    if (existing.length === 0) {
      return error('question not found or has no choices', 404);
    }
    const validIds = new Set(existing.map((c) => c.id));
    for (const c of b.choices) {
      if (!validIds.has(c.id)) {
        return error(
          `choice id ${c.id} does not belong to this question`,
          400,
        );
      }
    }

    await db.transaction(async (tx) => {
      await tx
        .update(question)
        .set({
          vignette: b.vignette!,
          explanation: b.explanation!,
          difficulty: b.difficulty ?? 'medium',
          subjectId: b.subjectId ?? null,
          ...(b.source !== undefined ? { source: b.source } : {}),
          updatedAt: new Date(),
        })
        .where(eq(question.id, id));
      for (const c of b.choices!) {
        await tx
          .update(choice)
          .set({
            text: c.text,
            isCorrect: c.isCorrect,
            rationale: c.rationale ?? null,
          })
          .where(eq(choice.id, c.id));
      }
    });

    return json({ ack: true });
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return handle(async () => {
    await requireAdmin(request);
    const { id } = await params;
    await db.delete(question).where(eq(question.id, id));
    return json({ ack: true });
  });
}
