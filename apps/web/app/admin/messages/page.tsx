'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminApi, type ContactSubmission } from '@/lib/api';
import { PageHeader, Empty } from '@/components/admin/ui';
import { cn } from '@/lib/utils';

export default function AdminMessagesPage() {
  const [submissions, setSubmissions] = useState<ContactSubmission[] | null>(
    null,
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unhandled' | 'handled'>('all');

  function load() {
    adminApi.contactSubmissions
      .list()
      .then((r) => {
        setSubmissions(r.submissions);
        if (selectedId && !r.submissions.some((s) => s.id === selectedId)) {
          setSelectedId(null);
        } else if (!selectedId && r.submissions[0]) {
          setSelectedId(r.submissions[0].id);
        }
      })
      .catch(() => setSubmissions([]));
  }

  useEffect(load, []);

  const filtered = useMemo(() => {
    if (!submissions) return null;
    if (filter === 'unhandled') return submissions.filter((s) => !s.handled);
    if (filter === 'handled') return submissions.filter((s) => s.handled);
    return submissions;
  }, [submissions, filter]);

  const selected = useMemo(
    () => submissions?.find((s) => s.id === selectedId) ?? null,
    [submissions, selectedId],
  );

  async function deleteSelected() {
    if (!selected) return;
    if (
      !confirm(
        `Delete the message from ${selected.firstName}${selected.lastName ? ` ${selected.lastName}` : ''}? This cannot be undone.`,
      )
    )
      return;
    setBusy(true);
    try {
      await adminApi.contactSubmissions.delete(selected.id);
      setSelectedId(null);
      load();
    } finally {
      setBusy(false);
    }
  }

  async function toggleHandled() {
    if (!selected) return;
    setBusy(true);
    try {
      await adminApi.contactSubmissions.setHandled(selected.id, !selected.handled);
      load();
    } finally {
      setBusy(false);
    }
  }

  const unhandledCount =
    submissions?.filter((s) => !s.handled).length ?? 0;

  return (
    <div className="flex flex-col h-screen">
      <PageHeader
        numeral="§"
        title="Messages"
        subtitle={
          unhandledCount > 0
            ? `${unhandledCount} unhandled message${unhandledCount === 1 ? '' : 's'}.`
            : 'Contact form submissions from the marketing site.'
        }
        actions={
          <>
            {/* Delete sits at the top, on the LEFT of the action area (just left of filters), only when something is selected. */}
            {selected && (
              <button
                type="button"
                onClick={deleteSelected}
                disabled={busy}
                className="h-9 inline-flex items-center px-3.5 text-[13px] font-medium rounded-md border border-wrong/40 text-wrong hover:bg-[#f5e7e4] transition-colors disabled:opacity-50 mr-auto"
              >
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden className="mr-1.5">
                  <path d="M2 4h10M5 4V2.5h4V4M5.5 7v3.5M8.5 7v3.5M3.5 4l.5 7.5h6L10.5 4" />
                </svg>
                Delete
              </button>
            )}
          </>
        }
      />

      <div className="border-b border-rule px-8 py-3 flex items-center justify-between flex-wrap gap-3">
        <div className="flex flex-wrap gap-1.5">
          {(['all', 'unhandled', 'handled'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={cn(
                'h-8 px-3 text-[12.5px] font-medium rounded transition-colors capitalize',
                filter === f
                  ? 'bg-ink text-paper'
                  : 'text-ink-2 hover:text-ink hover:bg-paper-2',
              )}
            >
              {f}
            </button>
          ))}
        </div>
        {submissions && (
          <span className="text-[12.5px] text-mute">
            {filtered?.length ?? 0} of {submissions.length}
          </span>
        )}
      </div>

      <div className="grid grid-cols-12 flex-1 min-h-0">
        {/* List */}
        <aside className="col-span-12 lg:col-span-5 border-r border-rule overflow-y-auto bg-paper-2/40">
          {filtered === null ? (
            <div className="px-5 py-6 serif-italic text-mute">Loading…</div>
          ) : filtered.length === 0 ? (
            <Empty>
              {submissions && submissions.length === 0
                ? 'No messages yet. Submissions from /contact will appear here.'
                : 'No messages match the filter.'}
            </Empty>
          ) : (
            <ul>
              {filtered.map((m) => (
                <li
                  key={m.id}
                  role="link"
                  tabIndex={0}
                  onClick={() => setSelectedId(m.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedId(m.id);
                    }
                  }}
                  className={cn(
                    'cursor-pointer border-b border-rule transition-colors py-3',
                    selectedId === m.id
                      ? 'bg-apothecary-soft border-l-[3px] border-l-apothecary pl-[13px] pr-4'
                      : 'hover:bg-paper-2 px-4',
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-[14px] text-ink truncate flex items-center gap-2">
                        {m.firstName}
                        {m.lastName ? ` ${m.lastName}` : ''}
                        {!m.handled && (
                          <span className="w-1.5 h-1.5 rounded-full bg-copper shrink-0" aria-hidden />
                        )}
                      </div>
                      <div className="text-[11.5px] text-mute truncate">{m.email}</div>
                      <p className="mt-1.5 text-[12.5px] text-ink-2 leading-[1.5] line-clamp-2">
                        {m.message}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="text-[11px] text-mute">
                        {fmtRelative(m.createdAt)}
                      </div>
                      {m.handled && (
                        <span className="mt-1 inline-block text-[9.5px] uppercase tracking-wider text-correct font-medium">
                          handled
                        </span>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </aside>

        {/* Detail */}
        <main className="col-span-12 lg:col-span-7 overflow-y-auto">
          {!selected ? (
            <div className="h-full flex items-center justify-center">
              <p className="serif-italic text-mute">
                {submissions && submissions.length === 0
                  ? 'No messages yet.'
                  : 'Pick a message on the left.'}
              </p>
            </div>
          ) : (
            <div className="px-7 py-7 max-w-[820px]">
              <div className="flex items-center justify-between gap-3 mb-5">
                <span className="eyebrow">Message</span>
                <button
                  type="button"
                  onClick={toggleHandled}
                  disabled={busy}
                  className={cn(
                    'h-8 px-3 text-[12px] font-medium rounded transition-colors disabled:opacity-50',
                    selected.handled
                      ? 'bg-paper-2 text-mute border border-rule hover:text-ink'
                      : 'bg-correct text-paper hover:bg-[#256544]',
                  )}
                >
                  {selected.handled ? 'Mark as unhandled' : 'Mark as handled'}
                </button>
              </div>

              <h2
                className="font-display text-[28px] text-ink leading-[1.1] tracking-[-0.012em]"
                style={{ fontWeight: 450 }}
              >
                {selected.firstName}
                {selected.lastName ? ` ${selected.lastName}` : ''}
              </h2>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-[12.5px] text-mute">
                <a
                  href={`mailto:${selected.email}`}
                  className="text-apothecary hover:text-apothecary-2"
                >
                  {selected.email}
                </a>
                {selected.phone && (
                  <>
                    <span>·</span>
                    <a
                      href={`https://wa.me/${selected.phone.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-apothecary hover:text-apothecary-2"
                    >
                      {selected.phone}
                    </a>
                  </>
                )}
                <span>·</span>
                <span>{new Date(selected.createdAt).toLocaleString()}</span>
              </div>

              <div className="my-6 rule" />

              <div className="eyebrow mb-3">Message body</div>
              <div className="bg-surface border border-rule rounded-lg px-6 py-5">
                <p className="text-[15.5px] text-ink-2 leading-[1.75] whitespace-pre-line">
                  {selected.message}
                </p>
              </div>

              <div className="mt-7 flex flex-wrap gap-3">
                <a
                  href={`mailto:${selected.email}?subject=Re: your message to Way to Residency`}
                  className="h-10 inline-flex items-center px-4 text-[13.5px] font-medium tracking-tight rounded-md bg-apothecary text-paper border border-apothecary-2 hover:bg-apothecary-2 transition-colors"
                >
                  Reply by email
                </a>
                {selected.phone && (
                  <a
                    href={`https://wa.me/${selected.phone.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-10 inline-flex items-center px-4 text-[13.5px] tracking-tight text-ink-2 hover:text-ink border border-rule rounded-md hover:border-mute hover:bg-paper-2"
                  >
                    Open on WhatsApp
                  </a>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function fmtRelative(iso: string): string {
  const d = new Date(iso);
  const diffMs = Date.now() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
