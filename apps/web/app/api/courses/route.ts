import type { NextRequest } from 'next/server';
import { asc, eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { course, subject } from '@/lib/db/schema';
import { requireUser } from '@/lib/auth-helpers';
import { handle, json } from '@/lib/api-helpers';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return handle(async () => {
    await requireUser(request);
    const rows = await db
      .select()
      .from(course)
      .where(eq(course.isPublished, true))
      .orderBy(asc(course.sortOrder));
    const counts = await db
      .select({ courseId: subject.courseId, n: sql<number>`count(*)::int` })
      .from(subject)
      .groupBy(subject.courseId);
    const byCourse = new Map(counts.map((c) => [c.courseId, c.n] as const));
    return json({
      courses: rows.map((c) => ({
        ...c,
        subjectCount: byCourse.get(c.id) ?? 0,
      })),
    });
  });
}
