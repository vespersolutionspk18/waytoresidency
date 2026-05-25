import { Router, type Response } from 'express';
import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import { db } from '../db';
import {
  attempt,
  attemptQuestion,
  question,
  choice,
  subject,
} from '../db/schema';
import { requireAuth, type AuthedRequest } from '../middleware/requireAuth';

export const attemptsRouter = Router();

attemptsRouter.use(requireAuth);

// Helper route exposed under the same base — listed in `routes/index` mount: GET /api/subjects
// Re-using requireAuth router is convenient but we want a separate prefix; see app mount.

const ATTEMPT_NOT_FOUND = { error: 'attempt not found' };
const QUESTION_NOT_IN_ATTEMPT = { error: 'question not in attempt' };
const ATTEMPT_COMPLETED = { error: 'attempt already completed' };

/** Verify attempt exists and belongs to the user. Returns the row or null. */
async function loadOwnedAttempt(attemptId: string, userId: string) {
  const [att] = await db
    .select()
    .from(attempt)
    .where(and(eq(attempt.id, attemptId), eq(attempt.userId, userId)));
  return att ?? null;
}

/** Load an attempt_question row and confirm it belongs to the given attempt. */
async function loadAttemptQuestion(aqId: string, attemptId: string) {
  if (!aqId) return null;
  const [aq] = await db
    .select()
    .from(attemptQuestion)
    .where(
      and(eq(attemptQuestion.id, aqId), eq(attemptQuestion.attemptId, attemptId)),
    );
  return aq ?? null;
}

/* ============================================================
 * GET /api/attempts  — recent attempts (for dashboard "history")
 * ============================================================ */
attemptsRouter.get('/', async (req: AuthedRequest, res: Response) => {
  const userId = req.userId!;
  const rows = await db
    .select({
      id: attempt.id,
      mode: attempt.mode,
      questionCount: attempt.questionCount,
      startedAt: attempt.startedAt,
      completedAt: attempt.completedAt,
      scorePercent: attempt.scorePercent,
      correctCount: attempt.correctCount,
      wrongCount: attempt.wrongCount,
      skippedCount: attempt.skippedCount,
    })
    .from(attempt)
    .where(eq(attempt.userId, userId))
    .orderBy(desc(attempt.startedAt))
    .limit(20);
  res.json({ attempts: rows });
});

/* ============================================================
 * POST /api/attempts  — create new tutor or quiz attempt
 * body: { mode: 'tutor' | 'quiz', questionCount: number, timeLimitSeconds?: number | null }
 * ============================================================ */
attemptsRouter.post('/', async (req: AuthedRequest, res: Response) => {
  const userId = req.userId!;
  const body = req.body as {
    mode?: unknown;
    questionCount?: unknown;
    timeLimitSeconds?: unknown;
    subjectIds?: unknown;
  };

  const mode = body.mode === 'quiz' ? 'quiz' : 'tutor';
  const rawCount = Number(body.questionCount);
  if (!Number.isFinite(rawCount) || rawCount < 1) {
    res.status(400).json({ error: 'questionCount must be a positive integer' });
    return;
  }
  const questionCount = Math.max(1, Math.min(60, Math.floor(rawCount)));

  let timeLimitSeconds: number | null = null;
  if (mode === 'quiz') {
    const rawTime = Number(body.timeLimitSeconds);
    timeLimitSeconds = Number.isFinite(rawTime) && rawTime > 0
      ? Math.floor(rawTime)
      : questionCount * 60;
    timeLimitSeconds = Math.max(30, Math.min(60 * 60 * 4, timeLimitSeconds));
  }

  // Optional subject filter — empty array or undefined means "all subjects"
  const subjectIds = Array.isArray(body.subjectIds)
    ? body.subjectIds.filter((s): s is string => typeof s === 'string' && s.length > 0)
    : [];

  // pick random questions, scoped to selected subjects if any
  const picks = await db
    .select({ id: question.id })
    .from(question)
    .where(subjectIds.length > 0 ? inArray(question.subjectId, subjectIds) : undefined)
    .orderBy(sql`RANDOM()`)
    .limit(questionCount);

  if (picks.length === 0) {
    res.status(409).json({ error: 'no questions available in the bank' });
    return;
  }

  try {
    const created = await db.transaction(async (tx) => {
      const [att] = await tx
        .insert(attempt)
        .values({
          userId,
          mode,
          questionCount: picks.length,
          timeLimitSeconds,
        })
        .returning();
      if (!att) throw new Error('failed to insert attempt');

      await tx.insert(attemptQuestion).values(
        picks.map((p, i) => ({
          attemptId: att.id,
          questionId: p.id,
          orderIndex: i,
        })),
      );

      return att;
    });

    res.status(201).json({ id: created.id });
  } catch (err) {
    console.error('attempt create failed', err);
    res.status(500).json({ error: 'could not create attempt' });
  }
});

