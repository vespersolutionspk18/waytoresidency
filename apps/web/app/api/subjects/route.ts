import type { NextRequest } from 'next/server';
import { asc, eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { subject, question, course } from '@/lib/db/schema';
import { requireUser } from '@/lib/auth-helpers';
import { handle, json } from '@/lib/api-helpers';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return handle(async () => {
    await requireUser(request);
    const rows = await db
      .select({
        id: subject.id,
        slug: subject.slug,
        name: subject.name,
        description: subject.description,
        courseId: subject.courseId,
        courseName: course.name,
        courseSlug: course.slug,
        sortOrder: subject.sortOrder,
      })
      .from(subject)
      .leftJoin(course, eq(course.id, subject.courseId))
      .orderBy(asc(subject.sortOrder));

    const counts = await db
      .select({
        subjectId: question.subjectId,
        questionCount: sql<number>`count(*)::int`,
      })
      .from(question)
      .groupBy(question.subjectId);
    const byS = new Map(counts.map((c) => [c.subjectId, c.questionCount] as const));

    return json({
      subjects: rows.map((s) => ({
        ...s,
        questionCount: byS.get(s.id) ?? 0,
      })),
    });
  });
}
