'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { adminApi, type AdminStats, type AdminTransactionRow, type AdminUserRow } from '@/lib/api';
import { Card, Empty, PageHeader, fmtDateTime, fmtMoney, statusPill } from '@/components/admin/ui';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [txs, setTxs] = useState<AdminTransactionRow[]>([]);

  useEffect(() => {
    adminApi.stats().then(setStats).catch(() => {});
    adminApi.users.list().then((r) => setUsers(r.users.slice(0, 6))).catch(() => {});
    adminApi.transactions.list().then((r) => setTxs(r.transactions.slice(0, 6))).catch(() => {});
  }, []);

  return (
    <div>
      <PageHeader numeral="§" title="Overview" subtitle="At-a-glance signals across users, payments, and content." />

      <div className="px-4 sm:px-6 md:px-8 py-5 md:py-7">
        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-px bg-rule border border-rule rounded-lg overflow-hidden">
          <StatBlock label="Users" value={stats?.users.total ?? ', '} foot={stats ? `${stats.users.admins} admin` : ''} />
          <StatBlock label="Paying" value={stats?.users.paying ?? ', '} foot={stats?.subscriptions.active != null ? `${stats.subscriptions.active} active subs` : ''} />
          <StatBlock label="Revenue" value={stats ? fmtMoney(stats.transactions.revenueMinor, 'PKR') : ', '} foot="from succeeded txns" />
          <StatBlock label="Pending txns" value={stats?.transactions.pending ?? ', '} foot="awaiting completion" />
          <StatBlock label="Attempts" value={stats?.attempts.completed ?? ', '} foot={stats ? `${stats.attempts.total} total` : ''} />
          <StatBlock label="Questions" value={stats?.content.questions ?? ', '} foot={stats ? `${stats.content.subjects} subjects` : ''} />
        </div>

        {/* Recent rows */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6 mt-6 md:mt-8">
          <Card title="Recent users" actions={<Link href="/admin/users" className="text-[12.5px] text-mute hover:text-ink">View all →</Link>}>
            {users.length === 0 ? (
              <Empty>No users yet.</Empty>
            ) : (
              <ul className="divide-y divide-rule">
                {users.map((u) => (
                  <li key={u.id}>
                    <Link href={`/admin/users/${u.id}`} className="flex items-center justify-between px-5 py-3 hover:bg-paper-2 transition-colors">
                      <div className="min-w-0">
                        <div className="text-[14px] text-ink truncate">{u.name}</div>
                        <div className="text-[12px] text-mute truncate">{u.email}</div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 text-right">
                        {u.subscription ? statusPill(u.subscription.status) : <span className="text-[11px] text-mute">no sub</span>}
                        {u.isAdmin && <span className="text-[10px] uppercase tracking-wider text-copper">admin</span>}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="Recent payments" actions={<Link href="/admin/payments" className="text-[12.5px] text-mute hover:text-ink">View all →</Link>}>
            {txs.length === 0 ? (
              <Empty>No transactions yet.</Empty>
            ) : (
              <ul className="divide-y divide-rule">
                {txs.map((t) => (
                  <li key={t.id} className="flex items-center justify-between px-5 py-3">
                    <div className="min-w-0">
                      <div className="text-[13.5px] text-ink font-mono">{t.orderId}</div>
                      <div className="text-[11.5px] text-mute truncate">{t.userEmail ?? ', '} · {fmtDateTime(t.createdAt)}</div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 text-right">
                      <span className="tabular-nums text-[13.5px] text-ink">{fmtMoney(t.amountMinorUnits, t.currency)}</span>
                      {statusPill(t.status)}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatBlock({ label, value, foot }: { label: string; value: React.ReactNode; foot?: string }) {
  return (
    <div className="bg-paper px-5 py-5">
      <div className="eyebrow text-[10.5px] mb-2">{label}</div>
      <div className="font-display text-[24px] leading-[1] tracking-tight text-ink tabular-nums" style={{ fontWeight: 450 }}>
        {value}
      </div>
      {foot && <p className="text-[11.5px] text-mute mt-1.5">{foot}</p>}
    </div>
  );
}
