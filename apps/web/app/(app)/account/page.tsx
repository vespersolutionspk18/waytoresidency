'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, authClient } from '@/lib/auth-client';
import { api, type Subscription } from '@/lib/api';
import { cn } from '@/lib/utils';

type Tx = {
  id: string;
  providerOrderId: string;
  amountMinorUnits: number;
  currency: string;
  status: string;
  providerResponseCode: string | null;
  createdAt: string;
};

type SavedCard = {
  id: string;
  brand: 'visa' | 'mastercard' | 'unionpay' | 'hbl';
  last4: string;
  expMonth: number;
  expYear: number;
  holderName: string;
};

const CARD_KEY = 'wtr-saved-cards-v1';

const SECTIONS = [
  { id: 'profile', label: 'Profile' },
  { id: 'security', label: 'Security' },
  { id: 'cards', label: 'Payment methods' },
  { id: 'subscription', label: 'Subscription' },
  { id: 'transactions', label: 'Transactions' },
] as const;

export default function AccountPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [active, setActive] = useState<(typeof SECTIONS)[number]['id']>('profile');

  // Redirect unauthed users from inside an effect — calling router.replace()
  // during render triggers "Cannot update Router while rendering AccountPage".
  useEffect(() => {
    if (!isPending && !session?.user) {
      router.replace('/sign-in?redirect=/account');
    }
  }, [isPending, session, router]);

  if (isPending || !session?.user) {
    return <div className="p-10 serif-italic text-mute">Loading…</div>;
  }

  return (
    <div className="mx-auto max-w-[1180px] px-6 md:px-10 py-10">
      <div className="flex items-baseline gap-3 mb-2">
        <span className="section-numeral">§ Account</span>
        <span className="eyebrow">{session.user.email}</span>
      </div>
      <h1
        className="font-display text-[40px] md:text-[48px] leading-[1.05] tracking-[-0.015em] text-ink"
        style={{ fontWeight: 430 }}
      >
        Hello,{' '}
        <span className="serif-italic text-apothecary">
          {session.user.name?.split(' ')[0] ?? 'doctor'}
        </span>
        .
      </h1>
      <p className="mt-3 max-w-[60ch] text-[15px] text-ink-2 leading-[1.65]">
        Your profile, security, saved payment methods, current subscription
        and full transaction history all live on this page.
      </p>

      <div className="rule my-9" />

      <div className="grid grid-cols-12 gap-8">
        <aside className="col-span-12 lg:col-span-3">
          <nav className="lg:sticky lg:top-6 space-y-1">
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setActive(s.id)}
                className={cn(
                  'w-full text-left px-3.5 py-2.5 text-[13.5px] rounded-md transition-colors',
                  active === s.id
                    ? 'bg-apothecary text-paper'
                    : 'text-ink-2 hover:text-ink hover:bg-paper-2',
                )}
              >
                {s.label}
              </button>
            ))}
            <div className="pt-3 mt-3 border-t border-rule">
              <Link
                href="/dashboard"
                className="block px-3.5 py-2.5 text-[13px] text-mute hover:text-ink"
              >
                ← Dashboard
              </Link>
              <button
                type="button"
                onClick={async () => {
                  await authClient.signOut();
                  router.push('/');
                }}
                className="block w-full text-left px-3.5 py-2.5 text-[13px] text-mute hover:text-wrong"
              >
                Sign out
              </button>
            </div>
          </nav>
        </aside>

        <main className="col-span-12 lg:col-span-9 space-y-8">
          {active === 'profile' && <ProfileSection />}
          {active === 'security' && <SecuritySection />}
          {active === 'cards' && <CardsSection />}
          {active === 'subscription' && <SubscriptionSection />}
          {active === 'transactions' && <TransactionsSection />}
        </main>
      </div>
    </div>
  );
}

// ---------- subcomponents ----------

