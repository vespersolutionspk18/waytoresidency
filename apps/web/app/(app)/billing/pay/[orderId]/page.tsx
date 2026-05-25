'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { use, useEffect, useState, type FormEvent } from 'react';
import { api, type TransactionResponse } from '@/lib/api';
import { cn } from '@/lib/utils';

type Tab = 'card' | 'hbl_account' | 'unionpay';

export default function HostedCheckoutPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = use(params);
  const router = useRouter();
  const [tx, setTx] = useState<TransactionResponse | null>(null);
  const [tab, setTab] = useState<Tab>('card');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .getTransaction(orderId)
      .then((r) => {
        if (cancelled) return;
        if (r.transaction.status !== 'pending') {
          router.replace(`/billing/return?orderId=${orderId}`);
          return;
        }
        setTx(r);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'failed');
      });
    return () => {
      cancelled = true;
    };
  }, [orderId, router]);

  async function submitPayment(
    outcome: 'success' | 'fail' | 'under_review',
    method: Tab,
  ) {
    setSubmitting(true);
    try {
      await api.mockComplete({ orderId, outcome, method });
      router.push(`/billing/return?orderId=${orderId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'submission failed');
      setSubmitting(false);
    }
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <p className="text-wrong text-[14px]">{error}</p>
      </div>
    );
  }
  if (!tx) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <p className="serif-italic text-mute">Connecting to HBLPay…</p>
      </div>
    );
  }

  const amountMajor = (tx.transaction.amountMinorUnits / 100).toLocaleString(
    'en-PK',
    { minimumFractionDigits: 0 },
  );

  return (
    <div className="min-h-screen bg-[#eef0f3] font-body">
      {/* ---------- Bank-style top bar ---------- */}
      <header className="bg-[#0f2c4d] text-paper">
        <div className="mx-auto max-w-[1100px] px-6 md:px-8 h-[64px] flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span
              className="font-display text-[24px] tracking-[-0.01em] text-paper"
              style={{ fontWeight: 600 }}
            >
              HBL
            </span>
            <span className="text-[14px] uppercase tracking-[0.16em] text-paper/80">
              Pay
            </span>
          </div>
          <div className="flex items-center gap-2 text-[12px] text-paper/85">
            <LockIcon className="w-3.5 h-3.5" />
            Secure session
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1100px] px-6 md:px-8 py-10">
        {/* ---------- Order strip ---------- */}
        <div className="bg-white border border-[#d4dce5] rounded-md px-5 py-4 flex items-center justify-between flex-wrap gap-3 mb-6">
          <div>
            <div className="text-[10.5px] uppercase tracking-[0.14em] text-[#5b6b80]">
              Merchant
            </div>
            <div className="text-[14px] text-[#0f2c4d] mt-0.5" style={{ fontWeight: 500 }}>
              way to residency · {tx.plan?.name ?? 'Subscription'}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10.5px] uppercase tracking-[0.14em] text-[#5b6b80]">
              Amount
            </div>
            <div
              className="font-display text-[24px] text-[#0f2c4d] tabular-nums"
              style={{ fontWeight: 550 }}
            >
              {tx.transaction.currency} {amountMajor}
            </div>
          </div>
          <div className="text-right hidden md:block">
            <div className="text-[10.5px] uppercase tracking-[0.14em] text-[#5b6b80]">
              Order
            </div>
            <div className="text-[12px] font-mono text-[#0f2c4d] mt-1">
              {tx.transaction.orderId}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* ---------- Tabs + form ---------- */}
          <section className="col-span-12 lg:col-span-8 bg-white border border-[#d4dce5] rounded-md overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-[#d4dce5]">
              <TabBtn active={tab === 'card'} onClick={() => setTab('card')}>
                Visa / Mastercard
              </TabBtn>
              <TabBtn
                active={tab === 'hbl_account'}
                onClick={() => setTab('hbl_account')}
              >
                HBL Account
              </TabBtn>
              <TabBtn
                active={tab === 'unionpay'}
                onClick={() => setTab('unionpay')}
              >
                UnionPay
              </TabBtn>
            </div>

            {/* Form bodies */}
            <div className="p-6 md:p-8">
              {tab === 'card' && (
                <CardForm
                  onSubmit={(outcome) => submitPayment(outcome, 'card')}
                  submitting={submitting}
                  amount={`${tx.transaction.currency} ${amountMajor}`}
                />
              )}
              {tab === 'hbl_account' && (
                <HblAccountForm
                  onSubmit={(outcome) => submitPayment(outcome, 'hbl_account')}
                  submitting={submitting}
                  amount={`${tx.transaction.currency} ${amountMajor}`}
                />
              )}
              {tab === 'unionpay' && (
                <CardForm
                  onSubmit={(outcome) => submitPayment(outcome, 'unionpay')}
                  submitting={submitting}
                  amount={`${tx.transaction.currency} ${amountMajor}`}
                  unionpay
                />
              )}
            </div>
          </section>

          {/* ---------- Summary + cancel ---------- */}
          <aside className="col-span-12 lg:col-span-4">
            <div className="bg-white border border-[#d4dce5] rounded-md p-5 lg:sticky lg:top-6">
              <div className="text-[10.5px] uppercase tracking-[0.14em] text-[#5b6b80] mb-2">
                Order summary
              </div>
              <div className="text-[13.5px] text-[#0f2c4d]">
                {tx.plan?.name}
              </div>
              <div className="text-[12px] text-[#5b6b80] mt-1">
                Subscription · billed per {tx.plan?.interval}
              </div>
              <div className="border-t border-[#d4dce5] my-4" />
              <Row
                label="Subtotal"
                value={`${tx.transaction.currency} ${amountMajor}`}
              />
              <Row label="Tax (incl.)" value={`${tx.transaction.currency} 0`} />
              <Row
                label="Total due"
                value={`${tx.transaction.currency} ${amountMajor}`}
                bold
              />
              <div className="border-t border-[#d4dce5] my-4" />
              <button
                type="button"
                onClick={() => submitPayment('fail', tab)}
                disabled={submitting}
                className="w-full h-9 text-[12.5px] text-[#5b6b80] hover:text-[#0f2c4d] disabled:opacity-50"
              >
                Cancel and return to merchant
              </button>
            </div>

            <div className="mt-4 text-[11px] text-[#5b6b80] leading-[1.6] px-1">
              This is a sandbox checkout for development. Test cards:
              <br />
              <code className="text-[#0f2c4d]">4000 0000 0000 0101</code> ·
              any future expiry · any CVV.
            </div>
          </aside>
        </div>

        <footer className="mt-10 flex items-center justify-between text-[11.5px] text-[#5b6b80] border-t border-[#d4dce5] pt-5">
          <div className="flex items-center gap-2">
            <LockIcon className="w-3 h-3" />
            Secured by HBL Pay · 256-bit TLS · PCI-DSS
          </div>
          <div>© 2026 Habib Bank Limited</div>
        </footer>
      </main>
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex-1 h-12 text-[13.5px] tracking-tight transition-colors',
        active
          ? 'bg-white text-[#0f2c4d] border-b-2 border-[#0f2c4d] font-medium'
          : 'bg-[#f7f9fb] text-[#5b6b80] border-b-2 border-transparent hover:text-[#0f2c4d]',
      )}
    >
      {children}
    </button>
  );
}

function CardForm({
  onSubmit,
  submitting,
  amount,
  unionpay,
}: {
  onSubmit: (outcome: 'success' | 'fail' | 'under_review') => void;
  submitting: boolean;
  amount: string;
  unionpay?: boolean;
}) {
  const [cardNumber, setCardNumber] = useState('');
  const [name, setName] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [mobile, setMobile] = useState('');

  function fmtCardNumber(v: string) {
    return v.replace(/\D/g, '').slice(0, 19).replace(/(.{4})/g, '$1 ').trim();
  }
  function fmtExpiry(v: string) {
    const d = v.replace(/\D/g, '').slice(0, 4);
    if (d.length <= 2) return d;
    return `${d.slice(0, 2)}/${d.slice(2)}`;
  }

  function onFormSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    onSubmit('success');
  }

  return (
    <form onSubmit={onFormSubmit} className="flex flex-col gap-5">
      <Field label="Card number">
        <input
          required
          inputMode="numeric"
          value={cardNumber}
          onChange={(e) => setCardNumber(fmtCardNumber(e.target.value))}
          placeholder="4000 0000 0000 0101"
          className="bank-input font-mono tracking-wide"
          maxLength={23}
        />
      </Field>
      <Field label="Cardholder name">
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="As printed on card"
          className="bank-input"
        />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Expiry (MM/YY)">
          <input
            required
            inputMode="numeric"
            value={expiry}
            onChange={(e) => setExpiry(fmtExpiry(e.target.value))}
            placeholder="05/29"
            className="bank-input font-mono"
            maxLength={5}
          />
        </Field>
        <Field label="CVV">
          <input
            required
            inputMode="numeric"
            type="password"
            value={cvv}
            onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder="•••"
            className="bank-input font-mono"
            maxLength={4}
          />
        </Field>
      </div>
      {unionpay && (
        <Field label="Mobile (for SMS code)">
          <input
            required
            inputMode="tel"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            placeholder="+92 300 1234567"
            className="bank-input"
          />
        </Field>
      )}

      <div className="mt-3 flex flex-col gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="h-12 px-5 text-[14px] font-medium tracking-tight rounded-md bg-[#0f2c4d] text-white hover:bg-[#1a3d66] transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2"
        >
          <LockIcon className="w-3.5 h-3.5" />
          Pay {amount}
        </button>
        <div className="flex gap-2 text-[11.5px] text-[#5b6b80]">
          <button
            type="button"
            disabled={submitting}
            onClick={() => onSubmit('under_review')}
            className="flex-1 h-8 border border-dashed border-[#d4dce5] hover:bg-[#f7f9fb] rounded text-[#5b6b80]"
          >
            Simulate "under review"
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={() => onSubmit('fail')}
            className="flex-1 h-8 border border-dashed border-[#d4dce5] hover:bg-[#f7f9fb] rounded text-[#5b6b80]"
          >
            Simulate decline
          </button>
        </div>
      </div>
    </form>
  );
}

function HblAccountForm({
  onSubmit,
  submitting,
  amount,
}: {
  onSubmit: (outcome: 'success' | 'fail' | 'under_review') => void;
  submitting: boolean;
  amount: string;
}) {
  const [step, setStep] = useState<'creds' | 'otp'>('creds');
  const [accountNumber, setAccountNumber] = useState('');
  const [cnic, setCnic] = useState('');
  const [otp, setOtp] = useState('');

  function fmtCnic(v: string) {
    const d = v.replace(/\D/g, '').slice(0, 13);
    if (d.length <= 5) return d;
    if (d.length <= 12) return `${d.slice(0, 5)}-${d.slice(5)}`;
    return `${d.slice(0, 5)}-${d.slice(5, 12)}-${d.slice(12)}`;
  }

  if (step === 'creds') {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setStep('otp');
        }}
        className="flex flex-col gap-5"
      >
        <Field label="HBL Account number">
          <input
            required
            inputMode="numeric"
            value={accountNumber}
            onChange={(e) =>
              setAccountNumber(e.target.value.replace(/\D/g, '').slice(0, 16))
            }
            placeholder="14-digit account number"
            className="bank-input font-mono"
          />
        </Field>
        <Field label="CNIC">
          <input
            required
            inputMode="numeric"
            value={cnic}
            onChange={(e) => setCnic(fmtCnic(e.target.value))}
            placeholder="12345-1234567-1"
            className="bank-input font-mono"
            maxLength={15}
          />
        </Field>
        <button
          type="submit"
          disabled={submitting}
          className="h-12 mt-3 px-5 text-[14px] font-medium tracking-tight rounded-md bg-[#0f2c4d] text-white hover:bg-[#1a3d66] transition-colors disabled:opacity-50"
        >
          Continue · verify with OTP
        </button>
        <p className="text-[11.5px] text-[#5b6b80]">
          An OTP will be sent to the mobile number registered with your HBL
          account.
        </p>
      </form>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit('success');
      }}
      className="flex flex-col gap-5"
    >
      <div className="bg-[#f7f9fb] border border-[#d4dce5] rounded-md px-4 py-3 text-[12.5px] text-[#0f2c4d]">
        An OTP was sent to your registered mobile. (Sandbox: any 6 digits will
        work.)
      </div>
      <Field label="6-digit OTP">
        <input
          required
          inputMode="numeric"
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="••••••"
          className="bank-input font-mono tracking-[0.4em] text-center text-[18px]"
          maxLength={6}
        />
      </Field>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => setStep('creds')}
          className="h-12 px-4 text-[13.5px] text-[#5b6b80] hover:text-[#0f2c4d]"
        >
          ← Back
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 h-12 px-5 text-[14px] font-medium tracking-tight rounded-md bg-[#0f2c4d] text-white hover:bg-[#1a3d66] transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2"
        >
          <LockIcon className="w-3.5 h-3.5" />
          Verify and pay {amount}
        </button>
      </div>
      <div className="flex gap-2 text-[11.5px] text-[#5b6b80]">
        <button
          type="button"
          disabled={submitting}
          onClick={() => onSubmit('fail')}
          className="flex-1 h-8 border border-dashed border-[#d4dce5] hover:bg-[#f7f9fb] rounded"
        >
          Simulate incorrect OTP
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[10.5px] uppercase tracking-[0.14em] font-medium text-[#5b6b80]">
        {label}
      </span>
      {children}
      <style jsx>{`
        :global(.bank-input) {
          background: white;
          color: #0f2c4d;
          border: 1px solid #d4dce5;
          border-radius: 4px;
          padding: 10px 12px;
          font-size: 14.5px;
          outline: none;
          transition: border-color 120ms;
        }
        :global(.bank-input::placeholder) {
          color: #98a4b5;
        }
        :global(.bank-input:focus) {
          border-color: #0f2c4d;
          box-shadow: 0 0 0 3px rgba(15, 44, 77, 0.12);
        }
      `}</style>
    </label>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-baseline justify-between py-1">
      <span
        className={cn(
          'text-[12.5px]',
          bold ? 'text-[#0f2c4d] font-medium' : 'text-[#5b6b80]',
        )}
      >
        {label}
      </span>
      <span
        className={cn(
          'tabular-nums',
          bold ? 'text-[15px] text-[#0f2c4d] font-medium' : 'text-[12.5px] text-[#0f2c4d]',
        )}
      >
        {value}
      </span>
    </div>
  );
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 13 13"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
      className={cn('shrink-0', className)}
    >
      <rect x="2.5" y="6" width="8" height="5.5" />
      <path d="M4 6V4a2.5 2.5 0 0 1 5 0v2" />
    </svg>
  );
}
