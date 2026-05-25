import { Router, type Response } from 'express';
import { and, asc, desc, eq, gte, inArray, like, or, sql } from 'drizzle-orm';
import { db } from '../db';
import {
  user,
  attempt,
  transaction,
  subscription,
  plan,
  course,
  subject,
  question,
  choice,
  contactSubmission,
} from '../db/schema';
import { requireAdmin } from '../middleware/requireAdmin';
import type { AuthedRequest } from '../middleware/requireAuth';

export const adminRouter = Router();
adminRouter.use(requireAdmin);

/* ============================================================
 * /whoami /stats
 * ============================================================ */
adminRouter.get('/whoami', async (req: AuthedRequest, res: Response) => {
  const [u] = await db
    .select({ id: user.id, name: user.name, email: user.email, isAdmin: user.isAdmin })
    .from(user)
    .where(eq(user.id, req.userId!));
  res.json({ user: u });
});

adminRouter.get('/stats', async (_req: AuthedRequest, res: Response) => {
  const usersRow = (
    await db.select({ users: sql<number>`count(*)::int` }).from(user)
  )[0];
  const adminsRow = (
    await db
      .select({ admins: sql<number>`count(*)::int` })
      .from(user)
      .where(eq(user.isAdmin, true))
  )[0];
  const activeSubsRow = (
    await db
      .select({ activeSubs: sql<number>`count(*)::int` })
      .from(subscription)
      .where(eq(subscription.status, 'active'))
  )[0];
  const paidUsersRow = (
    await db
      .select({ paidUsers: sql<number>`count(distinct user_id)::int` })
      .from(subscription)
      .where(eq(subscription.status, 'active'))
  )[0];
  const pendingTxRow = (
    await db
      .select({ pendingTx: sql<number>`count(*)::int` })
      .from(transaction)
      .where(eq(transaction.status, 'pending'))
  )[0];
  const totalAttemptsRow = (
    await db.select({ totalAttempts: sql<number>`count(*)::int` }).from(attempt)
  )[0];
  const completedAttemptsRow = (
    await db
      .select({ completedAttempts: sql<number>`count(*)::int` })
      .from(attempt)
      .where(sql`completed_at is not null`)
  )[0];
  const totalQuestionsRow = (
    await db
      .select({ totalQuestions: sql<number>`count(*)::int` })
      .from(question)
  )[0];
  const totalSubjectsRow = (
    await db.select({ totalSubjects: sql<number>`count(*)::int` }).from(subject)
  )[0];
  const revenueRow = (
    await db
      .select({
        revenueMinor: sql<number>`coalesce(sum(amount_minor_units), 0)::bigint`,
      })
      .from(transaction)
      .where(eq(transaction.status, 'succeeded'))
  )[0];

  res.json({
    users: {
      total: usersRow?.users ?? 0,
      admins: adminsRow?.admins ?? 0,
      paying: paidUsersRow?.paidUsers ?? 0,
    },
    subscriptions: { active: activeSubsRow?.activeSubs ?? 0 },
    transactions: {
      pending: pendingTxRow?.pendingTx ?? 0,
      revenueMinor: Number(revenueRow?.revenueMinor ?? 0),
    },
    attempts: {
      total: totalAttemptsRow?.totalAttempts ?? 0,
      completed: completedAttemptsRow?.completedAttempts ?? 0,
    },
    content: {
      questions: totalQuestionsRow?.totalQuestions ?? 0,
      subjects: totalSubjectsRow?.totalSubjects ?? 0,
    },
  });
});

/* ============================================================
 * /contact-submissions  — list / patch / delete
 * ============================================================ */
adminRouter.get('/contact-submissions', async (_req: AuthedRequest, res: Response) => {
  const rows = await db
    .select()
    .from(contactSubmission)
    .orderBy(desc(contactSubmission.createdAt))
    .limit(500);
  res.json({ submissions: rows });
});

adminRouter.patch(
  '/contact-submissions/:id',
  async (req: AuthedRequest, res: Response) => {
    const id = req.params.id!;
    const b = req.body as { handled?: boolean };
    if (typeof b.handled !== 'boolean') {
      res.status(400).json({ error: 'handled (boolean) required' });
      return;
    }
    await db
      .update(contactSubmission)
      .set({ handled: b.handled, updatedAt: new Date() })
      .where(eq(contactSubmission.id, id));
    res.json({ ack: true });
  },
);

adminRouter.delete(
  '/contact-submissions/:id',
  async (req: AuthedRequest, res: Response) => {
    await db
      .delete(contactSubmission)
      .where(eq(contactSubmission.id, req.params.id!));
    res.json({ ack: true });
  },
);

