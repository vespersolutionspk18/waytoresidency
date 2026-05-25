'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { SubjectPicker } from '@/components/ui/SubjectPicker';
import { cn } from '@/lib/utils';

const COUNTS = [5, 10, 20, 40];

export default function NewTutorPage() {
  const router = useRouter();
  const [count, setCount] = useState(10);
  const [subjectIds, setSubjectIds] = useState<string[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    setError(null);
    setPending(true);
    try {
      const res = await api.createAttempt({
        mode: 'tutor',
        questionCount: count,
        subjectIds: subjectIds.length > 0 ? subjectIds : undefined,
      });
      router.push(`/tutor/${res.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not start session.');
      setPending(false);
    }
  }

  return (
    <div className="mx-auto max-w-[840px] px-6 md:px-8 py-14 rise">
      <div className="flex items-baseline gap-3 mb-2">
        <span className="section-numeral">§ New</span>
        <span className="eyebrow">Tutor session</span>
      </div>
      <h1
        className="font-display text-[36px] leading-[1.05] tracking-[-0.015em] text-ink"
        style={{ fontWeight: 430 }}
      >
        Begin a <span className="serif-italic text-apothecary">tutor</span> session.
      </h1>
      <p className="mt-3 max-w-[55ch] text-[15px] text-ink-2 leading-[1.6]">
        Answer one question at a time. The explanation appears as soon as you
        submit. Skip, flag for review, and switch between questions freely.
      </p>

      <div className="rule my-9" />

      <div>
        <div className="eyebrow mb-3">Subjects</div>
        <SubjectPicker selected={subjectIds} onChange={setSubjectIds} />
      </div>

      <div className="mt-9">
        <div className="eyebrow mb-3">How many questions?</div>
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

      {error && (
        <div className="mt-6 border border-wrong/40 bg-[#f5e7e4] text-wrong text-[13px] rounded-md px-3.5 py-2.5">
          {error}
        </div>
      )}

      <div className="mt-9 flex items-center gap-3">
        <Button size="lg" loading={pending} onClick={start}>
          Begin tutor session
        </Button>
        <Button variant="ghost" size="lg" onClick={() => router.push('/dashboard')}>
          ← Back
        </Button>
      </div>
    </div>
  );
}
