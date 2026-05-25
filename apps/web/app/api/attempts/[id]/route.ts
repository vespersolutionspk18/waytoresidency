import type { NextRequest } from 'next/server';
import { eq, inArray } from 'drizzle-orm';
import { db } from '@/lib/db';
import {
  attemptQuestion,
  question,
  choice,
  subject,
} from '@/lib/db/schema';
import { requireUser } from '@/lib/auth-helpers';
import { handle, json, error } from '@/lib/api-helpers';
import { loadOwnedAttempt, ATTEMPT_NOT_FOUND } from '@/lib/attempts-helpers';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return handle(async () => {
    const me = await requireUser(request);
    const { id } = await params;

    const att = await loadOwnedAttempt(id, me.id);
    if (!att) return error(ATTEMPT_NOT_FOUND.error, 404);

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
      return json({ ...att, questions: [] });
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

    return json({
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
}
