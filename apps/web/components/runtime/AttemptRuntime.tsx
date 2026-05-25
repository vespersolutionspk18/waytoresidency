'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { api, type AttemptQuestion, type AttemptState } from '@/lib/api';
import { cn } from '@/lib/utils';
import { FormattedText } from '@/components/util/FormattedText';
import { QuestionTile, TileLegend } from '@/components/runtime/QuestionTile';

type Props = { attemptId: string };

type LocalState = {
  revealed: Record<string, boolean>;
  staged: Record<string, string | null>;
};

export function AttemptRuntime({ attemptId }: Props) {
  const router = useRouter();
  const [attempt, setAttempt] = useState<AttemptState | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const [local, setLocal] = useState<LocalState>({ revealed: {}, staged: {} });
  const [submitting, setSubmitting] = useState(false);
  const [completing, setCompleting] = useState(false);
  const enteredAtRef = useRef<number>(Date.now());
  const explanationRef = useRef<HTMLDivElement>(null);

  // ---- load ----
  useEffect(() => {
    let cancelled = false;
    api
      .getAttempt(attemptId)
      .then((data) => {
        if (cancelled) return;
        setAttempt(data);
        if (data.completedAt) {
          router.replace(`/attempts/${attemptId}/results`);
          return;
        }
        const revealed: Record<string, boolean> = {};
        const staged: Record<string, string | null> = {};
        for (const q of data.questions) {
          if (data.mode === 'tutor' && q.answeredAt) {
            revealed[q.attemptQuestionId] = true;
          }
          staged[q.attemptQuestionId] = q.selectedChoiceId ?? null;
        }
        setLocal({ revealed, staged });
        const firstUnanswered = data.questions.findIndex(
          (q) => q.answeredAt === null,
        );
        if (firstUnanswered >= 0) setIndex(firstUnanswered);
      })
      .catch((e) => {
        if (!cancelled) setLoadError(e instanceof Error ? e.message : 'failed');
      });
    return () => {
      cancelled = true;
    };
  }, [attemptId, router]);

  useEffect(() => {
    enteredAtRef.current = Date.now();
  }, [index]);

  // ---- quiz timer ----
  const deadline = useMemo(() => {
    if (!attempt || attempt.mode !== 'quiz' || !attempt.timeLimitSeconds) return null;
    return new Date(attempt.startedAt).getTime() + attempt.timeLimitSeconds * 1000;
  }, [attempt]);

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!deadline) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [deadline]);

  const remainingMs = deadline ? Math.max(0, deadline - now) : null;

  const handleComplete = useCallback(async () => {
    setCompleting(true);
    try {
      await api.complete(attemptId);
      router.push(`/attempts/${attemptId}/results`);
    } catch (e) {
      setCompleting(false);
      setLoadError(e instanceof Error ? e.message : 'could not complete');
    }
  }, [attemptId, router]);

  useEffect(() => {
    if (remainingMs === 0 && attempt && !attempt.completedAt && !completing) {
      handleComplete();
    }
  }, [remainingMs, attempt, completing, handleComplete]);

  if (loadError) {
    return (
      <div className="mx-auto max-w-[760px] px-6 py-16">
        <p className="text-wrong text-[14px]">
          Couldn&rsquo;t load session: {loadError}
        </p>
      </div>
    );
  }
  if (!attempt) {
    return (
      <div className="mx-auto max-w-[760px] px-6 py-16">
        <p className="text-mute serif-italic">Opening the reading room…</p>
      </div>
    );
  }

  const q = attempt.questions[index];
  if (!q) {
    return (
      <div className="mx-auto max-w-[760px] px-6 py-16">
        <p className="text-mute">No questions in this session.</p>
      </div>
    );
  }

  const isTutor = attempt.mode === 'tutor';
  const isRevealed = !!local.revealed[q.attemptQuestionId];
  const currentSelection =
    local.staged[q.attemptQuestionId] ?? q.selectedChoiceId;

  async function onSubmit() {
    if (!currentSelection || isRevealed) return;
    setSubmitting(true);
    try {
      const timeSpent = Math.round((Date.now() - enteredAtRef.current) / 1000);
      const res = await api.answer(attemptId, {
        attemptQuestionId: q!.attemptQuestionId,
        selectedChoiceId: currentSelection,
        timeSpentSeconds: timeSpent,
      });
      setAttempt((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          questions: prev.questions.map((qq) =>
            qq.attemptQuestionId === q!.attemptQuestionId
              ? {
                  ...qq,
                  selectedChoiceId: currentSelection!,
                  answeredAt: new Date().toISOString(),
                  isCorrect: res.isCorrect ?? qq.isCorrect,
                  correctChoiceId: res.correctChoiceId ?? qq.correctChoiceId,
                  explanation: res.explanation ?? qq.explanation,
                  timeSpentSeconds: Math.max(qq.timeSpentSeconds, timeSpent),
                }
              : qq,
          ),
        };
      });
      if (isTutor) {
        setLocal((prev) => ({
          ...prev,
          revealed: { ...prev.revealed, [q!.attemptQuestionId]: true },
        }));
        // scroll the explanation into view (mobile especially)
        setTimeout(
          () =>
            explanationRef.current?.scrollIntoView({
              behavior: 'smooth',
              block: 'nearest',
            }),
          80,
        );
      } else {
        // quiz: advance to next, OR if this was the last question, finalize the attempt.
        const isLast = index >= attempt!.questions.length - 1;
        if (isLast) {
          setTimeout(() => handleComplete(), 200);
        } else {
          setTimeout(() => advance(), 100);
        }
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function onSkip() {
    if (!q) return;
    setSubmitting(true);
    try {
      const timeSpent = Math.round((Date.now() - enteredAtRef.current) / 1000);
      await api.skip(attemptId, {
        attemptQuestionId: q.attemptQuestionId,
        timeSpentSeconds: timeSpent,
      });
      setAttempt((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          questions: prev.questions.map((qq) =>
            qq.attemptQuestionId === q.attemptQuestionId
              ? {
                  ...qq,
                  selectedChoiceId: null,
                  answeredAt: new Date().toISOString(),
                  isCorrect: null,
                  timeSpentSeconds: Math.max(qq.timeSpentSeconds, timeSpent),
                }
              : qq,
          ),
        };
      });
      advance();
    } finally {
      setSubmitting(false);
    }
  }

  async function onFlagToggle() {
    if (!q) return;
    const next = !q.flagged;
    setAttempt((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        questions: prev.questions.map((qq) =>
          qq.attemptQuestionId === q.attemptQuestionId
            ? { ...qq, flagged: next }
            : qq,
        ),
      };
    });
    try {
      await api.flag(attemptId, {
        attemptQuestionId: q.attemptQuestionId,
        flagged: next,
      });
    } catch {
      setAttempt((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          questions: prev.questions.map((qq) =>
            qq.attemptQuestionId === q.attemptQuestionId
              ? { ...qq, flagged: !next }
              : qq,
          ),
        };
      });
    }
  }

  function advance() {
    setIndex((i) => Math.min(attempt!.questions.length - 1, i + 1));
  }
  function back() {
    setIndex((i) => Math.max(0, i - 1));
  }

  const answeredCount = attempt.questions.filter((qq) => qq.answeredAt).length;

  return (
    <div className="mx-auto max-w-[1320px] px-4 md:px-8 py-8">
      {/* ---------- Top bar ---------- */}
      <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-baseline gap-3">
          <span className="section-numeral">§</span>
          <span className="eyebrow">
            {isTutor ? 'Tutor mode' : 'Quiz mode'}
          </span>
          <span className="text-mute text-[12.5px]">·</span>
          <span
            className="font-display text-[16px] text-ink"
            style={{ fontWeight: 450 }}
          >
            Question {index + 1}{' '}
            <span className="text-mute text-[14px] font-body">
              of {attempt.questions.length}
            </span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          {remainingMs !== null && <Timer remainingMs={remainingMs} />}
          <button
            type="button"
            onClick={handleComplete}
            disabled={completing}
            className="h-9 inline-flex items-center px-3.5 text-[13px] font-medium tracking-tight rounded-md border border-rule-2 text-ink-2 hover:border-mute hover:text-ink hover:bg-paper-2 transition-colors focus-ring disabled:opacity-50"
          >
            {completing
              ? 'Wrapping up…'
              : isTutor
                ? 'End tutor session'
                : 'Submit quiz'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* ---------- LEFT: question + options + actions ---------- */}
        <article className="col-span-12 lg:col-span-7 bg-surface border border-rule rounded-lg overflow-hidden h-fit">
          <header className="px-7 py-3 border-b border-rule bg-paper-2 flex items-center justify-between text-[12.5px]">
            <div className="flex items-center gap-3">
              <span className="section-numeral">No. {index + 1}</span>
              <span className="text-mute">{q.subject?.name ?? 'Mixed'}</span>
            </div>
            <button
              type="button"
              onClick={onFlagToggle}
              className={cn(
                'inline-flex items-center gap-1.5 text-[12px] font-medium tracking-tight transition-colors focus-ring rounded',
                q.flagged ? 'text-copper' : 'text-mute hover:text-ink',
              )}
              aria-pressed={q.flagged}
            >
              <FlagIcon filled={q.flagged} />
              {q.flagged ? 'Flagged' : 'Flag for review'}
            </button>
          </header>

          <div className="px-7 py-7 md:px-9 md:py-8">
            <p className="text-[16px] text-ink-2 leading-[1.7] whitespace-pre-line">
              {q.vignette}
            </p>

            <ul className="grid gap-1.5 mt-7 mb-6">
              {q.choices.map((c) => {
                const picked = currentSelection === c.id;
                const showCorrect =
                  isRevealed && q.correctChoiceId === c.id;
                const showWrong =
                  isRevealed && picked && q.correctChoiceId !== c.id;
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      disabled={isRevealed}
                      onClick={() =>
                        setLocal((prev) => ({
                          ...prev,
                          staged: {
                            ...prev.staged,
                            [q.attemptQuestionId]: c.id,
                          },
                        }))
                      }
                      className={cn(
                        'group w-full text-left flex items-baseline gap-3.5',
                        'px-4 py-3 rounded-md border transition-colors focus-ring',
                        !isRevealed && !picked && 'border-rule hover:border-mute hover:bg-paper',
                        !isRevealed && picked && 'border-ink bg-paper',
                        showCorrect && 'border-correct bg-[#eaf0eb]',
                        showWrong && 'border-wrong bg-[#f5e7e4]',
                      )}
                    >
                      <span
                        className={cn(
                          'font-display italic text-[15px] w-5 shrink-0',
                          showCorrect
                            ? 'text-correct'
                            : showWrong
                              ? 'text-wrong'
                              : 'text-copper',
                        )}
                      >
                        {c.label}.
                      </span>
                      <span
                        className={cn(
                          'text-[15px]',
                          showCorrect
                            ? 'text-correct'
                            : showWrong
                              ? 'text-wrong'
                              : 'text-ink',
                        )}
                      >
                        {c.text}
                      </span>
                      {showCorrect && (
                        <span className="ml-auto text-[11px] uppercase tracking-wider text-correct">
                          Correct
                        </span>
                      )}
                      {showWrong && (
                        <span className="ml-auto text-[11px] uppercase tracking-wider text-wrong">
                          Your pick
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>

            <div className="pt-5 border-t border-rule flex items-center gap-3 flex-wrap">
              <button
                type="button"
                onClick={back}
                disabled={index === 0}
                className="h-10 px-3.5 text-[13.5px] text-ink-2 hover:text-ink disabled:opacity-40 focus-ring rounded-md"
              >
                ← Previous
              </button>

              {!isRevealed ? (
                <>
                  <button
                    type="button"
                    onClick={onSubmit}
                    disabled={!currentSelection || submitting}
                    className="h-10 px-5 text-[13.5px] font-medium tracking-tight rounded-md bg-apothecary text-paper border border-apothecary-2 hover:bg-apothecary-2 transition-colors focus-ring disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting
                      ? 'Submitting…'
                      : isTutor
                        ? 'Submit answer'
                        : 'Submit & next'}
                  </button>
                  <button
                    type="button"
                    onClick={onSkip}
                    disabled={submitting}
                    className="h-10 px-3.5 text-[13.5px] text-mute hover:text-ink underline underline-offset-4 decoration-rule-2 hover:decoration-mute focus-ring rounded-md"
                  >
                    Skip
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={advance}
                  disabled={index >= attempt.questions.length - 1}
                  className="h-10 px-5 text-[13.5px] font-medium tracking-tight rounded-md bg-apothecary text-paper border border-apothecary-2 hover:bg-apothecary-2 transition-colors focus-ring disabled:opacity-50"
                >
                  Next question →
                </button>
              )}

              <span className="ml-auto text-[12.5px] text-mute">
                {answeredCount} of {attempt.questions.length} answered
              </span>
            </div>
          </div>
        </article>

        {/* ---------- RIGHT: map + explanation (or placeholder) ---------- */}
        <aside className="col-span-12 lg:col-span-5 flex flex-col gap-5">
          <div className="bg-surface border border-rule rounded-lg p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="eyebrow">Session map</span>
              <span className="text-[11.5px] text-mute">
                {answeredCount}/{attempt.questions.length}
              </span>
            </div>
            <div className="grid grid-cols-10 sm:grid-cols-12 lg:grid-cols-10 gap-1.5 mb-4">
              {attempt.questions.map((qq, i) => (
                <QuestionTile
                  key={qq.attemptQuestionId}
                  number={i + 1}
                  active={i === index}
                  question={qq}
                  isTutor={isTutor}
                  revealCorrectness={false}
                  onClick={() => setIndex(i)}
                />
              ))}
            </div>
            <div className="pt-4 border-t border-rule">
              <TileLegend isTutor={isTutor} revealCorrectness={false} />
            </div>
          </div>

          {isTutor && isRevealed && q.explanation ? (
            <div
              ref={explanationRef}
              className="bg-surface border border-rule rounded-lg p-6 rise"
            >
              <div className="flex items-baseline justify-between mb-3 pb-2 border-b border-rule">
                <span className="eyebrow">Explanation</span>
                <span
                  className={cn(
                    'text-[11px] uppercase tracking-wider font-medium',
                    q.isCorrect ? 'text-correct' : 'text-wrong',
                  )}
                >
                  {q.isCorrect ? 'Correct answer' : 'Incorrect'}
                </span>
              </div>
              <FormattedText text={q.explanation} />
            </div>
          ) : (
            <div className="bg-surface border border-dashed border-rule-2 rounded-lg p-7 text-center">
              <span className="eyebrow">Explanation</span>
              <p className="serif-italic text-mute mt-2 text-[14.5px]">
                {isTutor
                  ? 'Submit an answer to reveal the explanation here.'
                  : 'The full answer key reveals at the end of the quiz.'}
              </p>
            </div>
          )}

          <Link
            href="/dashboard"
            className="self-center text-[12.5px] text-mute hover:text-ink"
          >
            ← Save & exit to dashboard
          </Link>
        </aside>
      </div>
    </div>
  );
}

function Timer({ remainingMs }: { remainingMs: number }) {
  const totalSec = Math.ceil(remainingMs / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  const danger = totalSec <= 60;
  return (
    <div
      className={cn(
        'inline-flex items-baseline gap-1.5 h-9 px-3.5 rounded-md font-mono text-[14px] tracking-tight border',
        danger
          ? 'bg-[#f5e7e4] text-wrong border-wrong/40'
          : 'bg-paper-2 text-ink border-rule-2',
      )}
      role="timer"
      aria-live="polite"
    >
      {String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
    </div>
  );
}

function FlagIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      width="11"
      height="13"
      viewBox="0 0 11 13"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="square"
      strokeLinejoin="miter"
      aria-hidden
    >
      <path d="M1.5 1v11" />
      <path d="M1.5 1.5h8l-2 3 2 3h-8" />
    </svg>
  );
}
