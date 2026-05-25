'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import {
  MarketingNav,
  MarketingFooter,
} from '@/components/marketing/MarketingNav';
import { useCart } from '@/components/cart/CartProvider';
import { useSession } from '@/lib/auth-client';
import { cn } from '@/lib/utils';

const SHIPPING_MINOR = 0; // free shipping inside Pakistan for the mockup

export default function CartCheckoutPage() {
  const router = useRouter();
  const { items, totalMinor, totalQty, clear, ready } = useCart();
  const { data: session, isPending: sessionLoading } = useSession();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [payment, setPayment] = useState<'hblpay' | 'cod'>('hblpay');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user) {
      const parts = (session.user.name ?? '').split(' ');
      setFirstName((p) => p || parts[0] || '');
      setLastName((p) => p || parts.slice(1).join(' ') || '');
      setEmail((p) => p || session.user.email || '');
    }
  }, [session]);

  useEffect(() => {
    if (ready && totalQty === 0) {
      router.replace('/cart');
    }
  }, [ready, totalQty, router]);

  const grandTotal = totalMinor + SHIPPING_MINOR;

  function fmt(minor: number) {
    return `₨ ${(minor / 100).toLocaleString('en-PK')}`;
  }

  async function placeOrder(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!session?.user) {
      router.push('/sign-in?redirect=/cart/checkout');
      return;
    }
    if (totalQty === 0) {
      setError('Your cart is empty.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/billing/cart-checkout', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((it) => ({
            slug: it.slug,
            title: it.title,
            priceMinor: it.priceMinor,
            qty: it.qty,
          })),
          shipping: { firstName, lastName, email, phone, address, city },
          paymentMethod: payment,
        }),
      });
      const data = (await res.json()) as
        | { orderId: string; status: string }
        | { error: string };
      if (!res.ok || 'error' in data) {
        const msg = 'error' in data ? data.error : `Checkout failed (${res.status})`;
        setError(msg);
        setSubmitting(false);
        return;
      }
      clear();
      if (payment === 'hblpay') {
        router.push(`/billing/pay/${data.orderId}`);
      } else {
        router.push(`/billing/return?orderId=${data.orderId}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout failed.');
      setSubmitting(false);
    }
  }

  if (!ready || sessionLoading) {
    return (
      <>
        <MarketingNav />
        <div className="w-full px-6 md:px-12 lg:px-16 py-20">
          <p className="serif-italic text-mute">Loading…</p>
        </div>
        <MarketingFooter />
      </>
    );
  }

  return (
    <>
      <MarketingNav />

      <section className="border-b border-rule">
        <div className="w-full px-6 md:px-12 lg:px-16 py-12 lg:py-14">
          <div className="flex items-center gap-3 mb-3">
            <span className="section-numeral">§ Checkout</span>
            <span className="eyebrow">Order details</span>
          </div>
          <h1
            className="text-[32px] md:text-[40px] leading-[1.05] tracking-[-0.018em] text-ink"
            style={{
              fontVariationSettings: '"SOFT" 50, "WONK" 0, "opsz" 120',
              fontWeight: 420,
            }}
          >
            Almost there. Fill in the{' '}
            <span className="serif-italic text-apothecary">delivery details</span>.
          </h1>
          {!session?.user && (
            <p className="mt-4 text-[14px] text-copper">
              <Link href="/sign-in?redirect=/cart/checkout" className="underline">
                Sign in
              </Link>{' '}
              to save your order to your account, or continue and we will ask for an account at the next step.
            </p>
          )}
        </div>
      </section>

      <section>
        <div className="w-full px-6 md:px-12 lg:px-16 py-12 lg:py-16">
          <form onSubmit={placeOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-5">
              <Card title="Shipping address">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="First name" required>
                    <input
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="checkout-input"
                    />
                  </Field>
                  <Field label="Last name">
                    <input
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="checkout-input"
                    />
                  </Field>
                  <Field label="Email" required>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="checkout-input"
                    />
                  </Field>
                  <Field label="Phone / WhatsApp" required>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+92 300 1234567"
                      className="checkout-input font-mono"
                    />
                  </Field>
                </div>
                <Field label="Street address" required>
                  <input
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="House, street, area"
                    className="checkout-input"
                  />
                </Field>
                <Field label="City" required>
                  <input
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Bahawalpur, Karachi, Lahore..."
                    className="checkout-input"
                  />
                </Field>
              </Card>

              <Card title="Payment method">
                <PaymentChoice
                  value="hblpay"
                  active={payment === 'hblpay'}
                  onSelect={() => setPayment('hblpay')}
                  title="HBLPay (online)"
                  blurb="Visa, Mastercard, UnionPay, or directly from your HBL account. Secure hosted checkout, receipt emailed."
                />
                <PaymentChoice
                  value="cod"
                  active={payment === 'cod'}
                  onSelect={() => setPayment('cod')}
                  title="Cash on delivery"
                  blurb="Pay the courier in cash when the parcel arrives. Available anywhere in Pakistan."
                />
              </Card>

              {error && (
                <div className="border border-wrong/40 bg-[#f5e7e4] text-wrong text-[13.5px] rounded-md px-4 py-3">
                  {error}
                </div>
              )}
            </div>

            <aside className="lg:col-span-4">
              <div className="bg-surface border border-rule rounded-lg p-6 lg:sticky lg:top-6">
                <span className="eyebrow">Your order</span>
                <ul className="mt-3 divide-y divide-rule">
                  {items.map((it) => (
                    <li key={it.slug} className="flex items-start gap-3 py-3">
                      <div className="w-12 h-14 shrink-0 bg-paper-2 border border-rule rounded overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={it.cover} alt={it.title} className="w-full h-full object-contain p-1" />
                      </div>
                      <div className="flex-1 min-w-0 text-[13px]">
                        <div className="text-ink truncate">{it.title}</div>
                        <div className="text-mute mt-0.5">Qty {it.qty}</div>
                      </div>
                      <div className="tabular-nums text-[13px] text-ink shrink-0">
                        {fmt(it.priceMinor * it.qty)}
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="my-4 rule" />
                <div className="space-y-2 text-[13px]">
                  <div className="flex justify-between text-ink-2">
                    <span>Subtotal</span>
                    <span className="tabular-nums">{fmt(totalMinor)}</span>
                  </div>
                  <div className="flex justify-between text-mute">
                    <span>Shipping</span>
                    <span className="tabular-nums">{SHIPPING_MINOR === 0 ? 'Free' : fmt(SHIPPING_MINOR)}</span>
                  </div>
                </div>
                <div className="my-4 rule" />
                <div className="flex items-baseline justify-between">
                  <span className="text-[13px] font-medium text-ink">Total</span>
                  <span
                    className="font-display text-[22px] tabular-nums text-ink"
                    style={{ fontWeight: 500 }}
                  >
                    {fmt(grandTotal)}
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-6 w-full h-12 inline-flex items-center justify-center px-5 text-[14px] font-medium tracking-tight rounded-md bg-apothecary text-paper border border-apothecary-2 hover:bg-apothecary-2 transition-colors disabled:opacity-50"
                >
                  {submitting
                    ? 'Placing order…'
                    : payment === 'hblpay'
                      ? `Pay ${fmt(grandTotal)} with HBLPay`
                      : `Place order, pay on delivery`}
                </button>
                <Link
                  href="/cart"
                  className="mt-3 block text-center text-[12.5px] text-mute hover:text-ink"
                >
                  ← Back to cart
                </Link>
              </div>
            </aside>
          </form>
        </div>
      </section>

      <MarketingFooter />

      <style jsx global>{`
        .checkout-input {
          background: var(--color-surface);
          border: 1px solid var(--color-rule);
          border-radius: 6px;
          padding: 10px 12px;
          font-size: 14.5px;
          color: var(--color-ink);
          width: 100%;
          outline: none;
          font-family: var(--font-body);
          line-height: 1.55;
          transition: border-color 120ms, box-shadow 120ms;
        }
        .checkout-input::placeholder { color: var(--color-mute); }
        .checkout-input:focus {
          border-color: var(--color-apothecary);
          box-shadow: 0 0 0 3px rgba(41, 74, 61, 0.15);
        }
      `}</style>
    </>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-surface border border-rule rounded-lg overflow-hidden">
      <header className="px-5 py-3 border-b border-rule bg-paper-2">
        <span className="eyebrow">{title}</span>
      </header>
      <div className="px-5 py-5 space-y-4">{children}</div>
    </section>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[10.5px] uppercase tracking-[0.14em] font-medium text-mute">
        {label}
        {required && <span className="text-copper ml-1">*</span>}
      </span>
      {children}
    </label>
  );
}

function PaymentChoice({
  active,
  onSelect,
  title,
  blurb,
}: {
  value: string;
  active: boolean;
  onSelect: () => void;
  title: string;
  blurb: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'w-full text-left flex items-start gap-3 px-4 py-3.5 rounded-md border transition-colors',
        active
          ? 'border-apothecary bg-apothecary-soft'
          : 'border-rule hover:border-mute hover:bg-paper-2',
      )}
    >
      <span
        className={cn(
          'mt-1 w-4 h-4 rounded-full border-2 shrink-0',
          active ? 'border-apothecary bg-apothecary' : 'border-rule-2 bg-surface',
        )}
        aria-hidden
      />
      <div>
        <div className="text-[14px] font-medium text-ink">{title}</div>
        <div className="text-[12.5px] text-ink-2 mt-0.5">{blurb}</div>
      </div>
    </button>
  );
}
