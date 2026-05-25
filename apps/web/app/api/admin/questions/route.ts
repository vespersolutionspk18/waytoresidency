import type { NextRequest } from 'next/server';
import { and, desc, eq, inArray, like } from 'drizzle-orm';
import { db } from '@/lib/db';
import { choice, question, subject } from '@/lib/db/schema';
import { requireAdmin } from '@/lib/auth-helpers';
import { handle, json, error, readJson } from '@/lib/api-helpers';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return handle(async () => {
    await requireAdmin(request);
    const url = request.nextUrl;
    const subjectId = url.searchParams.get('subjectId') ?? undefined;
    const courseId = url.searchParams.get('courseId') ?? undefined;
    const search = url.searchParams.get('q')?.trim() ?? '';
    const limit = Math.min(
      500,
      Math.max(1, Number(url.searchParams.get('limit')) || 100),
    );

    let subjectIdSet: string[] | null = null;
    if (subjectId) {
      subjectIdSet = [subjectId];
    } else if (courseId) {
      const ss = await db
        .select({ id: subject.id })
        .from(subject)
        .where(eq(subject.courseId, courseId));
      subjectIdSet = ss.map((s) => s.id);
      if (subjectIdSet.length === 0) {
        return json({ questions: [] });
      }
    }

    const whereParts: ReturnType<typeof eq>[] = [];
    if (subjectIdSet)
      whereParts.push(inArray(question.subjectId, subjectIdSet));
    if (search) whereParts.push(like(question.vignette, `%${search}%`));

    const rows = await db
      .select({
        id: question.id,
        vignette: question.vignette,
        difficulty: question.difficulty,
        source: question.source,
        createdAt: question.createdAt,
        subjectId: question.subjectId,
        subjectSlug: subject.slug,
        subjectName: subject.name,
      })
      .from(question)
      .leftJoin(subject, eq(subject.id, question.subjectId))
      .where(whereParts.length ? and(...whereParts) : undefined)
      .orderBy(desc(question.createdAt))
      .limit(limit);

    return json({
      questions: rows.map((r) => ({
        id: r.id,
        vignette: r.vignette,
        difficulty: r.difficulty,
        source: r.source,
        createdAt: r.createdAt,
        subject: r.subjectId
          ? { id: r.subjectId, slug: r.subjectSlug!, name: r.subjectName! }
          : null,
      })),
    });
  });
}

export async function POST(request: NextRequest) {
  return handle(async () => {
    await requireAdmin(request);
    const b = await readJson<{
      vignette?: string;
      explanation?: string;
      difficulty?: 'easy' | 'medium' | 'hard';
      source?: string;
      subjectId?: string;
      choices?: {
        label: string;
        text: string;
        isCorrect: boolean;
        rationale?: string | null;
      }[];
    }>(request);
    if (
      !b.vignette ||
      !b.explanation ||
      !b.choices ||
      b.choices.length !== 5
    ) {
      return error(
        'vignette, explanation, and exactly 5 choices are required',
        400,
      );
    }
    const correctCount = b.choices.filter((c) => c.isCorrect).length;
    if (correctCount !== 1) {
      return error('exactly one choice must be correct', 400);
    }
    const created = await db.transaction(async (tx) => {
      const [q] = await tx
        .insert(question)
        .values({
          subjectId: b.subjectId ?? null,
          vignette: b.vignette!,
          explanation: b.explanation!,
          difficulty: b.difficulty ?? 'medium',
          source: b.source ?? 'manual',
        })
        .returning();
      await tx.insert(choice).values(
        b.choices!.map((c) => ({
          questionId: q!.id,
          label: c.label,
          text: c.text,
          isCorrect: c.isCorrect,
          rationale: c.rationale ?? null,
        })),
      );
      return q!;
    });
    return json({ id: created.id }, { status: 201 });
  });
}
