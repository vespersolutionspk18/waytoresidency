'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useSession } from '@/lib/auth-client';
import { api, type AttemptSummary } from '@/lib/api';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
  const { data, isPending: sessionLoading } = useSession();
  const [attempts, setAttempts] = useState<AttemptSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .listAttempts()
      .then((r) => {
        if (!cancelled) setAttempts(r.attempts);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'failed');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const { totalAnswered, totalCorrect, accuracy, sessionsCount, bestScore } =
    useMemo(() => {
      const completed = (attempts ?? []).filter((a) => a.completedAt);
      const totalAnswered = completed.reduce(
        (s, a) => s + a.correctCount + a.wrongCount,
        0,
      );
      const totalCorrect = completed.reduce((s, a) => s + a.correctCount, 0);
      const accuracy =
        totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : null;
      const sessionsCount = completed.length;
      const bestScore =
        completed.length > 0
          ? Math.max(...completed.map((a) => Number(a.scorePercent ?? 0)))
          : null;
      return { totalAnswered, totalCorrect, accuracy, sessionsCount, bestScore };
    }, [attempts]);

  const greeting = greetingFor(new Date());
  const name = data?.user?.name?.split(' ')[0];

  return (
    <div className="mx-auto max-w-[1180px] px-6 md:px-8 py-12">
      {/* ---------- Greeting ---------- */}
      <div className="rise">
        <div className="flex items-baseline gap-3 mb-2">
          <span className="section-numeral">§ Today</span>
          <span className="eyebrow">{formatDate(new Date())}</span>
        </div>
        <h1
          className="font-display text-[40px] md:text-[48px] leading-[1.05] tracking-[-0.015em] text-ink"
          style={{ fontWeight: 430 }}
        >
          {greeting},{' '}
          <span className="serif-italic text-apothecary">
            {sessionLoading ? '…' : (name ?? 'doctor')}
          </span>
          .
        </h1>
        <p className="mt-3 max-w-[60ch] text-[15.5px] text-ink-2 leading-[1.6]">
          The reading room is open. Begin a tutor session to learn, or a timed
          quiz to measure where you stand.
        </p>
      </div>

      <div className="rule my-10" />

      {/* ---------- Stats (real, from completed attempts) ---------- */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-rule border-y border-rule rise rise-1">
        <Stat
          label="Questions answered"
          value={totalAnswered === 0 ? ', ' : String(totalAnswered)}
          foot={
            totalAnswered === 0
              ? 'no attempts yet'
              : `across ${sessionsCount} session${sessionsCount === 1 ? '' : 's'}`
          }
        />
        <Stat
          label="Accuracy"
          value={accuracy === null ? ', ' : `${accuracy}%`}
          foot={
            accuracy === null
              ? 'finish a session to score'
              : `${totalCorrect} of ${totalAnswered} correct`
          }
        />
        <Stat
          label="Sessions"
          value={String(sessionsCount)}
          foot={sessionsCount === 0 ? 'none completed' : 'completed end-to-end'}
        />
        <Stat
          label="Best score"
          value={bestScore === null ? ', ' : `${Math.round(bestScore)}%`}
          foot={bestScore === null ? 'a benchmark to set' : 'set the bar higher'}
        />
      </div>

      {/* ---------- Two modes ---------- */}
      <section className="mt-12 rise rise-2">
        <div className="flex items-baseline gap-3 mb-5">
          <span className="section-numeral">§ I.</span>
          <h2
            className="font-display text-[22px] tracking-[-0.012em] text-ink"
            style={{ fontWeight: 450 }}
          >
            Begin a session
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <ModeAction
            label="A."
            title="Tutor"
            blurb="Answer one at a time. Explanations appear on submit. Skipped and wrong are tracked in a sidebar for review."
            cta="Start tutor session"
            href="/tutor/new"
          />
          <ModeAction
            label="B."
            title="Quiz"
            blurb="Timed mock. No feedback during the run. Full answer key and score sheet revealed at the end."
            cta="Start quiz session"
            href="/quiz/new"
          />
        </div>
      </section>

      {/* ---------- Recent sessions ---------- */}
      <section className="mt-12 rise rise-3">
        <div className="flex items-baseline gap-3 mb-5">
          <span className="section-numeral">§ II.</span>
          <h2
            className="font-display text-[22px] tracking-[-0.012em] text-ink"
            style={{ fontWeight: 450 }}
          >
            Recent sessions
          </h2>
          {attempts !== null && attempts.length > 0 && (
            <span className="ml-auto text-[12.5px] text-mute">
              {attempts.length} total
            </span>
          )}
        </div>

        {error ? (
          <div className="border border-wrong/40 bg-[#f5e7e4] text-wrong text-[13px] rounded-lg px-4 py-3">
            Couldn&rsquo;t load history: {error}
          </div>
        ) : attempts === null ? (
          <div className="border border-rule bg-surface rounded-lg p-8 text-center">
            <p className="serif-italic text-mute">Loading…</p>
          </div>
        ) : attempts.length === 0 ? (
          <div className="border border-rule bg-surface rounded-lg p-12 text-center">
            <p className="serif-italic text-[16px] text-mute">No sessions yet.</p>
            <p className="text-[13px] text-mute mt-1.5">
              Run a tutor or quiz session above and it&rsquo;ll appear here.
            </p>
          </div>
        ) : (
          <ul className="border border-rule bg-surface rounded-lg overflow-hidden divide-y divide-rule">
            {attempts.map((a) => (
              <RecentSessionRow key={a.id} a={a} />
            ))}
          </ul>
        )}
      </section>

      <footer className="mt-16 pt-6 border-t border-rule flex items-center justify-between text-[12px] text-mute">
        <span>Vol. I · 2026 · way to residency</span>
        <Link href="/" className="hover:text-ink">
          ← Back to home
        </Link>
      </footer>
    </div>
  );
}

function Stat({ label, value, foot }: { label: string; value: string; foot: string }) {
  return (
    <div className="bg-paper px-5 py-5">
      <div className="eyebrow mb-2">{label}</div>
      <div
        className="font-display text-[26px] leading-[1.1] tracking-tight text-ink"
        style={{ fontWeight: 450 }}
      >
        {value}
      </div>
      <p className="text-[12px] text-mute mt-1.5">{foot}</p>
    </div>
  );
}

function ModeAction({
  label,
  title,
  blurb,
  cta,
  href,
}: {
  label: string;
  title: string;
  blurb: string;
  cta: string;
  href: string;
}) {
  return (
    <div className="bg-surface border border-rule rounded-lg p-6 flex flex-col">
      <div className="flex items-baseline gap-3 mb-3">
        <span className="section-numeral text-[15px]">{label}</span>
        <h3
          className="font-display text-[22px] text-ink tracking-tight"
          style={{ fontWeight: 450 }}
        >
          {title}
        </h3>
      </div>
      <p className="text-[14px] text-ink-2 leading-[1.55] flex-1">{blurb}</p>
      <Link
        href={href}
        className="mt-5 self-start h-10 inline-flex items-center px-4 text-[13.5px] font-medium tracking-tight rounded-md bg-apothecary text-paper border border-apothecary-2 hover:bg-apothecary-2 transition-colors focus-ring"
      >
        {cta}
        <span className="ml-2" aria-hidden>
          →
        </span>
      </Link>
    </div>
  );
}

function RecentSessionRow({ a }: { a: AttemptSummary }) {
  const isCompleted = !!a.completedAt;
  const pct =
    isCompleted && a.scorePercent !== null ? Math.round(Number(a.scorePercent)) : null;
  const verdict =
    pct === null ? null : pct >= 70 ? 'pass' : pct >= 50 ? 'borderline' : 'low';
  const dateStr = new Date(a.startedAt).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
  const href = isCompleted
    ? `/attempts/${a.id}/results`
    : a.mode === 'quiz'
      ? `/quiz/${a.id}`
      : `/tutor/${a.id}`;
  return (
    <li>
      <Link
        href={href}
        className="flex items-center gap-5 px-5 py-4 hover:bg-paper-2 transition-colors focus-ring"
      >
        <div className="w-14 shrink-0">
          {pct !== null ? (
            <div
              className={cn(
                'font-display text-[22px] leading-[1] tracking-tight',
                verdict === 'pass' && 'text-correct',
                verdict === 'borderline' && 'text-copper',
                verdict === 'low' && 'text-wrong',
              )}
              style={{ fontWeight: 450 }}
            >
              {pct}%
            </div>
          ) : (
            <span className="serif-italic text-mute text-[14px]">in progress</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2.5 text-[14px] text-ink">
            <span className="eyebrow text-[10.5px]">
              {a.mode === 'tutor' ? 'Tutor' : 'Quiz'}
            </span>
            <span className="text-mute">·</span>
            <span>{a.questionCount} questions</span>
          </div>
          {isCompleted && pct !== null && (
            <div className="mt-1 text-[12.5px] text-mute">
              {a.correctCount} correct ·{' '}
              {a.wrongCount > 0 && <span>{a.wrongCount} wrong · </span>}
              {a.skippedCount > 0 && <span>{a.skippedCount} skipped · </span>}
              <span className="serif-italic">
                {verdict === 'pass'
                  ? 'pass'
                  : verdict === 'borderline'
                    ? 'borderline'
                    : 'below threshold'}
              </span>
            </div>
          )}
        </div>
        <div className="text-[12.5px] text-mute text-right shrink-0 hidden sm:block">
          {dateStr}
        </div>
        <span className="text-mute text-[14px]" aria-hidden>
          →
        </span>
      </Link>
    </li>
  );
}

function greetingFor(d: Date): string {
  const h = d.getHours();
  if (h < 5) return 'Still up';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  if (h < 21) return 'Good evening';
  return 'Good night';
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}