/* ============================================================
 * GET /api/attempts/:id  — hydrate full runtime state
 * ============================================================ */
attemptsRouter.get('/:id', async (req: AuthedRequest, res: Response) => {
  const id = req.params.id!;
  const userId = req.userId!;

  const att = await loadOwnedAttempt(id, userId);
  if (!att) {
    res.status(404).json(ATTEMPT_NOT_FOUND);
    return;
  }

  const aqs = await db
    .select({
      attemptQuestionId: attemptQuestion.id,
      orderIndex: attemptQuestion.orderIndex,
      questionId: attemptQuestion.questionId,
      selectedChoiceId: attemptQuestion.selectedChoiceId,
      isCorrect: attemptQuestion.isCorrect,
      flagged: attemptQuestion.flagged,
      timeSpentSeconds: attemptQuestion.timeSpentSeconds,
      answeredAt: attemptQuestion.answeredAt,
    })
    .from(attemptQuestion)
    .where(eq(attemptQuestion.attemptId, id))
    .orderBy(attemptQuestion.orderIndex);

  if (aqs.length === 0) {
    res.json({ ...att, questions: [] });
    return;
  }

  const qIds = aqs.map((a) => a.questionId);

  const [qs, cs] = await Promise.all([
    db
      .select({
        id: question.id,
        vignette: question.vignette,
        explanation: question.explanation,
        subjectId: question.subjectId,
        subjectName: subject.name,
        subjectSlug: subject.slug,
      })
      .from(question)
      .leftJoin(subject, eq(subject.id, question.subjectId))
      .where(inArray(question.id, qIds)),
    db.select().from(choice).where(inArray(choice.questionId, qIds)),
  ]);

  const qById = new Map(qs.map((q) => [q.id, q]));
  const choicesByQ = new Map<string, typeof cs>();
  for (const c of cs) {
    const arr = choicesByQ.get(c.questionId) ?? [];
    arr.push(c);
    choicesByQ.set(c.questionId, arr);
  }

  const isCompleted = !!att.completedAt;
  const isTutor = att.mode === 'tutor';

  const questions = aqs.map((aq) => {
    const q = qById.get(aq.questionId)!;
    const cs = (choicesByQ.get(aq.questionId) ?? []).sort((a, b) =>
      a.label.localeCompare(b.label),
    );
    const everAnswered = aq.answeredAt !== null;
    // reveal answer/explanation if (tutor + answered) or (any mode + completed)
    const revealFeedback = (isTutor && everAnswered) || isCompleted;
    return {
      attemptQuestionId: aq.attemptQuestionId,
      orderIndex: aq.orderIndex,
      vignette: q.vignette,
      subject: q.subjectId
        ? { id: q.subjectId, name: q.subjectName!, slug: q.subjectSlug! }
        : null,
      choices: cs.map((c) => ({ id: c.id, label: c.label, text: c.text })),
      selectedChoiceId: aq.selectedChoiceId,
      flagged: aq.flagged,
      timeSpentSeconds: aq.timeSpentSeconds,
      answeredAt: aq.answeredAt,
      isCorrect: revealFeedback ? aq.isCorrect : null,
      correctChoiceId: revealFeedback
        ? (cs.find((c) => c.isCorrect)?.id ?? null)
        : null,
      explanation: revealFeedback ? q.explanation : null,
    };
  });

  res.json({
    id: att.id,
    mode: att.mode,
    questionCount: att.questionCount,
    timeLimitSeconds: att.timeLimitSeconds,
    startedAt: att.startedAt,
    completedAt: att.completedAt,
    scorePercent: att.scorePercent,
    correctCount: att.correctCount,
    wrongCount: att.wrongCount,
    skippedCount: att.skippedCount,
    questions,
  });
});

