'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api, type Plan } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

export default function CheckoutPage() {
  const router = useRouter();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .getPlan()
      .then((r) => {
        if (!cancelled) setPlan(r.plan);
      })
      .catch((e) => {
        if (!cancelled) setLoadErr(e instanceof Error ? e.message : 'failed');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function startCheckout() {
    if (!plan) return;
    setError(null);
    setPending(true);
    try {
      const res = await api.createCheckout(plan.slug);
      router.push(`/billing/pay/${res.transaction.orderId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not start checkout.');
      setPending(false);
    }
  }

  if (loadErr) {
    return (
      <div className="mx-auto max-w-[720px] px-6 py-16">
        <p className="text-wrong">Couldn&rsquo;t load plan: {loadErr}</p>
      </div>
    );
  }
  if (!plan) {
    return (
      <div className="mx-auto max-w-[720px] px-6 py-16">
        <p className="serif-italic text-mute">Loading plan…</p>
      </div>
    );
  }

  const priceMajor = (plan.priceMinorUnits / 100).toLocaleString('en-PK', {
    minimumFractionDigits: 0,
  });

  return (
    <div className="mx-auto max-w-[840px] px-6 md:px-8 py-14 rise">
      <div className="flex items-baseline gap-3 mb-2">
        <span className="section-numeral">§ Subscribe</span>
        <span className="eyebrow">Order summary</span>
      </div>
      <h1
        className="font-display text-[40px] leading-[1.05] tracking-[-0.015em] text-ink"
        style={{ fontWeight: 430 }}
      >
        Activate your{' '}
        <span className="serif-italic text-apothecary">reading room</span>.
      </h1>
      <p className="mt-3 max-w-[58ch] text-[15px] text-mute leading-[1.6]">
        Full access to both modes, every explanation, every distractor, and
        your entire attempt history.
      </p>

      <div className="rule my-9" />

      <div className="grid grid-cols-12 gap-7">
        {/* ---------- LEFT: order detail ---------- */}
        <section className="col-span-12 md:col-span-7">
          <div className="bg-surface border border-rule rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-rule bg-paper-2 flex items-center justify-between">
              <span className="eyebrow">Plan</span>
              <span className="text-[12px] text-mute">{plan.slug}</span>
            </div>
            <div className="px-6 py-6">
              <div className="flex items-baseline gap-3 mb-2">
                <h2
                  className="font-display text-[24px] text-ink tracking-tight"
                  style={{ fontWeight: 450 }}
                >
                  {plan.name}
                </h2>
              </div>
              {plan.description && (
                <p className="text-[14px] text-ink-2 leading-[1.6] mb-5">
                  {plan.description}
                </p>
              )}
              <ul className="space-y-2 text-[14px] text-ink-2">
                {plan.features.map((f) => (
                  <li key={f} className="flex gap-2.5">
                    <Tick />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="px-6 py-4 border-t border-rule bg-paper-2 text-[12.5px] text-mute">
              Billed every {plan.interval}. Cancel any time before the next
              renewal.
            </div>
          </div>
        </section>

        {/* ---------- RIGHT: payable + CTA ---------- */}
        <aside className="col-span-12 md:col-span-5">
          <div className="bg-surface border border-rule rounded-lg p-6 lg:sticky lg:top-6">
            <div className="eyebrow mb-2">Amount payable today</div>
            <div className="flex items-baseline gap-2 mb-1">
              <span
                className="font-display text-[44px] leading-[1] text-ink tracking-tight"
                style={{ fontWeight: 450 }}
              >
                {plan.currency} {priceMajor}
              </span>
            </div>
            <p className="text-[12.5px] text-mute mt-1">
              per {plan.interval} · billed in {plan.currency}
            </p>

            <div className="rule my-5" />

            <Row label="Subtotal" value={`${plan.currency} ${priceMajor}`} />
            <Row label="Tax (incl.)" value={`${plan.currency} 0`} />
            <div className="rule my-3" />
            <Row label="Total today" value={`${plan.currency} ${priceMajor}`} bold />

            {error && (
              <div className="mt-4 border border-wrong/40 bg-[#f5e7e4] text-wrong text-[13px] rounded-md px-3.5 py-2.5">
                {error}
              </div>
            )}

            <Button
              size="lg"
              loading={pending}
              onClick={startCheckout}
              className="w-full mt-5"
            >
              <LockIcon /> Pay with HBLPay
            </Button>

            <div className="mt-3 flex items-center justify-center gap-3">
              <Link
                href="/dashboard"
                className="text-[12.5px] text-mute hover:text-ink underline underline-offset-4 decoration-rule-2"
              >
                Skip for now, start a free trial
              </Link>
            </div>

            <p className="text-[11px] text-mute mt-5 leading-[1.5] text-center">
              By continuing you agree to be redirected to HBLPay&rsquo;s secure
              hosted checkout. Card details are never seen by way to residency.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-baseline justify-between py-1.5">
      <span className={cn('text-[13.5px]', bold ? 'text-ink' : 'text-mute')}>
        {label}
      </span>
      <span
        className={cn(
          'tabular-nums',
          bold ? 'font-display text-[18px] text-ink' : 'text-[13.5px] text-ink-2',
        )}
        style={bold ? { fontWeight: 500 } : undefined}
      >
        {value}
      </span>
    </div>
  );
}

function Tick() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden
      className="mt-[5px] text-apothecary shrink-0"
    >
      <path
        d="M2 7.5l3 3 7-7"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 13 13"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      aria-hidden
      className="shrink-0"
    >
      <rect x="2.5" y="6" width="8" height="5.5" />
      <path d="M4 6V4a2.5 2.5 0 0 1 5 0v2" />
    </svg>
  );
}
