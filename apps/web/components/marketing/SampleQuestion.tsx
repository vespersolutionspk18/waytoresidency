'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

const VIGNETTE = `A 40-year-old woman presents to the emergency department with progressive weakness and difficulty swallowing that started earlier in the day. She also reports blurred vision, dry mouth, and constipation. Her symptoms began 12 hours after attending a family gathering, where she ate home-canned vegetables. On examination, she has bilateral ptosis, facial weakness, and sluggish pupillary reactions. Muscle strength is reduced in both the upper and lower limbs, and deep tendon reflexes are absent.`;

const CHOICES = [
  { label: 'A', text: 'Botulism' },
  { label: 'B', text: 'Guillain-Barré Syndrome' },
  { label: 'C', text: 'Multiple Sclerosis' },
  { label: 'D', text: 'Myasthenia Gravis' },
  { label: 'E', text: 'Amyotrophic Lateral Sclerosis' },
];

const CORRECT = 'A';
const EXPLANATION = `Descending paralysis, cranial nerve dysfunction (ptosis, dysphagia), autonomic features (dry mouth, constipation) and sluggish pupils after ingestion of home-canned food are pathognomonic for Clostridium botulinum toxin, which blocks acetylcholine release at the neuromuscular junction. Differentiates from GBS (ascending, preserved pupils), MG (fatigable weakness, intact reflexes), and MS (CNS demyelination, UMN signs).`;

export function SampleQuestion() {
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);

  return (
    <article className="bg-surface border border-rule rounded-lg overflow-hidden">
      {/* meta strip */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-rule bg-paper-2">
        <div className="flex items-center gap-4">
          <span className="section-numeral">Vignette · No. 14</span>
          <span className="text-mute text-[12px]">Neurology · Toxicology</span>
        </div>
        <span className="eyebrow">Tutor preview</span>
      </header>

      <div className="px-6 py-6 md:px-8 md:py-7">
        <p className="text-[15.5px] text-ink-2 leading-[1.65] mb-6">
          {VIGNETTE}
        </p>

        <p className="serif-italic text-[15px] text-ink mb-3">
          What is the most likely diagnosis?
        </p>

        <ul className="grid gap-1.5 mb-5">
          {CHOICES.map((c) => {
            const isSel = selected === c.label;
            const isCorrect = revealed && c.label === CORRECT;
            const isWrong = revealed && isSel && c.label !== CORRECT;
            return (
              <li key={c.label}>
                <button
                  type="button"
                  onClick={() => !revealed && setSelected(c.label)}
                  className={cn(
                    'group w-full text-left flex items-baseline gap-3.5',
                    'px-3.5 py-2.5 rounded-md border transition-colors',
                    'focus-ring',
                    !revealed && !isSel && 'border-rule hover:border-mute hover:bg-paper',
                    isSel && !revealed && 'border-ink bg-paper',
                    isCorrect && 'border-correct bg-[#eaf0eb] text-correct',
                    isWrong && 'border-wrong bg-[#f5e7e4] text-wrong',
                  )}
                >
                  <span
                    className={cn(
                      'font-display italic text-[14px] w-5 shrink-0',
                      isCorrect ? 'text-correct' : isWrong ? 'text-wrong' : 'text-copper',
                    )}
                  >
                    {c.label}.
                  </span>
                  <span className="text-[14.5px] text-ink">{c.text}</span>
                </button>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center gap-4 pt-2 border-t border-rule">
          <button
            type="button"
            disabled={!selected || revealed}
            onClick={() => setRevealed(true)}
            className={cn(
              'h-9 px-4 text-[13px] font-medium tracking-tight rounded-md',
              'bg-apothecary text-paper border border-apothecary-2',
              'hover:bg-apothecary-2 transition-colors',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'focus-ring',
            )}
          >
            Submit answer
          </button>
          {revealed && (
            <button
              type="button"
              onClick={() => {
                setSelected(null);
                setRevealed(false);
              }}
              className="text-[13px] text-mute hover:text-ink underline underline-offset-4 decoration-rule-2 hover:decoration-mute focus-ring"
            >
              Reset
            </button>
          )}
          <span className="ml-auto text-[12px] text-mute">
            {revealed
              ? selected === CORRECT
                ? 'Correct.'
                : `Answer: ${CORRECT}.`
              : selected
                ? 'Awaiting submission.'
                : 'Pick one to continue.'}
          </span>
        </div>

        {revealed && (
          <div className="mt-5 rise">
            <div className="eyebrow mb-2">Explanation</div>
            <p className="text-[14.5px] text-ink-2 leading-[1.65]">{EXPLANATION}</p>
          </div>
        )}
      </div>
    </article>
  );
}
