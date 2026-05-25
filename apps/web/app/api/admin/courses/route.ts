import type { NextRequest } from 'next/server';
import { asc, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { course, subject } from '@/lib/db/schema';
import { requireAdmin } from '@/lib/auth-helpers';
import { handle, json, error, readJson } from '@/lib/api-helpers';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return handle(async () => {
    await requireAdmin(request);
    const rows = await db.select().from(course).orderBy(asc(course.sortOrder));
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

export async function POST(request: NextRequest) {
  return handle(async () => {
    await requireAdmin(request);
    const b = await readJson<{
      slug?: string;
      name?: string;
      description?: string;
      sortOrder?: number;
      isPublished?: boolean;
    }>(request);
    if (!b.slug || !b.name) return error('slug and name are required', 400);
    const [c] = await db
      .insert(course)
      .values({
        slug: b.slug,
        name: b.name,
        description: b.description ?? null,
        sortOrder: Number(b.sortOrder) || 0,
        isPublished: b.isPublished ?? true,
      })
      .returning();
    return json({ course: c }, { status: 201 });
  });
}
