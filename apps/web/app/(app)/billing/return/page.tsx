'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api, type TransactionResponse } from '@/lib/api';
import { cn } from '@/lib/utils';

export default function ReturnPage() {
  const search = useSearchParams();
  const orderId = search.get('orderId');
  const [tx, setTx] = useState<TransactionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) {
      setError('No order id supplied');
      return;
    }
    let cancelled = false;
    api
      .getTransaction(orderId)
      .then((r) => {
        if (!cancelled) setTx(r);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'failed');
      });
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  if (error) {
    return (
      <div className="mx-auto max-w-[600px] px-6 py-16">
        <p className="text-wrong text-[14px]">{error}</p>
        <Link href="/dashboard" className="text-[13px] text-mute hover:text-ink underline">
          ← Back to dashboard
        </Link>
      </div>
    );
  }
  if (!tx) {
    return (
      <div className="mx-auto max-w-[600px] px-6 py-16">
        <p className="serif-italic text-mute">Confirming payment status…</p>
      </div>
    );
  }

  const status = tx.transaction.status;
  const amountMajor = (tx.transaction.amountMinorUnits / 100).toLocaleString(
    'en-PK',
    { minimumFractionDigits: 0 },
  );

  return (
    <div className="mx-auto max-w-[720px] px-6 md:px-8 py-14 rise">
      <div className="flex items-baseline gap-3 mb-2">
        <span className="section-numeral">§ Receipt</span>
        <span className="eyebrow">Payment result</span>
      </div>

      <StatusHero status={status} />

      <div className="rule my-9" />

      {/* ---------- Transaction detail ---------- */}
      <div className="bg-surface border border-rule rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-rule bg-paper-2 flex items-center justify-between">
          <span className="eyebrow">Transaction</span>
          <span className="text-[11.5px] text-mute font-mono">
            {tx.transaction.orderId}
          </span>
        </div>
        <dl className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6 text-[13.5px]">
          <Field label="Status">
            <StatusBadge status={status} />
          </Field>
          <Field label="Amount">
            <span className="tabular-nums">
              {tx.transaction.currency} {amountMajor}
            </span>
          </Field>
          <Field label="Plan">{tx.plan?.name ?? ', '}</Field>
          <Field label="Method">HBLPay</Field>
          <Field label="Response code">
            <span className="font-mono">{tx.transaction.responseCode ?? ', '}</span>
          </Field>
          <Field label="Completed">
            {new Date(tx.transaction.updatedAt).toLocaleString()}
          </Field>
          {tx.transaction.responseMessage && (
            <div className="sm:col-span-2 mt-2">
              <div className="eyebrow mb-1.5">Issuer message</div>
              <p className="text-[13.5px] text-ink-2 leading-[1.55] serif-italic">
                {tx.transaction.responseMessage}
              </p>
            </div>
          )}
        </dl>
      </div>

      {/* ---------- CTAs ---------- */}
      <div className="mt-8 flex flex-wrap items-center gap-3">
        {status === 'succeeded' && (
          <>
            <Link
              href="/dashboard"
              className="h-11 inline-flex items-center px-5 text-[14px] font-medium tracking-tight rounded-md bg-apothecary text-paper border border-apothecary-2 hover:bg-apothecary-2 transition-colors"
            >
              Open dashboard →
            </Link>
            <Link
              href="/tutor/new"
              className="h-11 inline-flex items-center px-4 text-[14px] tracking-tight text-ink-2 hover:text-ink"
            >
              Or jump straight into a tutor session
            </Link>
          </>
        )}
        {status === 'failed' && (
          <>
            <Link
              href="/billing/checkout"
              className="h-11 inline-flex items-center px-5 text-[14px] font-medium tracking-tight rounded-md bg-apothecary text-paper border border-apothecary-2 hover:bg-apothecary-2 transition-colors"
            >
              Try again
            </Link>
            <Link
              href="/dashboard"
              className="h-11 inline-flex items-center px-4 text-[14px] tracking-tight text-ink-2 hover:text-ink"
            >
              Continue without subscription
            </Link>
          </>
        )}
        {status === 'under_review' && (
          <Link
            href="/dashboard"
            className="h-11 inline-flex items-center px-5 text-[14px] font-medium tracking-tight rounded-md bg-apothecary text-paper border border-apothecary-2 hover:bg-apothecary-2 transition-colors"
          >
            Continue to dashboard
          </Link>
        )}
        {status === 'pending' && (
          <p className="text-[13.5px] text-mute serif-italic">
            We&rsquo;re still confirming this payment. Refresh in a moment.
          </p>
        )}
      </div>
    </div>
  );
}

function StatusHero({ status }: { status: string }) {
  if (status === 'succeeded') {
    return (
      <h1
        className="font-display text-[40px] leading-[1.05] tracking-[-0.015em] text-ink"
        style={{ fontWeight: 430 }}
      >
        Your subscription is{' '}
        <span className="serif-italic text-correct">active</span>.
      </h1>
    );
  }
  if (status === 'under_review') {
    return (
      <h1
        className="font-display text-[40px] leading-[1.05] tracking-[-0.015em] text-ink"
        style={{ fontWeight: 430 }}
      >
        Your payment is{' '}
        <span className="serif-italic text-copper">under review</span>.
      </h1>
    );
  }
  if (status === 'failed') {
    return (
      <h1
        className="font-display text-[40px] leading-[1.05] tracking-[-0.015em] text-ink"
        style={{ fontWeight: 430 }}
      >
        Your payment{' '}
        <span className="serif-italic text-wrong">didn&rsquo;t go through</span>.
      </h1>
    );
  }
  return (
    <h1
      className="font-display text-[40px] leading-[1.05] tracking-[-0.015em] text-ink"
      style={{ fontWeight: 430 }}
    >
      Payment <span className="serif-italic text-mute">pending</span>.
    </h1>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    succeeded: { label: 'Succeeded', cls: 'bg-correct text-paper' },
    failed: { label: 'Failed', cls: 'bg-wrong text-paper' },
    under_review: { label: 'Under review', cls: 'bg-copper-soft text-copper border border-copper/40' },
    pending: { label: 'Pending', cls: 'bg-paper-2 text-mute border border-rule' },
    refunded: { label: 'Refunded', cls: 'bg-paper-2 text-mute border border-rule' },
  };
  const m = map[status] ?? { label: status, cls: 'bg-paper-2 text-mute' };
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 text-[10.5px] uppercase tracking-wider font-medium rounded',
        m.cls,
      )}
    >
      {m.label}
    </span>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="eyebrow text-[10.5px] mb-1">{label}</dt>
      <dd className="text-ink">{children}</dd>
    </div>
  );
}
