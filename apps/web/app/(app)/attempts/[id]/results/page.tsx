'use client';

import Link from 'next/link';
import { use, useEffect, useState } from 'react';
import { api, type AttemptQuestion, type AttemptState } from '@/lib/api';
import { cn } from '@/lib/utils';
import { FormattedText } from '@/components/util/FormattedText';
import { QuestionTile, TileLegend } from '@/components/runtime/QuestionTile';

export default function ResultsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [attempt, setAttempt] = useState<AttemptState | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await api.complete(id).catch(() => {
          /* idempotent */
        });
        const data = await api.getAttempt(id);
        if (!cancelled) setAttempt(data);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'failed');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (error) {
    return (
      <div className="mx-auto max-w-[760px] px-6 py-16">
        <p className="text-wrong text-[14px]">Couldn&rsquo;t load results: {error}</p>
      </div>
    );
  }
  if (!attempt) {
    return (
      <div className="mx-auto max-w-[760px] px-6 py-16">
        <p className="text-mute serif-italic">Tallying…</p>
      </div>
    );
  }

  const total = attempt.questions.length;
  const correct = attempt.correctCount;
  const wrong = attempt.wrongCount;
  // split the stored skippedCount into "explicitly skipped" vs "never reached"
  const unseen = attempt.questions.filter((q) => !q.answeredAt).length;
  const skipped = Math.max(0, attempt.skippedCount - unseen);
  const pct =
    attempt.scorePercent !== null
      ? Math.round(Number(attempt.scorePercent))
      : total > 0
        ? Math.round((correct / total) * 100)
        : 0;
  const verdict = pct >= 70 ? 'Pass' : pct >= 50 ? 'Borderline' : 'Below threshold';
  const verdictCls =
    pct >= 70 ? 'text-correct' : pct >= 50 ? 'text-copper' : 'text-wrong';
  const durationMin = attempt.completedAt
    ? Math.max(
        1,
        Math.round(
          (new Date(attempt.completedAt).getTime() -
            new Date(attempt.startedAt).getTime()) /
            60000,
        ),
      )
    : null;

  const selected = attempt.questions[selectedIndex];

  return (
    <div className="mx-auto max-w-[1320px] px-4 md:px-8 py-8">
      {/* ---------- Header ---------- */}
      <div className="rise">
        <div className="flex items-baseline gap-3 mb-2">
          <span className="section-numeral">§ Results</span>
          <span className="eyebrow">
            {attempt.mode === 'quiz' ? 'Quiz session' : 'Tutor session'}
          </span>
        </div>
        <div className="flex items-end justify-between gap-6 flex-wrap">
          <h1
            className="font-display text-[40px] md:text-[52px] leading-[1.02] tracking-[-0.015em] text-ink"
            style={{ fontWeight: 430 }}
          >
            Score: <span className="serif-italic text-apothecary">{pct}%</span>
            <span className="text-mute font-body text-[20px] ml-3 align-middle">
              ({correct}/{total})
            </span>
          </h1>
          <div className="text-right">
            <div className={cn('font-display text-[20px] tracking-tight', verdictCls)} style={{ fontWeight: 450 }}>
              {verdict}
            </div>
            <div className="text-[12.5px] text-mute mt-0.5">
              {durationMin !== null && (
                <span>
                  {durationMin} min ·{' '}
                </span>
              )}
              {new Date(attempt.startedAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ---------- Tally bar ---------- */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-rule border-y border-rule mt-7 mb-6">
        <Tally label="Correct" value={correct} accent="text-correct" />
        <Tally label="Wrong" value={wrong} accent="text-wrong" />
        <Tally label="Skipped" value={skipped} accent="text-mute" />
        <Tally label="Not reached" value={unseen} accent="text-mute" />
      </div>

      {/* ---------- Unseen notice (timeout reminder) ---------- */}
      {unseen > 0 && (
        <div className="mb-8 flex items-start gap-3 px-4 py-3 border border-copper/40 bg-copper-soft rounded-md text-[13.5px] text-ink-2">
          <span className="serif-italic text-copper shrink-0 mt-px">!</span>
          <p>
            <span className="font-medium text-ink">
              {unseen} question{unseen === 1 ? '' : 's'} weren&rsquo;t reached
            </span>{' '}
            {attempt.mode === 'quiz' && attempt.timeLimitSeconds
              ? 'before the clock ran out. '
              : 'before you ended the session. '}
            Click any{' '}
            <span className="inline-block align-middle w-3.5 h-3.5 bg-paper-2 border border-rule rounded-sm mx-0.5" />{' '}
            tile in the answer key to see the vignette, correct answer, and full
            explanation.
          </p>
        </div>
      )}

      {/* ---------- Grid (left) + Detail (right) ---------- */}
      <div className="grid grid-cols-12 gap-6">
        {/* LEFT: question palette */}
        <aside className="col-span-12 lg:col-span-3 flex flex-col gap-4">
          <div className="bg-surface border border-rule rounded-lg p-5 lg:sticky lg:top-6">
            <div className="flex items-center justify-between mb-3">
              <span className="eyebrow">Answer key</span>
              <span className="text-[11.5px] text-mute">{total} questions</span>
            </div>
            <div className="grid grid-cols-5 gap-1.5 mb-4">
              {attempt.questions.map((qq, i) => (
                <QuestionTile
                  key={qq.attemptQuestionId}
                  number={i + 1}
                  active={i === selectedIndex}
                  question={qq}
                  isTutor={true}
                  revealCorrectness={true}
                  onClick={() => setSelectedIndex(i)}
                />
              ))}
            </div>
            <div className="pt-3 border-t border-rule">
              <TileLegend isTutor={true} revealCorrectness={true} />
            </div>
          </div>
        </aside>

        {/* RIGHT: detail panel */}
        <main className="col-span-12 lg:col-span-9">
          {selected && (
            <QuestionDetail
              q={selected}
              index={selectedIndex}
              total={total}
              onPrev={() => setSelectedIndex((i) => Math.max(0, i - 1))}
              onNext={() =>
                setSelectedIndex((i) => Math.min(total - 1, i + 1))
              }
            />
          )}
        </main>
      </div>

      {/* ---------- Footer ---------- */}
      <footer className="mt-10 pt-6 border-t border-rule flex items-center justify-between text-[13px]">
        <Link href="/dashboard" className="text-ink-2 hover:text-ink">
          ← Back to dashboard
        </Link>
        <Link
          href={attempt.mode === 'tutor' ? '/tutor/new' : '/quiz/new'}
          className="h-10 inline-flex items-center px-4 text-[13.5px] font-medium tracking-tight rounded-md bg-apothecary text-paper border border-apothecary-2 hover:bg-apothecary-2 transition-colors"
        >
          New {attempt.mode} session →
        </Link>
      </footer>
    </div>
  );
}

function Tally({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <div className="bg-paper px-5 py-4">
      <div className="eyebrow mb-1.5">{label}</div>
      <div
        className={cn('font-display text-[32px] leading-[1] tracking-tight', accent)}
        style={{ fontWeight: 450 }}
      >
        {value}
      </div>
    </div>
  );
}

function QuestionDetail({
  q,
  index,
  total,
  onPrev,
  onNext,
}: {
  q: AttemptQuestion;
  index: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  const status = !q.answeredAt
    ? 'unseen'
    : q.selectedChoiceId === null
      ? 'skipped'
      : q.isCorrect
        ? 'correct'
        : 'wrong';
  const picked = q.choices.find((c) => c.id === q.selectedChoiceId);
  const correctC = q.choices.find((c) => c.id === q.correctChoiceId);

  return (
    <article className="bg-surface border border-rule rounded-lg overflow-hidden">
      {/* meta + nav */}
      <header className="px-7 py-3 border-b border-rule bg-paper-2 flex items-center justify-between text-[12.5px]">
        <div className="flex items-center gap-3">
          <span className="section-numeral">No. {index + 1}</span>
          <span className="text-mute">of {total}</span>
          {q.flagged && (
            <span className="text-copper text-[11px] uppercase tracking-wider ml-2">
              · Flagged
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onPrev}
            disabled={index === 0}
            className="h-8 px-2.5 text-[12.5px] text-ink-2 hover:text-ink disabled:opacity-40 focus-ring rounded"
          >
            ← Prev
          </button>
          <span className="text-mute">·</span>
          <button
            type="button"
            onClick={onNext}
            disabled={index >= total - 1}
            className="h-8 px-2.5 text-[12.5px] text-ink-2 hover:text-ink disabled:opacity-40 focus-ring rounded"
          >
            Next →
          </button>
        </div>
      </header>

      <div className="px-7 py-7 md:px-9 md:py-8">
        {/* status pill */}
        <div className="mb-5">
          <StatusPill status={status} />
        </div>

        {/* vignette */}
        <section>
          <div className="eyebrow mb-2">Vignette</div>
          <p className="text-[15.5px] text-ink-2 leading-[1.7] whitespace-pre-line">
            {q.vignette}
          </p>
        </section>

        {/* choices with markers */}
        <section className="mt-7">
          <div className="eyebrow mb-2">Choices</div>
          <ul className="grid gap-1.5">
            {q.choices.map((c) => {
              const isCorrect = c.id === q.correctChoiceId;
              const isPicked = c.id === q.selectedChoiceId;
              const isWrong = isPicked && !isCorrect;
              return (
                <li
                  key={c.id}
                  className={cn(
                    'flex items-baseline gap-3.5 px-3.5 py-2.5 rounded-md border',
                    isCorrect && 'border-correct bg-[#eaf0eb]',
                    isWrong && 'border-wrong bg-[#f5e7e4]',
                    !isCorrect && !isWrong && 'border-rule',
                  )}
                >
                  <span
                    className={cn(
                      'font-display italic text-[14.5px] w-5 shrink-0',
                      isCorrect
                        ? 'text-correct'
                        : isWrong
                          ? 'text-wrong'
                          : 'text-copper',
                    )}
                  >
                    {c.label}.
                  </span>
                  <span
                    className={cn(
                      'text-[14.5px]',
                      isCorrect
                        ? 'text-correct'
                        : isWrong
                          ? 'text-wrong'
                          : 'text-ink',
                    )}
                  >
                    {c.text}
                  </span>
                  {isCorrect && (
                    <span className="ml-auto text-[10.5px] uppercase tracking-wider text-correct font-medium">
                      Correct
                    </span>
                  )}
                  {isWrong && (
                    <span className="ml-auto text-[10.5px] uppercase tracking-wider text-wrong font-medium">
                      Your pick
                    </span>
                  )}
                </li>
              );
            })}
          </ul>

          {/* condensed answer summary */}
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-[13px]">
            <span className="text-mute">
              Your pick:{' '}
              {picked ? (
                <span className="serif-italic text-ink">
                  {picked.label}. {picked.text}
                </span>
              ) : status === 'skipped' ? (
                <span className="serif-italic text-mute">skipped</span>
              ) : (
                <span className="serif-italic text-mute">not reached</span>
              )}
            </span>
            {correctC && status !== 'correct' && (
              <span className="text-mute">
                Correct answer:{' '}
                <span className="serif-italic text-correct">
                  {correctC.label}. {correctC.text}
                </span>
              </span>
            )}
          </div>
        </section>

        {/* explanation */}
        {q.explanation && (
          <section className="mt-8 pt-6 border-t border-rule">
            <div className="eyebrow mb-3">Explanation</div>
            <FormattedText text={q.explanation} />
          </section>
        )}
      </div>
    </article>
  );
}

function StatusPill({
  status,
}: {
  status: 'correct' | 'wrong' | 'skipped' | 'unseen';
}) {
  const map = {
    correct: {
      label: 'You got this right',
      cls: 'bg-correct text-paper',
    },
    wrong: {
      label: 'Incorrect',
      cls: 'bg-wrong text-paper',
    },
    skipped: {
      label: 'You skipped this',
      cls: 'bg-mute text-paper',
    },
    unseen: {
      label: 'Not reached, review now',
      cls: 'bg-copper-soft text-copper border border-copper/40',
    },
  };
  const m = map[status];
  return (
    <span
      className={cn(
        'inline-flex items-center px-3 py-1 text-[11px] uppercase tracking-wider font-medium rounded',
        m.cls,
      )}
    >
      {m.label}
    </span>
  );
}