/* ============================================================
 * POST /api/attempts/:id/answer
 * body: { attemptQuestionId, selectedChoiceId, timeSpentSeconds? }
 * ============================================================ */
attemptsRouter.post('/:id/answer', async (req: AuthedRequest, res: Response) => {
  const id = req.params.id!;
  const userId = req.userId!;
  const body = req.body as {
    attemptQuestionId?: string;
    selectedChoiceId?: string;
    timeSpentSeconds?: number;
  };

  if (!body.attemptQuestionId || !body.selectedChoiceId) {
    res
      .status(400)
      .json({ error: 'attemptQuestionId and selectedChoiceId are required' });
    return;
  }

  const att = await loadOwnedAttempt(id, userId);
  if (!att) {
    res.status(404).json(ATTEMPT_NOT_FOUND);
    return;
  }
  if (att.completedAt) {
    res.status(409).json(ATTEMPT_COMPLETED);
    return;
  }

  const aq = await loadAttemptQuestion(body.attemptQuestionId, id);
  if (!aq) {
    res.status(404).json(QUESTION_NOT_IN_ATTEMPT);
    return;
  }

  const [chosen] = await db
    .select()
    .from(choice)
    .where(
      and(
        eq(choice.id, body.selectedChoiceId),
        eq(choice.questionId, aq.questionId),
      ),
    );
  if (!chosen) {
    res.status(400).json({ error: 'choice does not belong to this question' });
    return;
  }

  const submittedTime = Math.max(0, Math.floor(Number(body.timeSpentSeconds) || 0));

  await db
    .update(attemptQuestion)
    .set({
      selectedChoiceId: chosen.id,
      isCorrect: chosen.isCorrect,
      timeSpentSeconds: Math.max(aq.timeSpentSeconds, submittedTime),
      answeredAt: new Date(),
    })
    .where(eq(attemptQuestion.id, aq.id));

  if (att.mode === 'tutor') {
    const allChoices = await db
      .select()
      .from(choice)
      .where(eq(choice.questionId, aq.questionId));
    const correct = allChoices.find((c) => c.isCorrect);
    const [qrow] = await db
      .select({ explanation: question.explanation })
      .from(question)
      .where(eq(question.id, aq.questionId));
    res.json({
      ack: true,
      isCorrect: chosen.isCorrect,
      correctChoiceId: correct?.id ?? null,
      explanation: qrow?.explanation ?? null,
    });
    return;
  }

  res.json({ ack: true });
});

/* ============================================================
 * POST /api/attempts/:id/skip
 * body: { attemptQuestionId, timeSpentSeconds? }
 * ============================================================ */
