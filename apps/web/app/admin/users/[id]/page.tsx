'use client';

import Link from 'next/link';
import { use, useEffect, useState } from 'react';
import { adminApi, type AdminUserDetail } from '@/lib/api';
import { PageHeader, Card, Empty, fmtDate, fmtDateTime, fmtMoney, statusPill } from '@/components/admin/ui';

export default function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [data, setData] = useState<AdminUserDetail | null>(null);
  const [busy, setBusy] = useState(false);

  function load() {
    adminApi.users.get(id).then(setData).catch(() => {});
  }
  useEffect(load, [id]);

  async function toggleAdmin() {
    if (!data) return;
    setBusy(true);
    try {
      await adminApi.users.update(id, { isAdmin: !data.user.isAdmin });
      load();
    } finally {
      setBusy(false);
    }
  }

  if (!data) return <p className="p-8 serif-italic text-mute">Loading…</p>;
  const u = data.user;
  const activeSub = data.subscriptions.find((s) => s.status === 'active');

  return (
    <div>
      <PageHeader
        numeral="§"
        title={u.name}
        subtitle={u.email}
        actions={
          <>
            <button
              type="button"
              onClick={toggleAdmin}
              disabled={busy}
              className="h-9 px-3.5 text-[13px] font-medium rounded-md border border-rule-2 text-ink-2 hover:border-mute hover:text-ink disabled:opacity-50"
            >
              {u.isAdmin ? 'Revoke admin' : 'Promote to admin'}
            </button>
            <Link
              href="/admin/users"
              className="h-9 inline-flex items-center px-3 text-[13px] text-mute hover:text-ink"
            >
              ← Back
            </Link>
          </>
        }
      />

      <div className="px-8 py-7 space-y-6">
        {/* Profile + active sub */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card title="Profile">
            <dl className="px-5 py-4 space-y-2 text-[13.5px]">
              <Row k="ID" v={<span className="font-mono text-[12px]">{u.id}</span>} />
              <Row k="Email" v={<>{u.email} {u.emailVerified && <span className="ml-2 text-[10.5px] text-correct">verified</span>}</>} />
              <Row k="Joined" v={fmtDateTime(u.createdAt)} />
              <Row k="Role" v={u.isAdmin ? <span className="text-copper">admin</span> : 'user'} />
            </dl>
          </Card>

          <Card title="Active subscription">
            {activeSub ? (
              <dl className="px-5 py-4 space-y-2 text-[13.5px]">
                <Row k="Status" v={statusPill(activeSub.status)} />
                <Row k="Provider" v={activeSub.provider} />
                <Row k="Period start" v={fmtDate(activeSub.currentPeriodStart)} />
                <Row k="Period end" v={fmtDate(activeSub.currentPeriodEnd)} />
              </dl>
            ) : (
              <Empty>No active subscription.</Empty>
            )}
          </Card>

          <Card title="Subscription history">
            {data.subscriptions.length === 0 ? (
              <Empty>None.</Empty>
            ) : (
              <ul className="divide-y divide-rule">
                {data.subscriptions.map((s) => (
                  <li key={s.id} className="px-5 py-3 flex items-center justify-between text-[12.5px]">
                    <span className="text-mute">{fmtDate(s.currentPeriodStart)} → {fmtDate(s.currentPeriodEnd)}</span>
                    {statusPill(s.status)}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        {/* Transactions */}
        <Card title={`Transactions (${data.transactions.length})`}>
          {data.transactions.length === 0 ? (
            <Empty>No transactions.</Empty>
          ) : (
            <ul className="divide-y divide-rule">
              {data.transactions.map((t) => (
                <li key={t.id} className="px-5 py-3 flex items-center justify-between text-[13px]">
                  <div className="min-w-0">
                    <div className="font-mono text-[12px] text-ink">{t.providerOrderId}</div>
                    <div className="text-[11.5px] text-mute">{fmtDateTime(t.createdAt)} · code {t.providerResponseCode ?? ', '}</div>
                  </div>
                  <div className="flex items-center gap-3 text-right">
                    <span className="tabular-nums text-ink">{fmtMoney(t.amountMinorUnits, t.currency)}</span>
                    {statusPill(t.status)}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Attempts */}
        <Card title={`Attempts (${data.attempts.length})`}>
          {data.attempts.length === 0 ? (
            <Empty>No sessions yet.</Empty>
          ) : (
            <ul className="divide-y divide-rule">
              {data.attempts.map((a) => (
                <li key={a.id} className="px-5 py-3 flex items-center justify-between text-[13px]">
                  <div className="min-w-0">
                    <div className="text-ink">
                      <span className="eyebrow mr-2">{a.mode}</span>
                      {a.questionCount} questions · {fmtDateTime(a.startedAt)}
                    </div>
                    {a.completedAt ? (
                      <div className="text-[11.5px] text-mute">
                        completed {fmtDateTime(a.completedAt)} · correct {a.correctCount} · wrong {a.wrongCount} · skipped {a.skippedCount}
                      </div>
                    ) : (
                      <div className="text-[11.5px] text-mute serif-italic">in progress</div>
                    )}
                  </div>
                  <div className="text-right">
                    {a.scorePercent !== null && (
                      <span className="tabular-nums font-display text-[18px] text-ink" style={{ fontWeight: 450 }}>
                        {Math.round(Number(a.scorePercent))}%
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-mute text-[11.5px] uppercase tracking-wider">{k}</dt>
      <dd className="text-ink text-right">{v}</dd>
    </div>
  );
}
