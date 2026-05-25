'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { adminApi, type AdminSubject } from '@/lib/api';
import { Card, PageHeader } from '@/components/admin/ui';
import { RichEditor } from '@/components/admin/RichEditor';
import { cn } from '@/lib/utils';

const LABELS = ['A', 'B', 'C', 'D', 'E'] as const;

export default function NewQuestionPage() {
  const router = useRouter();
  const search = useSearchParams();
  const initialSubject = search.get('subjectId') ?? '';
  const [subjects, setSubjects] = useState<AdminSubject[]>([]);
  const [vignette, setVignette] = useState('');
  const [explanation, setExplanation] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [subjectId, setSubjectId] = useState(initialSubject);
  const [texts, setTexts] = useState<string[]>(['', '', '', '', '']);
  const [correctIdx, setCorrectIdx] = useState(0);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    adminApi.subjects.list().then((r) => {
      setSubjects(r.subjects);
      if (!subjectId && r.subjects[0]) setSubjectId(r.subjects[0].id);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function save() {
    setErr(null);
    const choices = texts.map((t, i) => ({
      label: LABELS[i]!,
      text: t.trim(),
      isCorrect: i === correctIdx,
    }));
    const explanationStripped = explanation.replace(/<[^>]*>/g, '').trim();
    if (!vignette.trim() || !explanationStripped || choices.some((c) => !c.text)) {
      setErr('Vignette, explanation, and all 5 choice texts are required.');
      return;
    }
    setBusy(true);
    try {
      const res = await adminApi.questions.create({
        vignette: vignette.trim(),
        explanation,
        difficulty,
        subjectId: subjectId || undefined,
        choices,
      });
      router.push(`/admin/questions/${res.id}`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'failed');
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader
        numeral="§"
        title="New question"
        subtitle="Compose a vignette, five options, and an explanation. Click a letter to mark it correct."
        actions={
          <>
            <Link
              href="/admin/content"
              className="h-9 inline-flex items-center px-3 text-[13px] text-mute hover:text-ink"
            >
              Cancel
            </Link>
            <button
              type="button"
              onClick={save}
              disabled={busy}
              className="h-9 px-4 text-[13px] font-medium tracking-tight rounded-md bg-apothecary text-paper border border-apothecary-2 hover:bg-apothecary-2 disabled:opacity-50"
            >
              {busy ? 'Creating…' : 'Create question'}
            </button>
          </>
        }
      />

      <div className="px-8 py-7 space-y-6 max-w-[1100px]">
        {err && (
          <div className="border border-wrong/40 bg-[#f5e7e4] text-wrong text-[13px] rounded-md px-3.5 py-2.5">
            {err}
          </div>
        )}

        <Card title="Stem & explanation">
          <div className="px-5 py-5 space-y-5">
            <label className="flex flex-col gap-1.5">
              <span className="eyebrow">Vignette</span>
              <textarea
                value={vignette}
                onChange={(e) => setVignette(e.target.value)}
                rows={6}
                placeholder="A 42-year-old man presents with…"
                className="admin-input leading-[1.6]"
              />
            </label>
            <div className="flex flex-col gap-1.5">
              <span className="eyebrow">Explanation</span>
              <RichEditor
                value={explanation}
                onChange={setExplanation}
                placeholder="Why the correct option is right; why each distractor fails. Type / for blocks, use the toolbar for formatting + emojis."
                minHeight={320}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <label className="flex flex-col gap-1.5">
                <span className="eyebrow">Difficulty</span>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as never)}
                  className="admin-input"
                >
                  <option value="easy">easy</option>
                  <option value="medium">medium</option>
                  <option value="hard">hard</option>
                </select>
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="eyebrow">Subject</span>
                <select
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  className="admin-input"
                >
                  <option value="">(unassigned)</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        </Card>

        <Card title="Choices, click the letter to mark it correct">
          <ul className="divide-y divide-rule">
            {texts.map((t, i) => (
              <li key={i} className="px-5 py-4">
                <div className="flex items-start gap-4">
                  <button
                    type="button"
                    onClick={() => setCorrectIdx(i)}
                    className={cn(
                      'w-10 h-10 shrink-0 rounded-md flex items-center justify-center font-display text-[16px]',
                      i === correctIdx
                        ? 'bg-correct text-paper border border-correct'
                        : 'bg-paper-2 text-mute border border-rule hover:border-correct',
                    )}
                  >
                    {LABELS[i]}
                  </button>
                  <textarea
                    value={t}
                    onChange={(e) =>
                      setTexts((arr) => arr.map((x, j) => (j === i ? e.target.value : x)))
                    }
                    rows={2}
                    placeholder={`Choice ${LABELS[i]}…`}
                    className="admin-input flex-1"
                  />
                  {i === correctIdx && (
                    <span className="text-[10.5px] uppercase tracking-wider text-correct shrink-0 mt-3">
                      Correct
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <style jsx>{`
          :global(.admin-input) {
            background: var(--color-surface);
            border: 1px solid var(--color-rule);
            border-radius: 6px;
            padding: 9px 11px;
            font-size: 14px;
            color: var(--color-ink);
            width: 100%;
            outline: none;
            font-family: var(--font-body);
            line-height: 1.55;
          }
          :global(.admin-input:focus) {
            border-color: var(--color-apothecary);
            box-shadow: 0 0 0 3px rgba(41, 74, 61, 0.15);
          }
        `}</style>
      </div>
    </div>
  );
}
