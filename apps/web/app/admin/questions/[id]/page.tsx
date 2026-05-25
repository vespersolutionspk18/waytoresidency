'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { use, useEffect, useMemo, useState } from 'react';
import {
  adminApi,
  type AdminQuestionDetail,
  type AdminSubject,
} from '@/lib/api';
import { Card, PageHeader, fmtDateTime } from '@/components/admin/ui';
import { RichEditor } from '@/components/admin/RichEditor';
import { cn } from '@/lib/utils';

export default function AdminEditQuestionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [data, setData] = useState<AdminQuestionDetail | null>(null);
  const [subjects, setSubjects] = useState<AdminSubject[]>([]);

  // editable copies
  const [vignette, setVignette] = useState('');
  const [explanation, setExplanation] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [subjectId, setSubjectId] = useState<string>('');
  const [choices, setChoices] = useState<AdminQuestionDetail['choices']>([]);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  function load() {
    adminApi.questions.get(id).then((d) => {
      setData(d);
      setVignette(d.question.vignette);
      setExplanation(d.question.explanation);
      setDifficulty(d.question.difficulty);
      setChoices(d.choices);
      setSubjectId(d.subject?.id ?? '');
      setSavedAt(null);
    });
  }
  useEffect(() => {
    load();
    adminApi.subjects.list().then((r) => setSubjects(r.subjects)).catch(() => {});
  }, [id]);

  // dirty tracking
  const dirty = useMemo(() => {
    if (!data) return false;
    if (vignette !== data.question.vignette) return true;
    if (explanation !== data.question.explanation) return true;
    if (difficulty !== data.question.difficulty) return true;
    if ((data.subject?.id ?? '') !== subjectId) return true;
    const byId = new Map(data.choices.map((c) => [c.id, c]));
    for (const c of choices) {
      const orig = byId.get(c.id);
      if (!orig) return true;
      if (orig.text !== c.text) return true;
      if (orig.isCorrect !== c.isCorrect) return true;
      if ((orig.rationale ?? null) !== (c.rationale ?? null)) return true;
    }
    return false;
  }, [data, vignette, explanation, difficulty, subjectId, choices]);

  if (!data) return <p className="p-8 serif-italic text-mute">Loading…</p>;

  async function save() {
    setError(null);
    const correctCount = choices.filter((c) => c.isCorrect).length;
    if (correctCount !== 1) {
      setError('Exactly one choice must be marked correct.');
      return;
    }
    if (!vignette.trim()) {
      setError('Vignette can’t be empty.');
      return;
    }
    const explanationStripped = explanation.replace(/<[^>]*>/g, '').trim();
    if (!explanationStripped) {
      setError('Explanation can’t be empty.');
      return;
    }
    if (choices.some((c) => !c.text.trim())) {
      setError('Every choice needs text.');
      return;
    }
    setSaving(true);
    try {
      await adminApi.questions.replace(id, {
        vignette: vignette.trim(),
        explanation,
        difficulty,
        subjectId: subjectId || null,
        choices: choices.map((c) => ({
          id: c.id,
          text: c.text.trim(),
          isCorrect: c.isCorrect,
          rationale: c.rationale,
        })),
      });
      setSavedAt(Date.now());
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed.');
    } finally {
      setSaving(false);
    }
  }

  async function deleteQuestion() {
    if (!confirm('Delete this question? Attempts referencing it will fail.')) return;
    await adminApi.questions.delete(id);
    router.push('/admin/content');
  }

  function markCorrectLocal(choiceId: string) {
    setChoices((cs) =>
      cs.map((c) => ({ ...c, isCorrect: c.id === choiceId })),
    );
  }

  return (
    <div>
      <PageHeader
        numeral="§"
        title={`Q · ${data.question.id.slice(0, 8)}`}
        subtitle={`${data.subject?.name ?? 'unassigned'} · ${data.question.difficulty} · created ${fmtDateTime(data.question.createdAt)}`}
        actions={
          <>
            <Link
              href="/admin/content"
              className="h-9 inline-flex items-center px-3 text-[13px] text-mute hover:text-ink"
            >
              ← Back
            </Link>
            <button
              type="button"
              onClick={deleteQuestion}
              className="h-9 px-3 text-[12.5px] text-wrong border border-wrong/40 rounded-md hover:bg-[#f5e7e4]"
            >
              Delete
            </button>
            <SaveStatus dirty={dirty} saving={saving} savedAt={savedAt} />
            <button
              type="button"
              onClick={save}
              disabled={saving || !dirty}
              className={cn(
                'h-9 px-4 text-[13px] font-medium tracking-tight rounded-md border transition-colors',
                dirty
                  ? 'bg-apothecary text-paper border-apothecary-2 hover:bg-apothecary-2'
                  : 'bg-paper-2 text-mute border-rule cursor-not-allowed',
                'disabled:opacity-60',
              )}
            >
              {saving ? 'Saving…' : 'Save question'}
            </button>
          </>
        }
      />

      <div className="px-4 sm:px-6 md:px-8 py-5 md:py-7 space-y-5 md:space-y-6 max-w-[1100px]">
        {error && (
          <div className="border border-wrong/40 bg-[#f5e7e4] text-wrong text-[13px] rounded-md px-3.5 py-2.5">
            {error}
          </div>
        )}

        <Card title="Vignette + Explanation">
          <div className="px-5 py-5 space-y-5">
            <label className="flex flex-col gap-1.5">
              <span className="eyebrow">Vignette</span>
              <textarea
                value={vignette}
                onChange={(e) => setVignette(e.target.value)}
                rows={6}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

        <Card title="Choices, click a letter to mark it correct">
          <ul className="divide-y divide-rule">
            {choices.map((c, i) => (
              <li key={c.id} className="px-5 py-4">
                <div className="flex items-start gap-4">
                  <button
                    type="button"
                    onClick={() => markCorrectLocal(c.id)}
                    className={cn(
                      'w-10 h-10 shrink-0 rounded-md flex items-center justify-center font-display text-[16px] transition-colors',
                      c.isCorrect
                        ? 'bg-correct text-paper border border-correct'
                        : 'bg-paper-2 text-mute border border-rule hover:border-correct hover:text-correct',
                    )}
                    aria-label={c.isCorrect ? `Choice ${c.label} is correct` : `Set ${c.label} as correct`}
                  >
                    {c.label}
                  </button>
                  <div className="flex-1 space-y-2">
                    <textarea
                      value={c.text}
                      onChange={(e) =>
                        setChoices((cs) =>
                          cs.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)),
                        )
                      }
                      rows={2}
                      className="admin-input"
                    />
                    <input
                      placeholder="Optional rationale shown next to this choice…"
                      value={c.rationale ?? ''}
                      onChange={(e) =>
                        setChoices((cs) =>
                          cs.map((x, j) =>
                            j === i ? { ...x, rationale: e.target.value || null } : x,
                          ),
                        )
                      }
                      className="admin-input text-[12.5px]"
                    />
                  </div>
                  {c.isCorrect && (
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

function SaveStatus({
  dirty,
  saving,
  savedAt,
}: {
  dirty: boolean;
  saving: boolean;
  savedAt: number | null;
}) {
  if (saving) return null;
  if (dirty) {
    return (
      <span className="text-[11.5px] uppercase tracking-wider text-copper px-2">
        Unsaved
      </span>
    );
  }
  if (savedAt && Date.now() - savedAt < 5000) {
    return (
      <span className="text-[11.5px] uppercase tracking-wider text-correct px-2">
        Saved
      </span>
    );
  }
  return null;
}
