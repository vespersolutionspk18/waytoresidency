import { Router, type Response } from 'express';
import { asc, eq, sql } from 'drizzle-orm';
import { db } from '../db';
import { subject, question, course } from '../db/schema';
import { requireAuth, type AuthedRequest } from '../middleware/requireAuth';

export const publicRouter = Router();
publicRouter.use(requireAuth);

/* GET /api/subjects  — for the user-facing tutor/quiz subject picker */
publicRouter.get('/subjects', async (_req: AuthedRequest, res: Response) => {
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

  res.json({
    subjects: rows.map((s) => ({
      ...s,
      questionCount: byS.get(s.id) ?? 0,
    })),
  });
});

/* GET /api/me/transactions — current user's transactions */
publicRouter.get('/me/transactions', async (req: AuthedRequest, res: Response) => {
  const userId = req.userId!;
  const { transaction } = await import('../db/schema');
  const { desc } = await import('drizzle-orm');
  const rows = await db
    .select({
      id: transaction.id,
      providerOrderId: transaction.providerOrderId,
      amountMinorUnits: transaction.amountMinorUnits,
      currency: transaction.currency,
      status: transaction.status,
      providerResponseCode: transaction.providerResponseCode,
      createdAt: transaction.createdAt,
    })
    .from(transaction)
    .where(eq(transaction.userId, userId))
    .orderBy(desc(transaction.createdAt))
    .limit(50);
  res.json({ transactions: rows });
});

/* GET /api/courses — list courses with subject counts */
publicRouter.get('/courses', async (_req: AuthedRequest, res: Response) => {
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
  res.json({
    courses: rows.map((c) => ({ ...c, subjectCount: byCourse.get(c.id) ?? 0 })),
  });
});