/* ============================================================
 * /payment-stats  — financial dashboard widgets
 * ============================================================ */
adminRouter.get('/payment-stats', async (_req: AuthedRequest, res: Response) => {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const startOfPrevMonth = new Date(startOfMonth);
  startOfPrevMonth.setMonth(startOfPrevMonth.getMonth() - 1);

  // total revenue (all-time succeeded)
  const [totals] = await db
    .select({
      totalRevenue: sql<number>`coalesce(sum(amount_minor_units), 0)::bigint`,
      txCount: sql<number>`count(*)::int`,
    })
    .from(transaction)
    .where(eq(transaction.status, 'succeeded'));

  // this month
  const [thisMonth] = await db
    .select({
      monthRevenue: sql<number>`coalesce(sum(amount_minor_units), 0)::bigint`,
      monthCount: sql<number>`count(*)::int`,
    })
    .from(transaction)
    .where(
      and(eq(transaction.status, 'succeeded'), gte(transaction.createdAt, startOfMonth)),
    );

  // prev month for delta
  const [prevMonth] = await db
    .select({
      revenue: sql<number>`coalesce(sum(amount_minor_units), 0)::bigint`,
    })
    .from(transaction)
    .where(
      and(
        eq(transaction.status, 'succeeded'),
        gte(transaction.createdAt, startOfPrevMonth),
        sql`created_at < ${startOfMonth.toISOString()}`,
      ),
    );

  // status breakdown
  const byStatus = await db
    .select({
      status: transaction.status,
      n: sql<number>`count(*)::int`,
      amount: sql<number>`coalesce(sum(amount_minor_units), 0)::bigint`,
    })
    .from(transaction)
    .groupBy(transaction.status);
  type StatusBucket = { count: number; amount: number };
  const status = {
    succeeded: { count: 0, amount: 0 } as StatusBucket,
    failed: { count: 0, amount: 0 } as StatusBucket,
    under_review: { count: 0, amount: 0 } as StatusBucket,
    pending: { count: 0, amount: 0 } as StatusBucket,
    refunded: { count: 0, amount: 0 } as StatusBucket,
  };
  for (const s of byStatus) {
    if (s.status in status) {
      (status as Record<string, StatusBucket>)[s.status] = {
        count: s.n,
        amount: Number(s.amount ?? 0),
      };
    }
  }

  // active subscriptions + MRR
  const activeSubs = await db
    .select({
      planId: subscription.planId,
      n: sql<number>`count(*)::int`,
    })
    .from(subscription)
    .where(eq(subscription.status, 'active'))
    .groupBy(subscription.planId);

  let mrrMinor = 0;
  let activeSubCount = 0;
  if (activeSubs.length > 0) {
    activeSubCount = activeSubs.reduce((s, r) => s + r.n, 0);
    const planIds = activeSubs.map((r) => r.planId);
    const plans = await db
      .select({ id: plan.id, price: plan.priceMinorUnits, interval: plan.interval })
      .from(plan)
      .where(inArray(plan.id, planIds));
    const planById = new Map(plans.map((p) => [p.id, p] as const));
    for (const r of activeSubs) {
      const p = planById.get(r.planId);
      if (!p) continue;
      const monthlyPrice = p.interval === 'year' ? Math.round(p.price / 12) : p.price;
      mrrMinor += monthlyPrice * r.n;
    }
  }

  const totalRevenue = Number(totals?.totalRevenue ?? 0);
  const monthRevenue = Number(thisMonth?.monthRevenue ?? 0);
  const prevMonthRevenue = Number(prevMonth?.revenue ?? 0);
  const succeededCount = status.succeeded.count;
  const avgTransactionMinor =
    succeededCount > 0 ? Math.round(totalRevenue / succeededCount) : 0;

  // success rate
  const allCount = Object.values(status as Record<string, StatusBucket>).reduce(
    (s, x) => s + x.count,
    0,
  );
  const successRate =
    allCount > 0 ? Math.round((succeededCount / allCount) * 1000) / 10 : null;

  // month-over-month delta
  let monthDeltaPct: number | null = null;
  if (prevMonthRevenue > 0) {
    monthDeltaPct = Math.round(((monthRevenue - prevMonthRevenue) / prevMonthRevenue) * 1000) / 10;
  } else if (monthRevenue > 0) {
    monthDeltaPct = null; // no prior baseline
  }

  res.json({
    currency: 'PKR',
    totalRevenue,
    monthRevenue,
    monthDeltaPct,
    avgTransactionMinor,
    mrrMinor,
    activeSubscriptions: activeSubCount,
    succeededCount: status.succeeded.count,
    failedCount: status.failed.count,
    underReviewCount: status.under_review.count,
    pendingCount: status.pending.count,
    refundedCount: status.refunded.count,
    successRate,
    breakdown: status,
  });
});

