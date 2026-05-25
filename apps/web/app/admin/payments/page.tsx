'use client';

import { useEffect, useState } from 'react';
import {
  adminApi,
  type AdminTransactionRow,
  type PaymentStats,
} from '@/lib/api';
import { PageHeader, Empty, statusPill, fmtDateTime, fmtMoney } from '@/components/admin/ui';
import { cn } from '@/lib/utils';

const FILTERS: { key: string; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'succeeded', label: 'Succeeded' },
  { key: 'pending', label: 'Pending' },
  { key: 'under_review', label: 'Under review' },
  { key: 'failed', label: 'Failed' },
  { key: 'refunded', label: 'Refunded' },
];

export default function AdminPaymentsPage() {
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [txs, setTxs] = useState<AdminTransactionRow[] | null>(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    adminApi.paymentStats().then(setStats).catch(() => {});
  }, []);

  useEffect(() => {
    setTxs(null);
    adminApi.transactions
      .list(filter === 'all' ? undefined : filter)
      .then((r) => setTxs(r.transactions))
      .catch(() => setTxs([]));
  }, [filter]);

  return (
    <div>
      <PageHeader
        numeral="§ II."
        title="Payments"
        subtitle="HBLPay transactions, subscription revenue and live status."
      />

      {/* ---------- Financial widgets ---------- */}
      <div className="px-8 pt-7">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <BigWidget
            label="Total revenue"
            value={stats ? fmtMoney(stats.totalRevenue, stats.currency) : ', '}
            foot={
              stats
                ? `${stats.succeededCount} successful transaction${stats.succeededCount === 1 ? '' : 's'}`
                : ''
            }
            tone="success"
          />
          <BigWidget
            label="MRR"
            value={stats ? fmtMoney(stats.mrrMinor, stats.currency) : ', '}
            foot={
              stats
                ? `${stats.activeSubscriptions} active subscriber${stats.activeSubscriptions === 1 ? '' : 's'}`
                : ''
            }
            tone="primary"
          />
          <BigWidget
            label="This month"
            value={stats ? fmtMoney(stats.monthRevenue, stats.currency) : ', '}
            foot={
              stats
                ? stats.monthDeltaPct === null
                  ? new Date().toLocaleDateString('en-US', { month: 'long' })
                  : stats.monthDeltaPct >= 0
                    ? `↑ ${stats.monthDeltaPct}% vs. last month`
                    : `↓ ${Math.abs(stats.monthDeltaPct)}% vs. last month`
                : ''
            }
            footTone={
              stats?.monthDeltaPct == null
                ? undefined
                : stats.monthDeltaPct >= 0
                  ? 'success'
                  : 'danger'
            }
          />
          <BigWidget
            label="Avg transaction"
            value={stats ? fmtMoney(stats.avgTransactionMinor, stats.currency) : ', '}
            foot={
              stats?.successRate !== null && stats?.successRate !== undefined
                ? `${stats.successRate}% success rate`
                : ''
            }
          />
        </div>

        {/* Status breakdown bar */}
        <BreakdownBar stats={stats} />

        {/* Small breakdown chips */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-4 mb-1">
          <SmallChip
            label="Succeeded"
            count={stats?.succeededCount}
            amount={stats ? stats.breakdown.succeeded.amount : null}
            currency={stats?.currency ?? 'PKR'}
            tone="success"
          />
          <SmallChip
            label="Pending"
            count={stats?.pendingCount}
            amount={stats ? stats.breakdown.pending.amount : null}
            currency={stats?.currency ?? 'PKR'}
            tone="info"
          />
          <SmallChip
            label="Under review"
            count={stats?.underReviewCount}
            amount={stats ? stats.breakdown.under_review.amount : null}
            currency={stats?.currency ?? 'PKR'}
            tone="warn"
          />
          <SmallChip
            label="Failed"
            count={stats?.failedCount}
            amount={stats ? stats.breakdown.failed.amount : null}
            currency={stats?.currency ?? 'PKR'}
            tone="danger"
          />
          <SmallChip
            label="Refunded"
            count={stats?.refundedCount}
            amount={stats ? stats.breakdown.refunded.amount : null}
            currency={stats?.currency ?? 'PKR'}
            tone="neutral"
          />
        </div>
      </div>

      {/* ---------- Filter chips + total ---------- */}
      <div className="px-8 py-4 border-y border-rule flex items-center justify-between flex-wrap gap-3 mt-7">
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={cn(
                'h-8 px-3 text-[12.5px] font-medium rounded transition-colors',
                filter === f.key
                  ? 'bg-ink text-paper'
                  : 'text-ink-2 hover:text-ink hover:bg-paper-2',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        {txs && (
          <div className="text-[12.5px] text-mute">
            Showing <span className="serif-italic text-ink">{txs.length}</span> row{txs.length === 1 ? '' : 's'}
          </div>
        )}
      </div>

      {/* ---------- Table ---------- */}
      <div className="px-8 py-7">
        {txs === null ? (
          <p className="serif-italic text-mute">Loading…</p>
        ) : txs.length === 0 ? (
          <div className="bg-surface border border-rule rounded-lg">
            <Empty>No transactions match.</Empty>
          </div>
        ) : (
          <div className="bg-surface border border-rule rounded-lg overflow-hidden">
            <table className="w-full text-[13px]">
              <thead className="bg-paper-2 border-b border-rule">
                <tr>
                  <Th>Order ID</Th>
                  <Th>User</Th>
                  <Th>Amount</Th>
                  <Th>Status</Th>
                  <Th>Code</Th>
                  <Th>Provider</Th>
                  <Th>When</Th>
                </tr>
              </thead>
              <tbody>
                {txs.map((t) => (
                  <tr key={t.id} className="border-b border-rule last:border-b-0 hover:bg-paper-2">
                    <Td>
                      <span className="font-mono text-[12px] text-ink">{t.orderId}</span>
                    </Td>
                    <Td>
                      <div className="text-ink">{t.userName ?? ', '}</div>
                      <div className="text-[11.5px] text-mute">{t.userEmail ?? ', '}</div>
                    </Td>
                    <Td>
                      <span className="tabular-nums text-ink">{fmtMoney(t.amountMinorUnits, t.currency)}</span>
                    </Td>
                    <Td>{statusPill(t.status)}</Td>
                    <Td>
                      <span className="font-mono text-[12px] text-mute">{t.responseCode ?? ', '}</span>
                    </Td>
                    <Td>
                      <span className="text-mute">{t.provider}</span>
                    </Td>
                    <Td>
                      <span className="text-mute">{fmtDateTime(t.createdAt)}</span>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------- subcomponents ----------

function BigWidget({
  label,
  value,
  foot,
  tone,
  footTone,
}: {
  label: string;
  value: string;
  foot?: string;
  tone?: 'success' | 'primary' | 'danger' | 'warn';
  footTone?: 'success' | 'danger';
}) {
  return (
    <div className="bg-surface border border-rule rounded-lg p-5 flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <span className="eyebrow text-[10.5px]">{label}</span>
        {tone === 'success' && <Dot className="bg-correct" />}
        {tone === 'primary' && <Dot className="bg-apothecary" />}
        {tone === 'danger' && <Dot className="bg-wrong" />}
        {tone === 'warn' && <Dot className="bg-copper" />}
      </div>
      <div
        className="font-display text-[26px] md:text-[30px] leading-[1.05] tracking-tight tabular-nums text-ink"
        style={{ fontWeight: 450 }}
      >
        {value}
      </div>
      {foot && (
        <div
          className={cn(
            'mt-1.5 text-[11.5px]',
            footTone === 'success' && 'text-correct',
            footTone === 'danger' && 'text-wrong',
            !footTone && 'text-mute',
          )}
        >
          {foot}
        </div>
      )}
    </div>
  );
}

function SmallChip({
  label,
  count,
  amount,
  currency,
  tone,
}: {
  label: string;
  count: number | undefined;
  amount: number | null;
  currency: string;
  tone: 'success' | 'danger' | 'warn' | 'info' | 'neutral';
}) {
  const toneCls = {
    success: 'border-correct/35',
    danger: 'border-wrong/35',
    warn: 'border-copper/35',
    info: 'border-apothecary/35',
    neutral: 'border-rule-2',
  }[tone];
  const dotCls = {
    success: 'bg-correct',
    danger: 'bg-wrong',
    warn: 'bg-copper',
    info: 'bg-apothecary',
    neutral: 'bg-mute',
  }[tone];
  return (
    <div className={cn('bg-surface border rounded-md px-3.5 py-2.5', toneCls)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={cn('w-1.5 h-1.5 rounded-full', dotCls)} />
          <span className="text-[10.5px] uppercase tracking-wider font-medium text-ink-2">
            {label}
          </span>
        </div>
        <span className="tabular-nums text-[15px] font-display text-ink" style={{ fontWeight: 450 }}>
          {count ?? ', '}
        </span>
      </div>
      {amount !== null && amount > 0 && (
        <div className="mt-1 text-[11px] text-mute">
          {fmtMoney(amount, currency)}
        </div>
      )}
    </div>
  );
}

function BreakdownBar({ stats }: { stats: PaymentStats | null }) {
  if (!stats) {
    return (
      <div className="h-2 bg-paper-2 border border-rule rounded-full overflow-hidden">
        <div className="h-full w-1/3 bg-rule-2 animate-pulse" />
      </div>
    );
  }
  const total =
    stats.succeededCount +
    stats.failedCount +
    stats.underReviewCount +
    stats.pendingCount +
    stats.refundedCount;
  if (total === 0) {
    return (
      <div className="h-2 bg-paper-2 border border-rule rounded-full" />
    );
  }
  const pct = (n: number) => (n / total) * 100;
  const segments: { width: number; cls: string; title: string }[] = [
    { width: pct(stats.succeededCount), cls: 'bg-correct', title: `${stats.succeededCount} succeeded` },
    { width: pct(stats.underReviewCount), cls: 'bg-copper', title: `${stats.underReviewCount} under review` },
    { width: pct(stats.pendingCount), cls: 'bg-apothecary', title: `${stats.pendingCount} pending` },
    { width: pct(stats.failedCount), cls: 'bg-wrong', title: `${stats.failedCount} failed` },
    { width: pct(stats.refundedCount), cls: 'bg-mute', title: `${stats.refundedCount} refunded` },
  ].filter((s) => s.width > 0);
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="eyebrow text-[10px]">Transaction health</span>
        <span className="text-[11px] text-mute tabular-nums">
          {total} total transaction{total === 1 ? '' : 's'}
        </span>
      </div>
      <div className="h-2 bg-paper-2 border border-rule rounded-full overflow-hidden flex">
        {segments.map((s, i) => (
          <div
            key={i}
            className={cn('h-full transition-all', s.cls)}
            style={{ width: `${s.width}%` }}
            title={s.title}
          />
        ))}
      </div>
    </div>
  );
}

function Dot({ className }: { className: string }) {
  return <span className={cn('w-2 h-2 rounded-full', className)} />;
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="eyebrow text-[10.5px] px-4 py-2.5 font-medium text-left">{children}</th>;
}
function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-3 align-top">{children}</td>;
}
