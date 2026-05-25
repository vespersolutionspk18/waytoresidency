import type { NextRequest } from 'next/server';
import { asc, eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { course, question, subject } from '@/lib/db/schema';
import { requireAdmin } from '@/lib/auth-helpers';
import { handle, json, error, readJson } from '@/lib/api-helpers';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return handle(async () => {
    await requireAdmin(request);
    const courseId = request.nextUrl.searchParams.get('courseId') ?? undefined;
    const rows = await db
      .select({
        id: subject.id,
        courseId: subject.courseId,
        slug: subject.slug,
        name: subject.name,
        description: subject.description,
        sortOrder: subject.sortOrder,
        courseName: course.name,
        courseSlug: course.slug,
      })
      .from(subject)
      .leftJoin(course, eq(course.id, subject.courseId))
      .where(courseId ? eq(subject.courseId, courseId) : undefined)
      .orderBy(asc(subject.sortOrder));

    const counts = await db
      .select({
        subjectId: question.subjectId,
        questionCount: sql<number>`count(*)::int`,
      })
      .from(question)
      .groupBy(question.subjectId);
    const byS = new Map(
      counts.map((c) => [c.subjectId, c.questionCount] as const),
    );

    return json({
      subjects: rows.map((s) => ({
        ...s,
        questionCount: byS.get(s.id) ?? 0,
      })),
    });
  });
}

export async function POST(request: NextRequest) {
  return handle(async () => {
    await requireAdmin(request);
    const b = await readJson<{
      courseId?: string | null;
      slug?: string;
      name?: string;
      description?: string;
      sortOrder?: number;
    }>(request);
    if (!b.slug || !b.name) return error('slug and name are required', 400);
    const [s] = await db
      .insert(subject)
      .values({
        courseId: b.courseId ?? null,
        slug: b.slug,
        name: b.name,
        description: b.description ?? null,
        sortOrder: Number(b.sortOrder) || 0,
      })
      .returning();
    return json({ subject: s }, { status: 201 });
  });
}
