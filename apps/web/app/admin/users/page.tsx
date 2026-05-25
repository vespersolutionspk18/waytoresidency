'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  adminApi,
  type AdminUserDetail,
  type AdminUserRow,
} from '@/lib/api';
import { PageHeader, Empty, statusPill, fmtDate, fmtDateTime, fmtMoney } from '@/components/admin/ui';
import { cn } from '@/lib/utils';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUserRow[] | null>(null);
  const [q, setQ] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<AdminUserDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  function load(query: string = '') {
    adminApi.users
      .list(query)
      .then((r) => {
        setUsers(r.users);
        if (!selectedId && r.users[0]) {
          setSelectedId(r.users[0].id);
        } else if (selectedId && !r.users.some((u) => u.id === selectedId)) {
          setSelectedId(r.users[0]?.id ?? null);
        }
      })
      .catch(() => setUsers([]));
  }

  function loadDetail(id: string) {
    setDetailLoading(true);
    adminApi.users
      .get(id)
      .then((d) => setDetail(d))
      .catch(() => setDetail(null))
      .finally(() => setDetailLoading(false));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedId) loadDetail(selectedId);
    else setDetail(null);
  }, [selectedId]);

  async function toggleAdmin() {
    if (!detail) return;
    setBusy(true);
    try {
      await adminApi.users.update(detail.user.id, {
        isAdmin: !detail.user.isAdmin,
      });
      loadDetail(detail.user.id);
      load(q);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col lg:h-screen">
      <PageHeader
        numeral="§ I."
        title="Users"
        subtitle="Browse, search, and edit every registered account in one view."
        actions={
          <form
            onSubmit={(e) => {
              e.preventDefault();
              load(q);
            }}
            className="flex gap-2 w-full md:w-auto"
          >
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search email or name…"
              className="h-9 flex-1 md:w-[260px] bg-surface text-ink border border-rule rounded-md px-3 text-[13px] focus-ring"
            />
            <button
              type="submit"
              className="h-9 px-3.5 text-[13px] font-medium rounded-md border border-rule-2 text-ink-2 hover:border-mute hover:text-ink shrink-0"
            >
              Search
            </button>
          </form>
        }
      />

      <div className="grid grid-cols-12 flex-1 min-h-0">
        {/* List — full width on mobile (stacks above detail), left rail on lg+ */}
        <aside className="col-span-12 lg:col-span-5 border-b lg:border-b-0 lg:border-r border-rule lg:overflow-y-auto bg-paper-2/40">
          {users === null ? (
            <div className="px-5 py-6 serif-italic text-mute">Loading…</div>
          ) : users.length === 0 ? (
            <Empty>No users match.</Empty>
          ) : (
            <ul>
              {users.map((u) => (
                <li
                  key={u.id}
                  role="link"
                  tabIndex={0}
                  onClick={() => setSelectedId(u.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedId(u.id);
                    }
                  }}
                  className={cn(
                    'cursor-pointer border-b border-rule transition-colors',
                    selectedId === u.id
                      ? 'bg-apothecary-soft border-l-[3px] border-l-apothecary pl-[13px] pr-4'
                      : 'hover:bg-paper-2 px-4',
                    'py-3',
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-[14px] text-ink truncate">{u.name}</div>
                      <div className="text-[11.5px] text-mute truncate">{u.email}</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {u.subscription ? (
                        statusPill(u.subscription.status)
                      ) : (
                        <span className="text-[10.5px] uppercase tracking-wider text-mute">
                          no sub
                        </span>
                      )}
                      {u.isAdmin && (
                        <span className="text-[10px] uppercase tracking-wider text-copper font-medium">
                          admin
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="mt-1.5 flex items-center gap-3 text-[11px] text-mute">
                    <span>{fmtDate(u.createdAt)}</span>
                    <span>·</span>
                    <span className="tabular-nums">
                      {u.attempts.completed}/{u.attempts.total} sessions
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </aside>

        {/* Detail */}
        <main className="col-span-12 lg:col-span-7 lg:overflow-y-auto">
          {!selectedId ? (
            <div className="h-full flex items-center justify-center">
              <p className="serif-italic text-mute">Pick a user on the left.</p>
            </div>
          ) : detailLoading || !detail ? (
            <div className="px-7 py-6 serif-italic text-mute">Loading user…</div>
          ) : (
            <UserDetail
              detail={detail}
              busy={busy}
              onToggleAdmin={toggleAdmin}
              onRefresh={() => {
                loadDetail(detail.user.id);
                load(q);
              }}
            />
          )}
        </main>
      </div>
    </div>
  );
}

function UserDetail({
  detail,
  busy,
  onToggleAdmin,
  onRefresh,
}: {
  detail: AdminUserDetail;
  busy: boolean;
  onToggleAdmin: () => void;
  onRefresh: () => void;
}) {
  const u = detail.user;
  const activeSub = detail.subscriptions.find((s) => s.status === 'active');

  return (
    <div className="px-4 sm:px-6 md:px-7 py-5 md:py-6 space-y-5 md:space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <h2
            className="font-display text-[22px] md:text-[26px] tracking-[-0.012em] text-ink"
            style={{ fontWeight: 450 }}
          >
            {u.name}
          </h2>
          <p className="text-[13px] text-mute mt-1">{u.email}</p>
          <div className="mt-2 flex items-center gap-3 text-[12px] text-mute">
            <span className="font-mono text-[11px]">{u.id}</span>
            {u.isAdmin && (
              <span className="text-[10.5px] uppercase tracking-wider text-copper font-medium">
                admin
              </span>
            )}
            {u.emailVerified && (
              <span className="text-[10.5px] uppercase tracking-wider text-correct">
                verified
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleAdmin}
            disabled={busy}
            className="h-9 px-3.5 text-[13px] font-medium rounded-md border border-rule-2 text-ink-2 hover:border-mute hover:text-ink disabled:opacity-50"
          >
            {u.isAdmin ? 'Revoke admin' : 'Promote to admin'}
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card title="Profile">
          <dl className="space-y-2.5 text-[13px]">
            <Row k="Joined" v={fmtDateTime(u.createdAt)} />
            <Row k="Role" v={u.isAdmin ? <span className="text-copper">admin</span> : 'user'} />
            <Row
              k="Email"
              v={
                <>
                  {u.email}{' '}
                  {u.emailVerified && (
                    <span className="text-[10.5px] uppercase tracking-wider text-correct ml-2">
                      verified
                    </span>
                  )}
                </>
              }
            />
          </dl>
        </Card>

        <Card title="Active subscription">
          {activeSub ? (
            <dl className="space-y-2.5 text-[13px]">
              <Row k="Status" v={statusPill(activeSub.status)} />
              <Row k="Provider" v={activeSub.provider} />
              <Row k="Period start" v={fmtDate(activeSub.currentPeriodStart)} />
              <Row k="Period end" v={fmtDate(activeSub.currentPeriodEnd)} />
            </dl>
          ) : (
            <p className="serif-italic text-mute text-[14px]">No active subscription.</p>
          )}
        </Card>
      </div>

      <Card title={`Transactions (${detail.transactions.length})`}>
        {detail.transactions.length === 0 ? (
          <p className="serif-italic text-mute text-[14px]">None yet.</p>
        ) : (
          <ul className="divide-y divide-rule -mx-5">
            {detail.transactions.slice(0, 8).map((t) => (
              <li key={t.id} className="px-5 py-2.5 flex items-center justify-between gap-3 text-[13px]">
                <div className="min-w-0">
                  <div className="font-mono text-[11.5px] text-ink truncate">{t.providerOrderId}</div>
                  <div className="text-[11px] text-mute">{fmtDateTime(t.createdAt)}</div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="tabular-nums">{fmtMoney(t.amountMinorUnits, t.currency)}</span>
                  {statusPill(t.status)}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title={`Attempts (${detail.attempts.length})`}>
        {detail.attempts.length === 0 ? (
          <p className="serif-italic text-mute text-[14px]">No sessions yet.</p>
        ) : (
          <ul className="divide-y divide-rule -mx-5">
            {detail.attempts.slice(0, 8).map((a) => (
              <li key={a.id} className="px-5 py-2.5 flex items-center justify-between gap-3 text-[13px]">
                <div className="min-w-0">
                  <div className="text-ink">
                    <span className="eyebrow mr-2">{a.mode}</span>
                    {a.questionCount} questions · {fmtDateTime(a.startedAt)}
                  </div>
                  {a.completedAt && (
                    <div className="text-[11px] text-mute">
                      ✓ {a.correctCount} · ✗ {a.wrongCount} · — {a.skippedCount}
                    </div>
                  )}
                </div>
                {a.scorePercent !== null && (
                  <span
                    className="tabular-nums font-display text-[16px] text-ink"
                    style={{ fontWeight: 450 }}
                  >
                    {Math.round(Number(a.scorePercent))}%
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-surface border border-rule rounded-lg">
      <header className="px-5 py-3 border-b border-rule bg-paper-2">
        <span className="eyebrow">{title}</span>
      </header>
      <div className="px-5 py-4">{children}</div>
    </section>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-[10.5px] uppercase tracking-wider text-mute">{k}</dt>
      <dd className="text-ink text-right">{v}</dd>
    </div>
  );
}