attemptsRouter.post('/:id/skip', async (req: AuthedRequest, res: Response) => {
  const id = req.params.id!;
  const userId = req.userId!;
  const body = req.body as { attemptQuestionId?: string; timeSpentSeconds?: number };

  if (!body.attemptQuestionId) {
    res.status(400).json({ error: 'attemptQuestionId is required' });
    return;
  }

  const att = await loadOwnedAttempt(id, userId);
  if (!att) {
    res.status(404).json(ATTEMPT_NOT_FOUND);
    return;
  }
  if (att.completedAt) {
    res.status(409).json(ATTEMPT_COMPLETED);
    return;
  }

  const aq = await loadAttemptQuestion(body.attemptQuestionId, id);
  if (!aq) {
    res.status(404).json(QUESTION_NOT_IN_ATTEMPT);
    return;
  }

  const submittedTime = Math.max(0, Math.floor(Number(body.timeSpentSeconds) || 0));

  await db
    .update(attemptQuestion)
    .set({
      selectedChoiceId: null,
      isCorrect: null,
      timeSpentSeconds: Math.max(aq.timeSpentSeconds, submittedTime),
      answeredAt: new Date(),
    })
    .where(eq(attemptQuestion.id, aq.id));

  res.json({ ack: true });
});

/* ============================================================
 * POST /api/attempts/:id/flag
 * body: { attemptQuestionId, flagged: boolean }
 * ============================================================ */
attemptsRouter.post('/:id/flag', async (req: AuthedRequest, res: Response) => {
  const id = req.params.id!;
  const userId = req.userId!;
  const body = req.body as { attemptQuestionId?: string; flagged?: boolean };

  if (!body.attemptQuestionId || typeof body.flagged !== 'boolean') {
    res
      .status(400)
      .json({ error: 'attemptQuestionId and flagged (boolean) are required' });
    return;
  }

  const att = await loadOwnedAttempt(id, userId);
  if (!att) {
    res.status(404).json(ATTEMPT_NOT_FOUND);
    return;
  }

  const aq = await loadAttemptQuestion(body.attemptQuestionId, id);
  if (!aq) {
    res.status(404).json(QUESTION_NOT_IN_ATTEMPT);
    return;
  }

  await db
    .update(attemptQuestion)
    .set({ flagged: body.flagged })
    .where(eq(attemptQuestion.id, aq.id));

  res.json({ ack: true, flagged: body.flagged });
});

/* ============================================================
 * POST /api/attempts/:id/complete
 * Tally and finalize. Idempotent.
 * ============================================================ */
attemptsRouter.post('/:id/complete', async (req: AuthedRequest, res: Response) => {
  const id = req.params.id!;
  const userId = req.userId!;

  const att = await loadOwnedAttempt(id, userId);
  if (!att) {
    res.status(404).json(ATTEMPT_NOT_FOUND);
    return;
  }

  if (att.completedAt) {
    res.json({
      ack: true,
      alreadyCompleted: true,
      score: {
        percent: att.scorePercent,
        correct: att.correctCount,
        wrong: att.wrongCount,
        skipped: att.skippedCount,
        total: att.questionCount,
      },
    });
    return;
  }

  const aqs = await db
    .select({
      isCorrect: attemptQuestion.isCorrect,
      selectedChoiceId: attemptQuestion.selectedChoiceId,
      answeredAt: attemptQuestion.answeredAt,
    })
    .from(attemptQuestion)
    .where(eq(attemptQuestion.attemptId, id));

  let correct = 0;
  let wrong = 0;
  let skipped = 0;
  for (const aq of aqs) {
    if (aq.isCorrect === true) correct++;
    else if (aq.isCorrect === false) wrong++;
    else skipped++; // both explicit skip and "never answered" land here
  }
  const total = aqs.length;
  const scorePercent =
    total > 0 ? Math.round((correct / total) * 10000) / 100 : 0;

  await db
    .update(attempt)
    .set({
      completedAt: new Date(),
      correctCount: correct,
      wrongCount: wrong,
      skippedCount: skipped,
      scorePercent: String(scorePercent),
    })
    .where(eq(attempt.id, id));

  res.json({
    ack: true,
    alreadyCompleted: false,
    score: {
      percent: scorePercent,
      correct,
      wrong,
      skipped,
      total,
    },
  });
});