function Section({
  title,
  children,
  description,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-surface border border-rule rounded-lg">
      <header className="px-6 py-4 border-b border-rule bg-paper-2">
        <h2
          className="font-display text-[20px] tracking-[-0.01em] text-ink"
          style={{ fontWeight: 450 }}
        >
          {title}
        </h2>
        {description && (
          <p className="text-[13px] text-mute mt-1 max-w-[60ch] leading-[1.6]">
            {description}
          </p>
        )}
      </header>
      <div className="px-6 py-6">{children}</div>
    </section>
  );
}

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[10.5px] uppercase tracking-[0.14em] font-medium text-mute">
        {label}
        {required && <span className="text-copper ml-1">*</span>}
      </span>
      {children}
      {hint && <span className="text-[11.5px] text-mute mt-0.5">{hint}</span>}
    </label>
  );
}

function Banner({ kind, text }: { kind: 'success' | 'error'; text: string }) {
  return (
    <div
      className={cn(
        'rounded-md px-3.5 py-2.5 text-[13px] border',
        kind === 'success'
          ? 'bg-apothecary-soft border-apothecary/30 text-apothecary'
          : 'bg-[#f5e7e4] border-wrong/40 text-wrong',
      )}
    >
      {text}
    </div>
  );
}

function ProfileSection() {
  const { data: session } = useSession();
  const [name, setName] = useState(session?.user?.name ?? '');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    setName(session?.user?.name ?? '');
  }, [session]);

  async function save() {
    setMsg(null);
    setBusy(true);
    try {
      const res = await authClient.updateUser({ name: name.trim() });
      if (res.error) throw new Error(res.error.message ?? 'Update failed');
      setMsg({ kind: 'success', text: 'Profile updated.' });
    } catch (e) {
      setMsg({ kind: 'error', text: e instanceof Error ? e.message : 'Update failed' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Section title="Profile" description="Your name and account email. Changing the email is not yet supported here, write to us if you need that.">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Field label="Name">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="account-input"
            placeholder="Dr. Jane Khan"
          />
        </Field>
        <Field label="Email" hint="Contact support to change your email.">
          <input
            value={session?.user?.email ?? ''}
            disabled
            className="account-input disabled:bg-paper-2 disabled:text-mute"
          />
        </Field>
      </div>
      {msg && <div className="mt-5"><Banner kind={msg.kind} text={msg.text} /></div>}
      <div className="mt-6 flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={busy || !name.trim() || name === session?.user?.name}
          className="h-10 px-5 text-[13.5px] font-medium rounded-md bg-apothecary text-paper border border-apothecary-2 hover:bg-apothecary-2 disabled:opacity-50 transition-colors"
        >
          {busy ? 'Saving…' : 'Save changes'}
        </button>
      </div>
      <style jsx global>{`
        .account-input {
          background: var(--color-surface);
          border: 1px solid var(--color-rule);
          border-radius: 6px;
          padding: 10px 12px;
          font-size: 14px;
          color: var(--color-ink);
          width: 100%;
          outline: none;
        }
        .account-input:focus {
          border-color: var(--color-apothecary);
          box-shadow: 0 0 0 3px rgba(41, 74, 61, 0.15);
        }
      `}</style>
    </Section>
  );
}

function SecuritySection() {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);

  async function change() {
    setMsg(null);
    if (next.length < 8) {
      setMsg({ kind: 'error', text: 'New password must be at least 8 characters.' });
      return;
    }
    if (next !== confirm) {
      setMsg({ kind: 'error', text: 'New password and confirmation do not match.' });
      return;
    }
    setBusy(true);
    try {
      const res = await authClient.changePassword({
        currentPassword: current,
        newPassword: next,
        revokeOtherSessions: true,
      });
      if (res.error) throw new Error(res.error.message ?? 'Password change failed');
      setMsg({ kind: 'success', text: 'Password updated. Other sessions have been signed out.' });
      setCurrent('');
      setNext('');
      setConfirm('');
    } catch (e) {
      setMsg({ kind: 'error', text: e instanceof Error ? e.message : 'Password change failed' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Section title="Security" description="Change your password. We will revoke other active sessions when the password changes.">
      <div className="grid grid-cols-1 gap-5 max-w-[520px]">
        <Field label="Current password" required>
          <input
            type="password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            className="account-input"
            autoComplete="current-password"
          />
        </Field>
        <Field label="New password" required hint="At least 8 characters.">
          <input
            type="password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
            className="account-input"
            autoComplete="new-password"
          />
        </Field>
        <Field label="Confirm new password" required>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="account-input"
            autoComplete="new-password"
          />
        </Field>
      </div>
      {msg && <div className="mt-5"><Banner kind={msg.kind} text={msg.text} /></div>}
      <div className="mt-6 flex items-center gap-3">
        <button
          type="button"
          onClick={change}
          disabled={busy || !current || !next}
          className="h-10 px-5 text-[13.5px] font-medium rounded-md bg-apothecary text-paper border border-apothecary-2 hover:bg-apothecary-2 disabled:opacity-50 transition-colors"
        >
          {busy ? 'Updating…' : 'Update password'}
        </button>
      </div>
    </Section>
  );
}

function CardsSection() {
  const [cards, setCards] = useState<SavedCard[]>([]);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(CARD_KEY);
      if (raw) setCards(JSON.parse(raw) as SavedCard[]);
    } catch {
      /* noop */
    }
  }, []);

  function persist(next: SavedCard[]) {
    setCards(next);
    try {
      window.localStorage.setItem(CARD_KEY, JSON.stringify(next));
    } catch {
      /* noop */
    }
  }

  function removeCard(id: string) {
    persist(cards.filter((c) => c.id !== id));
  }

  return (
    <Section
      title="Payment methods"
      description="Saved methods are stored on this device only. HBLPay does its own card capture on the secure hosted page during checkout."
    >
      {cards.length === 0 ? (
        <div className="text-center py-8 border border-dashed border-rule-2 rounded-md bg-paper-2/40">
          <p className="serif-italic text-mute text-[14.5px]">
            No payment methods saved yet.
          </p>
          <p className="text-[12.5px] text-mute mt-1">
            Save one for faster checkout next time.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {cards.map((c) => (
            <li
              key={c.id}
              className="flex items-center justify-between gap-4 px-4 py-3 bg-surface border border-rule rounded-md"
            >
              <div className="flex items-center gap-4">
                <span className="w-12 h-8 rounded bg-ink text-paper font-medium text-[11px] uppercase tracking-wider inline-flex items-center justify-center">
                  {c.brand}
                </span>
                <div>
                  <div className="text-[14px] text-ink font-mono">
                    •••• {c.last4}
                  </div>
                  <div className="text-[11.5px] text-mute">
                    {c.holderName} · expires {String(c.expMonth).padStart(2, '0')}/
                    {String(c.expYear).slice(-2)}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeCard(c.id)}
                className="text-[12.5px] text-mute hover:text-wrong"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-5">
        {adding ? (
          <AddCardForm
            onCancel={() => setAdding(false)}
            onSave={(card) => {
              persist([...cards, card]);
              setAdding(false);
            }}
          />
        ) : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="h-10 px-5 text-[13.5px] font-medium rounded-md border border-rule-2 text-ink-2 hover:text-ink hover:border-mute hover:bg-paper-2 transition-colors"
          >
            + Add a payment method
          </button>
        )}
      </div>
    </Section>
  );
}

function AddCardForm({
  onCancel,
  onSave,
}: {
  onCancel: () => void;
  onSave: (c: SavedCard) => void;
}) {
  const [num, setNum] = useState('');
  const [name, setName] = useState('');
  const [expM, setExpM] = useState('');
  const [expY, setExpY] = useState('');

  function fmt(v: string) {
    return v.replace(/\D/g, '').slice(0, 19).replace(/(.{4})/g, '$1 ').trim();
  }

  function detectBrand(v: string): SavedCard['brand'] {
    const d = v.replace(/\D/g, '');
    if (d.startsWith('4')) return 'visa';
    if (d.startsWith('5') || d.startsWith('2')) return 'mastercard';
    if (d.startsWith('62')) return 'unionpay';
    return 'hbl';
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const digits = num.replace(/\D/g, '');
    if (digits.length < 12) return;
    const card: SavedCard = {
      id: `c_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
      brand: detectBrand(num),
      last4: digits.slice(-4),
      holderName: name.trim() || 'Cardholder',
      expMonth: Math.min(12, Math.max(1, parseInt(expM || '1', 10))),
      expYear: 2000 + Math.min(99, Math.max(25, parseInt(expY || '29', 10))),
    };
    onSave(card);
  }

  return (
    <form
      onSubmit={submit}
      className="border border-rule rounded-md p-5 bg-paper-2/40 space-y-4 max-w-[520px]"
    >
      <div className="text-[12px] text-mute">
        Card capture is for your reference only. The real transaction still
        runs through HBLPay&rsquo;s secure hosted page during checkout.
      </div>
      <Field label="Card number" required>
        <input
          value={num}
          onChange={(e) => setNum(fmt(e.target.value))}
          placeholder="4000 0000 0000 0101"
          className="account-input font-mono"
          maxLength={23}
          required
        />
      </Field>
      <Field label="Cardholder name" required>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="As printed on the card"
          className="account-input"
          required
        />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Exp. month" required>
          <input
            value={expM}
            onChange={(e) => setExpM(e.target.value.replace(/\D/g, '').slice(0, 2))}
            placeholder="MM"
            className="account-input font-mono"
            maxLength={2}
            required
          />
        </Field>
        <Field label="Exp. year" required>
          <input
            value={expY}
            onChange={(e) => setExpY(e.target.value.replace(/\D/g, '').slice(0, 2))}
            placeholder="YY"
            className="account-input font-mono"
            maxLength={2}
            required
          />
        </Field>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="submit"
          className="h-10 px-4 text-[13.5px] font-medium rounded-md bg-apothecary text-paper border border-apothecary-2 hover:bg-apothecary-2 transition-colors"
        >
          Save card
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="h-10 px-3 text-[13px] text-mute hover:text-ink"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function SubscriptionSection() {
  const [sub, setSub] = useState<Subscription | null | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);

  function load() {
    api.getSubscription().then((r) => setSub(r.subscription)).catch(() => setSub(null));
  }
  useEffect(load, []);

  async function cancel() {
    if (!confirm('Cancel your subscription? You will keep access until the current period ends.'))
      return;
    setMsg(null);
    setBusy(true);
    try {
      const res = await fetch('/api/billing/cancel-subscription', {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error ?? `Failed (${res.status})`);
      }
      setMsg({ kind: 'success', text: 'Subscription cancelled. Access continues until the period ends.' });
      load();
    } catch (e) {
      setMsg({ kind: 'error', text: e instanceof Error ? e.message : 'Failed to cancel' });
    } finally {
      setBusy(false);
    }
  }

  if (sub === undefined) {
    return (
      <Section title="Subscription">
        <p className="serif-italic text-mute">Loading…</p>
      </Section>
    );
  }

  if (!sub) {
    return (
      <Section title="Subscription" description="You do not have a subscription yet.">
        <Link
          href="/billing/checkout"
          className="h-11 inline-flex items-center px-5 text-[14px] font-medium tracking-tight rounded-md bg-apothecary text-paper border border-apothecary-2 hover:bg-apothecary-2 transition-colors"
        >
          Activate a subscription
        </Link>
      </Section>
    );
  }

  const periodEnd = new Date(sub.currentPeriodEnd);
  const periodStart = new Date(sub.currentPeriodStart);
  const status = sub.status;
  const cancelled = sub.cancelAtPeriodEnd || status === 'canceled';

  return (
    <Section title="Subscription" description="Your current plan and renewal status.">
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-[14px]">
        <Row k="Status" v={
          <span className={cn(
            'inline-flex items-center px-2 py-0.5 text-[10.5px] uppercase tracking-wider font-medium rounded',
            status === 'active' && 'bg-correct text-paper',
            status === 'trialing' && 'bg-apothecary-soft text-apothecary border border-apothecary/30',
            status === 'canceled' && 'bg-mute text-paper',
            status === 'expired' && 'bg-wrong text-paper',
            status === 'past_due' && 'bg-copper-soft text-copper border border-copper/40',
          )}>{status}</span>
        } />
        <Row k="Provider" v={sub.provider} />
        <Row k="Current period start" v={periodStart.toLocaleDateString()} />
        <Row k="Current period end" v={periodEnd.toLocaleDateString()} />
      </dl>

      {cancelled && (
        <div className="mt-5">
          <Banner kind="success" text={`Subscription cancelled. You keep access until ${periodEnd.toLocaleDateString()}.`} />
        </div>
      )}
      {msg && <div className="mt-5"><Banner kind={msg.kind} text={msg.text} /></div>}

      {!cancelled && (
        <div className="mt-6 flex items-center gap-3">
          <button
            type="button"
            onClick={cancel}
            disabled={busy}
            className="h-10 px-4 text-[13.5px] font-medium rounded-md border border-wrong/40 text-wrong hover:bg-[#f5e7e4] disabled:opacity-50 transition-colors"
          >
            {busy ? 'Cancelling…' : 'Cancel subscription'}
          </button>
          <Link
            href="/billing/checkout"
            className="text-[13px] text-mute hover:text-ink"
          >
            Renew or upgrade →
          </Link>
        </div>
      )}
    </Section>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[10.5px] uppercase tracking-wider text-mute mb-1">{k}</dt>
      <dd className="text-ink">{v}</dd>
    </div>
  );
}

function TransactionsSection() {
  const [txs, setTxs] = useState<Tx[] | null>(null);

  useEffect(() => {
    fetch('/api/me/transactions', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: { transactions: Tx[] }) => setTxs(d.transactions))
      .catch(() => setTxs([]));
  }, []);

  function fmt(minor: number, currency: string) {
    return `${currency} ${(minor / 100).toLocaleString('en-PK')}`;
  }

  return (
    <Section title="Transactions" description="Every payment that has been made on this account.">
      {txs === null ? (
        <p className="serif-italic text-mute">Loading…</p>
      ) : txs.length === 0 ? (
        <div className="text-center py-8 border border-dashed border-rule-2 rounded-md bg-paper-2/40">
          <p className="serif-italic text-mute text-[14.5px]">No transactions yet.</p>
        </div>
      ) : (
        <ul className="divide-y divide-rule border border-rule rounded-md bg-surface">
          {txs.map((t) => (
            <li
              key={t.id}
              className="px-4 py-3 flex items-center justify-between gap-4"
            >
              <div className="min-w-0">
                <div className="font-mono text-[12px] text-ink truncate">
                  {t.providerOrderId}
                </div>
                <div className="text-[11.5px] text-mute mt-0.5">
                  {new Date(t.createdAt).toLocaleString()} · response{' '}
                  {t.providerResponseCode ?? '—'}
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="tabular-nums text-[14px] text-ink">
                  {fmt(t.amountMinorUnits, t.currency)}
                </span>
                <span
                  className={cn(
                    'inline-flex items-center px-2 py-0.5 text-[10.5px] uppercase tracking-wider font-medium rounded',
                    t.status === 'succeeded' && 'bg-correct text-paper',
                    t.status === 'pending' && 'bg-apothecary-soft text-apothecary border border-apothecary/30',
                    t.status === 'under_review' && 'bg-copper-soft text-copper border border-copper/40',
                    t.status === 'failed' && 'bg-wrong text-paper',
                    t.status === 'refunded' && 'bg-paper-2 text-mute border border-rule',
                  )}
                >
                  {t.status}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}
