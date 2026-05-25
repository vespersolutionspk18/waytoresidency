'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { SubjectPicker } from '@/components/ui/SubjectPicker';
import { cn } from '@/lib/utils';

const COUNTS = [10, 20, 40];
const SECS_PER_Q = [45, 60, 75, 90];

export default function NewQuizPage() {
  const router = useRouter();
  const [count, setCount] = useState(20);
  const [secs, setSecs] = useState(60);
  const [subjectIds, setSubjectIds] = useState<string[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    setError(null);
    setPending(true);
    try {
      const res = await api.createAttempt({
        mode: 'quiz',
        questionCount: count,
        timeLimitSeconds: secs * count,
        subjectIds: subjectIds.length > 0 ? subjectIds : undefined,
      });
      router.push(`/quiz/${res.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not start session.');
      setPending(false);
    }
  }

  const totalMin = Math.round((secs * count) / 60);

  return (
    <div className="mx-auto max-w-[840px] px-6 md:px-8 py-14 rise">
      <div className="flex items-baseline gap-3 mb-2">
        <span className="section-numeral">§ New</span>
        <span className="eyebrow">Quiz session</span>
      </div>
      <h1
        className="font-display text-[36px] leading-[1.05] tracking-[-0.015em] text-ink"
        style={{ fontWeight: 430 }}
      >
        Sit a timed <span className="serif-italic text-apothecary">quiz</span>.
      </h1>
      <p className="mt-3 max-w-[55ch] text-[15px] text-ink-2 leading-[1.6]">
        Mimics exam conditions. No feedback during the run. The full answer
        key and score sheet are revealed only at the end.
      </p>

      <div className="rule my-9" />

      <div>
        <div className="eyebrow mb-3">Subjects</div>
        <SubjectPicker selected={subjectIds} onChange={setSubjectIds} />
      </div>

      <div className="mt-9">
        <div className="eyebrow mb-3">Number of questions</div>
        <div className="flex flex-wrap gap-2.5">
          {COUNTS.map((n) => {
            const active = count === n;
            return (
              <button
                key={n}
                type="button"
                onClick={() => setCount(n)}
                className={cn(
                  'h-11 px-5 text-[14px] font-medium tracking-tight rounded-md transition-colors focus-ring',
                  active
                    ? 'bg-apothecary text-paper border border-apothecary-2'
                    : 'bg-surface text-ink-2 border border-rule hover:border-mute hover:text-ink',
                )}
              >
                {n}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-8">
        <div className="eyebrow mb-3">Seconds per question</div>
        <div className="flex flex-wrap gap-2.5">
          {SECS_PER_Q.map((s) => {
            const active = secs === s;
            return (
              <button
                key={s}
                type="button"
                onClick={() => setSecs(s)}
                className={cn(
                  'h-11 px-5 text-[14px] font-medium tracking-tight rounded-md transition-colors focus-ring',
                  active
                    ? 'bg-apothecary text-paper border border-apothecary-2'
                    : 'bg-surface text-ink-2 border border-rule hover:border-mute hover:text-ink',
                )}
              >
                {s}s
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-[12.5px] text-mute">
          Total run lasts <span className="serif-italic text-ink">{totalMin} minutes</span>. The clock auto-submits at zero.
        </p>
      </div>

      {error && (
        <div className="mt-6 border border-wrong/40 bg-[#f5e7e4] text-wrong text-[13px] rounded-md px-3.5 py-2.5">
          {error}
        </div>
      )}

      <div className="mt-9 flex items-center gap-3">
        <Button size="lg" loading={pending} onClick={start}>
          Begin quiz session
        </Button>
        <Button variant="ghost" size="lg" onClick={() => router.push('/dashboard')}>
          ← Back
        </Button>
      </div>
    </div>
  );
}