/* ============================================================
 * /users
 * ============================================================ */
adminRouter.get('/users', async (req: AuthedRequest, res: Response) => {
  const q = (req.query.q as string | undefined)?.trim();
  const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 50));
  const rows = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      createdAt: user.createdAt,
    })
    .from(user)
    .where(q ? or(like(user.email, `%${q}%`), like(user.name, `%${q}%`)) : undefined)
    .orderBy(desc(user.createdAt))
    .limit(limit);
  const userIds = rows.map((r) => r.id);
  const subs = userIds.length
    ? await db.select().from(subscription).where(inArray(subscription.userId, userIds))
    : [];
  const subByUser = new Map(subs.map((s) => [s.userId, s] as const));
  const attemptCounts = userIds.length
    ? await db
        .select({
          userId: attempt.userId,
          total: sql<number>`count(*)::int`,
          completed: sql<number>`count(*) filter (where completed_at is not null)::int`,
        })
        .from(attempt)
        .where(inArray(attempt.userId, userIds))
        .groupBy(attempt.userId)
    : [];
  const countsByUser = new Map(attemptCounts.map((r) => [r.userId, r] as const));
  res.json({
    users: rows.map((u) => {
      const sub = subByUser.get(u.id);
      const c = countsByUser.get(u.id);
      return {
        ...u,
        subscription: sub
          ? { status: sub.status, currentPeriodEnd: sub.currentPeriodEnd, provider: sub.provider }
          : null,
        attempts: { total: c?.total ?? 0, completed: c?.completed ?? 0 },
      };
    }),
  });
});

adminRouter.get('/users/:id', async (req: AuthedRequest, res: Response) => {
  const id = req.params.id!;
  const [u] = await db.select().from(user).where(eq(user.id, id));
  if (!u) {
    res.status(404).json({ error: 'user not found' });
    return;
  }
  const attempts = await db
    .select()
    .from(attempt)
    .where(eq(attempt.userId, id))
    .orderBy(desc(attempt.startedAt))
    .limit(50);
  const txs = await db
    .select()
    .from(transaction)
    .where(eq(transaction.userId, id))
    .orderBy(desc(transaction.createdAt))
    .limit(50);
  const subs = await db
    .select()
    .from(subscription)
    .where(eq(subscription.userId, id))
    .orderBy(desc(subscription.createdAt));
  res.json({
    user: {
      id: u.id,
      name: u.name,
      email: u.email,
      emailVerified: u.emailVerified,
      isAdmin: u.isAdmin,
      createdAt: u.createdAt,
    },
    attempts,
    transactions: txs,
    subscriptions: subs,
  });
});

adminRouter.patch('/users/:id', async (req: AuthedRequest, res: Response) => {
  const id = req.params.id!;
  const body = req.body as { isAdmin?: boolean; emailVerified?: boolean };
  const patch: Record<string, unknown> = {};
  if (typeof body.isAdmin === 'boolean') patch.isAdmin = body.isAdmin;
  if (typeof body.emailVerified === 'boolean') patch.emailVerified = body.emailVerified;
  if (Object.keys(patch).length === 0) {
    res.status(400).json({ error: 'no valid fields' });
    return;
  }
  patch.updatedAt = new Date();
  await db.update(user).set(patch).where(eq(user.id, id));
  res.json({ ack: true });
});

/* ============================================================
 * /transactions
 * ============================================================ */
adminRouter.get('/transactions', async (req: AuthedRequest, res: Response) => {
  const status = req.query.status as string | undefined;
  const rows = await db
    .select({
      id: transaction.id,
      orderId: transaction.providerOrderId,
      amountMinorUnits: transaction.amountMinorUnits,
      currency: transaction.currency,
      status: transaction.status,
      provider: transaction.provider,
      responseCode: transaction.providerResponseCode,
      createdAt: transaction.createdAt,
      userId: transaction.userId,
      userEmail: user.email,
      userName: user.name,
    })
    .from(transaction)
    .leftJoin(user, eq(user.id, transaction.userId))
    .where(
      status && status !== 'all'
        ? eq(
            transaction.status,
            status as 'pending' | 'succeeded' | 'failed' | 'under_review' | 'refunded',
          )
        : undefined,
    )
    .orderBy(desc(transaction.createdAt))
    .limit(200);
  res.json({ transactions: rows });
});

