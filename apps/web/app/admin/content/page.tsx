'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { adminApi, type AdminCourse, type AdminQuestionRow, type AdminSubject } from '@/lib/api';
import { PageHeader, Pill } from '@/components/admin/ui';
import { cn } from '@/lib/utils';

type Pane = 'view' | 'newCourse' | 'editCourse' | 'newSubject' | 'editSubject';

export default function AdminContentPage() {
  const [courses, setCourses] = useState<AdminCourse[] | null>(null);
  const [subjects, setSubjects] = useState<AdminSubject[] | null>(null);
  const [questions, setQuestions] = useState<AdminQuestionRow[] | null>(null);

  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);

  const [pane, setPane] = useState<Pane>('view');
  const [paneTarget, setPaneTarget] = useState<AdminCourse | AdminSubject | null>(null);

  function loadCourses() {
    adminApi.courses.list().then((r) => {
      setCourses(r.courses);
      if (!selectedCourseId && r.courses[0]) setSelectedCourseId(r.courses[0].id);
    });
  }
  function loadSubjects(courseId: string | null) {
    if (!courseId) {
      setSubjects([]);
      return;
    }
    adminApi.subjects.list().then((r) => {
      const filtered = r.subjects.filter((s) => s.courseId === courseId);
      setSubjects(filtered);
      if (!selectedSubjectId || !filtered.some((s) => s.id === selectedSubjectId)) {
        setSelectedSubjectId(filtered[0]?.id ?? null);
      }
    });
  }
  function loadQuestions(subjectId: string | null) {
    if (!subjectId) {
      setQuestions([]);
      return;
    }
    adminApi.questions
      .list({ subjectId })
      .then((r) => setQuestions(r.questions))
      .catch(() => setQuestions([]));
  }

  useEffect(loadCourses, []);
  useEffect(() => {
    loadSubjects(selectedCourseId);
  }, [selectedCourseId]);
  useEffect(() => {
    loadQuestions(selectedSubjectId);
  }, [selectedSubjectId]);

  const activeCourse = useMemo(
    () => courses?.find((c) => c.id === selectedCourseId) ?? null,
    [courses, selectedCourseId],
  );
  const activeSubject = useMemo(
    () => subjects?.find((s) => s.id === selectedSubjectId) ?? null,
    [subjects, selectedSubjectId],
  );

  return (
    <div className="flex flex-col lg:h-screen">
      <PageHeader
        numeral="§"
        title="Content"
        subtitle="Course → Subject → Question. Click a row to drill down; use the buttons in each column to add or edit."
        actions={
          activeSubject && (
            <Link
              href={`/admin/questions/new?subjectId=${activeSubject.id}`}
              className="h-9 inline-flex items-center px-3.5 text-[13px] font-medium rounded-md bg-apothecary text-paper border border-apothecary-2 hover:bg-apothecary-2"
            >
              + New question
            </Link>
          )
        }
      />

      <div className="grid grid-cols-12 flex-1 min-h-0">
        {/* ---------- Column 1: Courses ---------- */}
        <Column
          title="Courses"
          count={courses?.length}
          addLabel="+ New course"
          onAdd={() => {
            setPane('newCourse');
            setPaneTarget(null);
          }}
          loading={courses === null}
        >
          {(courses ?? []).map((c) => (
            <TreeRow
              key={c.id}
              active={c.id === selectedCourseId}
              onClick={() => setSelectedCourseId(c.id)}
              onEdit={() => {
                setPane('editCourse');
                setPaneTarget(c);
              }}
              right={<span className="tabular-nums text-[11px] opacity-70">{c.subjectCount}</span>}
              footer={
                <>
                  <span className="font-mono text-[11px] opacity-60">{c.slug}</span>
                  {!c.isPublished && (
                    <Pill status="warn">draft</Pill>
                  )}
                </>
              }
            >
              {c.name}
            </TreeRow>
          ))}
          {courses && courses.length === 0 && (
            <div className="px-4 py-6 text-[12.5px] serif-italic text-mute text-center">
              No courses. Create one to start grouping subjects.
            </div>
          )}
        </Column>

        {/* ---------- Column 2: Subjects ---------- */}
        <Column
          title={activeCourse ? `${activeCourse.name} · subjects` : 'Subjects'}
          count={subjects?.length}
          addLabel={activeCourse ? '+ New subject' : null}
          onAdd={
            activeCourse
              ? () => {
                  setPane('newSubject');
                  setPaneTarget(null);
                }
              : undefined
          }
          loading={subjects === null}
          empty={activeCourse ? null : 'Pick a course on the left.'}
        >
          {(subjects ?? []).map((s) => (
            <TreeRow
              key={s.id}
              active={s.id === selectedSubjectId}
              onClick={() => setSelectedSubjectId(s.id)}
              onEdit={() => {
                setPane('editSubject');
                setPaneTarget(s);
              }}
              right={<span className="tabular-nums text-[11px] opacity-70">{s.questionCount}</span>}
              footer={<span className="font-mono text-[11px] opacity-60">{s.slug}</span>}
            >
              {s.name}
            </TreeRow>
          ))}
          {subjects && subjects.length === 0 && activeCourse && (
            <div className="px-4 py-6 text-[12.5px] serif-italic text-mute text-center">
              No subjects in this course yet.
            </div>
          )}
        </Column>

        {/* ---------- Column 3: Questions ---------- */}
        <Column
          title={activeSubject ? `${activeSubject.name} · questions` : 'Questions'}
          count={questions?.length}
          loading={questions === null}
          wide
          empty={activeSubject ? null : 'Pick a subject in the middle column.'}
        >
          {(questions ?? []).map((q, i) => (
            <Link
              key={q.id}
              href={`/admin/questions/${q.id}`}
              className="block px-4 py-3 border-b border-rule last:border-b-0 hover:bg-paper-2 transition-colors"
            >
              <div className="flex items-start gap-3">
                <span className="font-display italic text-mute shrink-0 w-7 tabular-nums text-[13px]">
                  {i + 1}.
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[13.5px] text-ink line-clamp-2 leading-[1.45]">{q.vignette}</p>
                  <div className="mt-1 flex items-center gap-2 text-[11px] text-mute">
                    <span className="uppercase tracking-wider">{q.difficulty}</span>
                    {q.source && (
                      <>
                        <span>·</span>
                        <span>{q.source}</span>
                      </>
                    )}
                  </div>
                </div>
                <span className="text-mute shrink-0 text-[14px]">→</span>
              </div>
            </Link>
          ))}
          {questions && questions.length === 0 && activeSubject && (
            <div className="px-4 py-6 text-[12.5px] serif-italic text-mute text-center">
              No questions in this subject yet.{' '}
              <Link
                href={`/admin/questions/new?subjectId=${activeSubject.id}`}
                className="text-apothecary hover:underline"
              >
                Add one →
              </Link>
            </div>
          )}
        </Column>
      </div>

      {/* ---------- Bottom drawer for create/edit forms ---------- */}
      {pane !== 'view' && (
        <div className="border-t border-rule bg-paper-2 shadow-[0_-4px_16px_rgba(0,0,0,0.03)]">
          {pane === 'newCourse' && (
            <CourseForm
              onCancel={() => setPane('view')}
              onSave={async (data) => {
                await adminApi.courses.create(data);
                setPane('view');
                loadCourses();
              }}
            />
          )}
          {pane === 'editCourse' && paneTarget && 'subjectCount' in paneTarget && (
            <CourseForm
              initial={paneTarget as AdminCourse}
              onCancel={() => setPane('view')}
              onSave={async (data) => {
                await adminApi.courses.update((paneTarget as AdminCourse).id, data);
                setPane('view');
                loadCourses();
              }}
              onDelete={async () => {
                if (!confirm(`Delete course "${(paneTarget as AdminCourse).name}"? Subjects will be unlinked.`)) return;
                await adminApi.courses.delete((paneTarget as AdminCourse).id);
                setPane('view');
                setSelectedCourseId(null);
                loadCourses();
              }}
            />
          )}
          {pane === 'newSubject' && activeCourse && (
            <SubjectForm
              courseId={activeCourse.id}
              onCancel={() => setPane('view')}
              onSave={async (data) => {
                await adminApi.subjects.create({ ...data, courseId: activeCourse.id });
                setPane('view');
                loadSubjects(selectedCourseId);
              }}
            />
          )}
          {pane === 'editSubject' && paneTarget && 'questionCount' in paneTarget && (
            <SubjectForm
              initial={paneTarget as AdminSubject}
              courseId={(paneTarget as AdminSubject).courseId}
              onCancel={() => setPane('view')}
              onSave={async (data) => {
                await adminApi.subjects.update((paneTarget as AdminSubject).id, data);
                setPane('view');
                loadSubjects(selectedCourseId);
              }}
              onDelete={async () => {
                if (!confirm(`Delete subject "${(paneTarget as AdminSubject).name}"? Its questions will be unassigned.`)) return;
                await adminApi.subjects.delete((paneTarget as AdminSubject).id);
                setPane('view');
                setSelectedSubjectId(null);
                loadSubjects(selectedCourseId);
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}

// ---------- subcomponents ----------

function Column({
  title,
  count,
  addLabel,
  onAdd,
  loading,
  empty,
  children,
  wide,
}: {
  title: string;
  count?: number;
  addLabel?: string | null;
  onAdd?: () => void;
  loading: boolean;
  empty?: string | null;
  children?: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className={cn(
      'flex flex-col min-h-0 border-b lg:border-b-0 lg:border-r border-rule lg:last:border-r-0',
      // Mobile: each column gets full width and caps at ~55vh so the three stack with internal scroll.
      // Desktop: keeps the 3-3-6 layout.
      wide ? 'col-span-12 lg:col-span-6' : 'col-span-12 lg:col-span-3',
      'max-h-[55vh] lg:max-h-none',
    )}>
      <header className="px-4 py-3 border-b border-rule bg-paper-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="eyebrow text-[10.5px]">{title}</span>
          {count != null && (
            <span className="text-[11px] text-mute tabular-nums">{count}</span>
          )}
        </div>
        {onAdd && addLabel && (
          <button
            type="button"
            onClick={onAdd}
            className="text-[12px] text-apothecary hover:underline"
          >
            {addLabel}
          </button>
        )}
      </header>
      <div className="flex-1 overflow-y-auto bg-surface">
        {loading ? (
          <div className="px-4 py-6 text-[12.5px] serif-italic text-mute">Loading…</div>
        ) : empty ? (
          <div className="px-4 py-6 text-[12.5px] serif-italic text-mute text-center">
            {empty}
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

function TreeRow({
  active,
  onClick,
  onEdit,
  right,
  footer,
  children,
}: {
  active: boolean;
  onClick: () => void;
  onEdit?: () => void;
  right?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'group relative border-b border-rule last:border-b-0 cursor-pointer transition-colors',
        active ? 'bg-apothecary-soft' : 'hover:bg-paper-2',
      )}
      onClick={onClick}
    >
      <div className={cn('px-4 py-2.5', active && 'pl-3 border-l-[3px] border-l-apothecary')}>
        <div className="flex items-center justify-between gap-2">
          <span className={cn('text-[13.5px]', active ? 'text-ink' : 'text-ink-2')}>{children}</span>
          {right}
        </div>
        {footer && (
          <div className="mt-0.5 flex items-center gap-2">{footer}</div>
        )}
      </div>
      {onEdit && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className={cn(
            'absolute right-2 top-2 px-2 py-0.5 text-[10.5px] uppercase tracking-wider rounded transition-opacity',
            'opacity-0 group-hover:opacity-100',
            active ? 'text-apothecary' : 'text-mute hover:text-ink',
          )}
        >
          edit
        </button>
      )}
    </div>
  );
}

function CourseForm({
  initial,
  onSave,
  onCancel,
  onDelete,
}: {
  initial?: Partial<AdminCourse>;
  onSave: (data: { slug: string; name: string; description?: string; sortOrder?: number; isPublished?: boolean }) => Promise<void>;
  onCancel: () => void;
  onDelete?: () => Promise<void>;
}) {
  const [slug, setSlug] = useState(initial?.slug ?? '');
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [sortOrder, setSortOrder] = useState(String(initial?.sortOrder ?? 0));
  const [isPublished, setIsPublished] = useState(initial?.isPublished ?? true);
  const [busy, setBusy] = useState(false);

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
          await onSave({
            slug,
            name,
            description: description || undefined,
            sortOrder: Number(sortOrder) || 0,
            isPublished,
          });
        } finally {
          setBusy(false);
        }
      }}
      className="px-6 py-5 grid grid-cols-1 md:grid-cols-12 gap-4 items-end"
    >
      <div className="md:col-span-3">
        <Label>Slug</Label>
        <input value={slug} onChange={(e) => setSlug(e.target.value)} required pattern="[a-z0-9-]+" className="admin-input font-mono" />
      </div>
      <div className="md:col-span-4">
        <Label>Name</Label>
        <input value={name} onChange={(e) => setName(e.target.value)} required className="admin-input" />
      </div>
      <div className="md:col-span-3">
        <Label>Description</Label>
        <input value={description} onChange={(e) => setDescription(e.target.value)} className="admin-input" />
      </div>
      <div className="md:col-span-1">
        <Label>Order</Label>
        <input value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} inputMode="numeric" className="admin-input" />
      </div>
      <div className="md:col-span-1 flex items-end">
        <label className="inline-flex items-center gap-2 h-[36px] text-[13.5px] text-ink">
          <input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} className="w-4 h-4 accent-apothecary" />
          live
        </label>
      </div>
      <div className="md:col-span-12 flex items-center justify-between gap-3">
        <div className="flex gap-2">
          <button type="submit" disabled={busy} className="h-9 px-4 text-[13px] font-medium rounded-md bg-apothecary text-paper border border-apothecary-2 hover:bg-apothecary-2 disabled:opacity-50">
            {busy ? 'Saving…' : initial ? 'Save course' : 'Create course'}
          </button>
          <button type="button" onClick={onCancel} className="h-9 px-3 text-[13px] text-ink-2 hover:text-ink">
            Cancel
          </button>
        </div>
        {onDelete && (
          <button type="button" onClick={onDelete} className="h-9 px-3 text-[12.5px] text-wrong hover:underline">
            Delete course
          </button>
        )}
      </div>
      <style jsx>{`
        :global(.admin-input) {
          background: var(--color-surface);
          border: 1px solid var(--color-rule);
          border-radius: 6px;
          padding: 7px 9px;
          font-size: 13.5px;
          color: var(--color-ink);
          width: 100%;
          outline: none;
        }
        :global(.admin-input:focus) {
          border-color: var(--color-apothecary);
          box-shadow: 0 0 0 3px rgba(41, 74, 61, 0.15);
        }
      `}</style>
    </form>
  );
}

function SubjectForm({
  initial,
  courseId,
  onSave,
  onCancel,
  onDelete,
}: {
  initial?: Partial<AdminSubject>;
  courseId?: string | null;
  onSave: (data: { slug: string; name: string; description?: string; sortOrder?: number }) => Promise<void>;
  onCancel: () => void;
  onDelete?: () => Promise<void>;
}) {
  const [slug, setSlug] = useState(initial?.slug ?? '');
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [sortOrder, setSortOrder] = useState(String(initial?.sortOrder ?? 0));
  const [busy, setBusy] = useState(false);

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
          await onSave({
            slug,
            name,
            description: description || undefined,
            sortOrder: Number(sortOrder) || 0,
          });
        } finally {
          setBusy(false);
        }
      }}
      className="px-6 py-5 grid grid-cols-1 md:grid-cols-12 gap-4 items-end"
    >
      <div className="md:col-span-3">
        <Label>Slug</Label>
        <input value={slug} onChange={(e) => setSlug(e.target.value)} required pattern="[a-z0-9-]+" className="admin-input font-mono" />
      </div>
      <div className="md:col-span-4">
        <Label>Name</Label>
        <input value={name} onChange={(e) => setName(e.target.value)} required className="admin-input" />
      </div>
      <div className="md:col-span-4">
        <Label>Description</Label>
        <input value={description} onChange={(e) => setDescription(e.target.value)} className="admin-input" />
      </div>
      <div className="md:col-span-1">
        <Label>Order</Label>
        <input value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} inputMode="numeric" className="admin-input" />
      </div>
      <div className="md:col-span-12 flex items-center justify-between gap-3">
        <div className="flex gap-2">
          <button type="submit" disabled={busy} className="h-9 px-4 text-[13px] font-medium rounded-md bg-apothecary text-paper border border-apothecary-2 hover:bg-apothecary-2 disabled:opacity-50">
            {busy ? 'Saving…' : initial ? 'Save subject' : 'Create subject'}
          </button>
          <button type="button" onClick={onCancel} className="h-9 px-3 text-[13px] text-ink-2 hover:text-ink">
            Cancel
          </button>
        </div>
        {onDelete && (
          <button type="button" onClick={onDelete} className="h-9 px-3 text-[12.5px] text-wrong hover:underline">
            Delete subject
          </button>
        )}
      </div>
      <style jsx>{`
        :global(.admin-input) {
          background: var(--color-surface);
          border: 1px solid var(--color-rule);
          border-radius: 6px;
          padding: 7px 9px;
          font-size: 13.5px;
          color: var(--color-ink);
          width: 100%;
          outline: none;
        }
        :global(.admin-input:focus) {
          border-color: var(--color-apothecary);
          box-shadow: 0 0 0 3px rgba(41, 74, 61, 0.15);
        }
      `}</style>
    </form>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="eyebrow text-[10.5px] mb-1.5">{children}</div>
  );
}
