'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export type SubjectOption = {
  id: string;
  name: string;
  slug: string;
  questionCount: number;
};

type Props = {
  selected: string[];
  onChange: (ids: string[]) => void;
};

/**
 * Multi-select chip picker for choosing which subjects to draw questions from.
 * Empty selection = "all subjects".
 */
export function SubjectPicker({ selected, onChange }: Props) {
  const [subjects, setSubjects] = useState<SubjectOption[] | null>(null);

  useEffect(() => {
    fetch('/api/subjects', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d: { subjects: SubjectOption[] }) =>
        setSubjects(d.subjects.filter((s) => s.questionCount > 0)),
      )
      .catch(() => setSubjects([]));
  }, []);

  if (subjects === null) {
    return (
      <p className="text-[12.5px] text-mute serif-italic">Loading subjects…</p>
    );
  }
  if (subjects.length === 0) {
    return (
      <p className="text-[12.5px] text-mute serif-italic">
        No subjects available, questions will be drawn from the full bank.
      </p>
    );
  }

  const allSelected = selected.length === 0;
  const total = subjects.reduce((s, x) => s + x.questionCount, 0);

  function toggle(id: string) {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id));
    } else {
      onChange([...selected, id]);
    }
  }

  const selectedCount = allSelected
    ? total
    : subjects
        .filter((s) => selected.includes(s.id))
        .reduce((sum, s) => sum + s.questionCount, 0);

  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => onChange([])}
          className={cn(
            'h-9 px-3.5 text-[13px] font-medium tracking-tight rounded-md transition-colors focus-ring inline-flex items-center gap-2',
            allSelected
              ? 'bg-ink text-paper border border-ink'
              : 'bg-surface text-ink-2 border border-rule hover:border-mute hover:text-ink',
          )}
        >
          All subjects
          <span
            className={cn(
              'text-[11px] tabular-nums px-1.5 py-0.5 rounded',
              allSelected ? 'bg-paper/15 text-paper' : 'bg-paper-2 text-mute',
            )}
          >
            {total}
          </span>
        </button>
        {subjects.map((s) => {
          const active = selected.includes(s.id);
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => toggle(s.id)}
              className={cn(
                'h-9 px-3.5 text-[13px] font-medium tracking-tight rounded-md transition-colors focus-ring inline-flex items-center gap-2',
                active
                  ? 'bg-apothecary text-paper border border-apothecary-2'
                  : 'bg-surface text-ink-2 border border-rule hover:border-mute hover:text-ink',
              )}
            >
              {s.name}
              <span
                className={cn(
                  'text-[11px] tabular-nums px-1.5 py-0.5 rounded',
                  active ? 'bg-apothecary-2 text-paper' : 'bg-paper-2 text-mute',
                )}
              >
                {s.questionCount}
              </span>
            </button>
          );
        })}
      </div>
      <p className="mt-3 text-[12.5px] text-mute">
        {allSelected ? (
          <>
            Drawing from all <span className="serif-italic text-ink">{total}</span> questions.
          </>
        ) : (
          <>
            <span className="serif-italic text-ink">{selectedCount}</span>{' '}
            question{selectedCount === 1 ? '' : 's'} match the selection.
          </>
        )}
      </p>
    </div>
  );
}