/* ============================================================
 * /courses
 * ============================================================ */
adminRouter.get('/courses', async (_req: AuthedRequest, res: Response) => {
  const rows = await db.select().from(course).orderBy(asc(course.sortOrder));
  const counts = await db
    .select({ courseId: subject.courseId, n: sql<number>`count(*)::int` })
    .from(subject)
    .groupBy(subject.courseId);
  const byCourse = new Map(counts.map((c) => [c.courseId, c.n] as const));
  res.json({
    courses: rows.map((c) => ({ ...c, subjectCount: byCourse.get(c.id) ?? 0 })),
  });
});

adminRouter.post('/courses', async (req: AuthedRequest, res: Response) => {
  const b = req.body as {
    slug?: string;
    name?: string;
    description?: string;
    sortOrder?: number;
    isPublished?: boolean;
  };
  if (!b.slug || !b.name) {
    res.status(400).json({ error: 'slug and name are required' });
    return;
  }
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
  res.status(201).json({ course: c });
});

adminRouter.patch('/courses/:id', async (req: AuthedRequest, res: Response) => {
  const id = req.params.id!;
  const b = req.body as Record<string, unknown>;
  const patch: Record<string, unknown> = {};
  for (const k of ['slug', 'name', 'description', 'sortOrder', 'isPublished']) {
    if (k in b) patch[k] = b[k];
  }
  if (!Object.keys(patch).length) {
    res.status(400).json({ error: 'no valid fields' });
    return;
  }
  patch.updatedAt = new Date();
  await db.update(course).set(patch).where(eq(course.id, id));
  res.json({ ack: true });
});

adminRouter.delete('/courses/:id', async (req: AuthedRequest, res: Response) => {
  await db.delete(course).where(eq(course.id, req.params.id!));
  res.json({ ack: true });
});

/* ============================================================
 * /subjects  — joined w/ course + question count via direct FK
 * ============================================================ */
adminRouter.get('/subjects', async (req: AuthedRequest, res: Response) => {
  const courseId = req.query.courseId as string | undefined;
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
  const byS = new Map(counts.map((c) => [c.subjectId, c.questionCount] as const));

  res.json({
    subjects: rows.map((s) => ({
      ...s,
      questionCount: byS.get(s.id) ?? 0,
    })),
  });
});

adminRouter.post('/subjects', async (req: AuthedRequest, res: Response) => {
  const b = req.body as {
    courseId?: string | null;
    slug?: string;
    name?: string;
    description?: string;
    sortOrder?: number;
  };
  if (!b.slug || !b.name) {
    res.status(400).json({ error: 'slug and name are required' });
    return;
  }
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
  res.status(201).json({ subject: s });
});

adminRouter.patch('/subjects/:id', async (req: AuthedRequest, res: Response) => {
  const id = req.params.id!;
  const b = req.body as Record<string, unknown>;
  const patch: Record<string, unknown> = {};
  for (const k of ['courseId', 'slug', 'name', 'description', 'sortOrder']) {
    if (k in b) patch[k] = b[k];
  }
  if (!Object.keys(patch).length) {
    res.status(400).json({ error: 'no valid fields' });
    return;
  }
  await db.update(subject).set(patch).where(eq(subject.id, id));
  res.json({ ack: true });
});

adminRouter.delete('/subjects/:id', async (req: AuthedRequest, res: Response) => {
  await db.delete(subject).where(eq(subject.id, req.params.id!));
  res.json({ ack: true });
});

/* ============================================================
 * /questions  — direct FK to subject
 * ============================================================ */
adminRouter.get('/questions', async (req: AuthedRequest, res: Response) => {
  const subjectId = req.query.subjectId as string | undefined;
  const courseId = req.query.courseId as string | undefined;
  const search = (req.query.q as string | undefined)?.trim();
  const limit = Math.min(500, Math.max(1, Number(req.query.limit) || 100));

  // resolve subject set when filtering by course
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
      res.json({ questions: [] });
      return;
    }
  }

  const whereParts: ReturnType<typeof eq>[] = [];
  if (subjectIdSet) whereParts.push(inArray(question.subjectId, subjectIdSet));
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

  res.json({
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

adminRouter.get('/questions/:id', async (req: AuthedRequest, res: Response) => {
  const id = req.params.id!;
  const [q] = await db
    .select({
      question: question,
      subject: subject,
    })
    .from(question)
    .leftJoin(subject, eq(subject.id, question.subjectId))
    .where(eq(question.id, id));
  if (!q) {
    res.status(404).json({ error: 'question not found' });
    return;
  }
  const cs = await db
    .select()
    .from(choice)
    .where(eq(choice.questionId, id))
    .orderBy(asc(choice.label));
  res.json({
    question: q.question,
    choices: cs,
    subject: q.subject
      ? { id: q.subject.id, slug: q.subject.slug, name: q.subject.name }
      : null,
  });
});

adminRouter.patch('/questions/:id', async (req: AuthedRequest, res: Response) => {
  const id = req.params.id!;
  const b = req.body as Record<string, unknown>;
  const patch: Record<string, unknown> = {};
  for (const k of ['vignette', 'explanation', 'difficulty', 'source', 'subjectId']) {
    if (k in b) patch[k] = b[k];
  }
  if (!Object.keys(patch).length) {
    res.status(400).json({ error: 'no valid fields' });
    return;
  }
  patch.updatedAt = new Date();
  await db.update(question).set(patch).where(eq(question.id, id));
  res.json({ ack: true });
});

/**
 * PUT /api/admin/questions/:id
 * Atomic full-question save — replaces question fields + all choices in one transaction.
 * body: { vignette, explanation, difficulty, subjectId?, source?,
 *         choices: [{ id, text, isCorrect, rationale? }] }
 */
adminRouter.put('/questions/:id', async (req: AuthedRequest, res: Response) => {
  const id = req.params.id!;
  const b = req.body as {
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
  };

  if (!b.vignette || !b.explanation || !Array.isArray(b.choices) || b.choices.length === 0) {
    res.status(400).json({
      error: 'vignette, explanation, and choices are required',
    });
    return;
  }
  const correctCount = b.choices.filter((c) => c.isCorrect).length;
  if (correctCount !== 1) {
    res.status(400).json({ error: 'exactly one choice must be marked correct' });
    return;
  }
  for (const c of b.choices) {
    if (!c.id || typeof c.text !== 'string' || !c.text.trim()) {
      res.status(400).json({ error: 'every choice needs a non-empty text and id' });
      return;
    }
  }

  const existing = await db.select().from(choice).where(eq(choice.questionId, id));
  if (existing.length === 0) {
    res.status(404).json({ error: 'question not found or has no choices' });
    return;
  }
  const validIds = new Set(existing.map((c) => c.id));
  for (const c of b.choices) {
    if (!validIds.has(c.id)) {
      res.status(400).json({ error: `choice id ${c.id} does not belong to this question` });
      return;
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

  res.json({ ack: true });
});

adminRouter.patch(
  '/questions/:id/choices/:choiceId',
  async (req: AuthedRequest, res: Response) => {
    const { id, choiceId } = req.params;
    const b = req.body as {
      text?: string;
      isCorrect?: boolean;
      rationale?: string | null;
    };
    const patch: Record<string, unknown> = {};
    if (typeof b.text === 'string') patch.text = b.text;
    if (typeof b.isCorrect === 'boolean') patch.isCorrect = b.isCorrect;
    if ('rationale' in b) patch.rationale = b.rationale ?? null;
    if (!Object.keys(patch).length) {
      res.status(400).json({ error: 'no valid fields' });
      return;
    }
    await db.transaction(async (tx) => {
      if (b.isCorrect === true) {
        await tx
          .update(choice)
          .set({ isCorrect: false })
          .where(eq(choice.questionId, id!));
      }
      await tx.update(choice).set(patch).where(eq(choice.id, choiceId!));
    });
    res.json({ ack: true });
  },
);

adminRouter.post('/questions', async (req: AuthedRequest, res: Response) => {
  const b = req.body as {
    vignette?: string;
    explanation?: string;
    difficulty?: 'easy' | 'medium' | 'hard';
    source?: string;
    subjectId?: string;
    choices?: { label: string; text: string; isCorrect: boolean; rationale?: string | null }[];
  };
  if (!b.vignette || !b.explanation || !b.choices || b.choices.length !== 5) {
    res.status(400).json({
      error: 'vignette, explanation, and exactly 5 choices are required',
    });
    return;
  }
  const correctCount = b.choices.filter((c) => c.isCorrect).length;
  if (correctCount !== 1) {
    res.status(400).json({ error: 'exactly one choice must be correct' });
    return;
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
  res.status(201).json({ id: created.id });
});

adminRouter.delete('/questions/:id', async (req: AuthedRequest, res: Response) => {
  await db.delete(question).where(eq(question.id, req.params.id!));
  res.json({ ack: true });
});
