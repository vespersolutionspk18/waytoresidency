'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  MarketingNav,
  MarketingFooter,
} from '@/components/marketing/MarketingNav';
import { useCart } from '@/components/cart/CartProvider';
import { cn } from '@/lib/utils';

export default function CartPage() {
  const router = useRouter();
  const { items, totalMinor, totalQty, setQty, remove, ready } = useCart();

  function fmt(minor: number) {
    return `₨ ${(minor / 100).toLocaleString('en-PK')}`;
  }

  return (
    <>
      <MarketingNav />

      <section className="border-b border-rule">
        <div className="w-full px-6 md:px-12 lg:px-16 py-12 lg:py-16">
          <div className="flex items-center gap-3 mb-3">
            <span className="section-numeral">§ Cart</span>
            <span className="eyebrow">Your order</span>
          </div>
          <h1
            className="text-[36px] md:text-[48px] leading-[1.04] tracking-[-0.018em] text-ink"
            style={{
              fontVariationSettings: '"SOFT" 50, "WONK" 0, "opsz" 120',
              fontWeight: 420,
            }}
          >
            {totalQty === 0 ? (
              <>
                Your cart is{' '}
                <span className="serif-italic text-apothecary">empty</span>.
              </>
            ) : (
              <>
                <span className="serif-italic text-apothecary">{totalQty}</span>{' '}
                item{totalQty === 1 ? '' : 's'} in your cart.
              </>
            )}
          </h1>
          {totalQty === 0 && (
            <p className="mt-5 max-w-[55ch] text-[15.5px] text-ink-2 leading-[1.7]">
              You have not added any books yet. Head to the books page to pick
              up The FCPS-1 Manual, the QBank, Residents' Way to Residency, or
              the AKUH Bundle.
            </p>
          )}
          {totalQty === 0 && (
            <div className="mt-6">
              <Link
                href="/books"
                className="h-11 inline-flex items-center px-5 text-[14px] font-medium tracking-tight rounded-md bg-apothecary text-paper border border-apothecary-2 hover:bg-apothecary-2 transition-colors"
              >
                Browse the books
              </Link>
            </div>
          )}
        </div>
      </section>

      {totalQty > 0 && (
        <section>
          <div className="w-full px-6 md:px-12 lg:px-16 py-12 lg:py-16">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-8">
                <div className="bg-surface border border-rule rounded-lg overflow-hidden">
                  <div className="px-6 py-4 border-b border-rule bg-paper-2 flex items-center justify-between text-[12.5px]">
                    <span className="eyebrow">Items</span>
                    <span className="text-mute">{totalQty} in cart</span>
                  </div>
                  <ul className="divide-y divide-rule">
                    {items.map((it) => (
                      <li key={it.slug} className="px-5 py-5 flex gap-5">
                        <div className="w-20 h-24 shrink-0 bg-paper-2 border border-rule rounded overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={it.cover}
                            alt={it.title}
                            className="w-full h-full object-contain p-1.5"
                            loading="lazy"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3
                            className="font-display text-[17px] text-ink tracking-tight leading-tight"
                            style={{ fontWeight: 450 }}
                          >
                            {it.title}
                          </h3>
                          {it.edition && (
                            <div className="mt-1 text-[11.5px] uppercase tracking-wider text-mute">
                              {it.edition}
                            </div>
                          )}
                          <div className="mt-3 flex items-center gap-4">
                            <QtyStepper
                              value={it.qty}
                              onChange={(q) => setQty(it.slug, q)}
                            />
                            <button
                              type="button"
                              onClick={() => remove(it.slug)}
                              className="text-[12.5px] text-mute hover:text-wrong underline underline-offset-4 decoration-rule-2 hover:decoration-wrong"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div
                            className="font-display text-[20px] tabular-nums text-ink tracking-tight"
                            style={{ fontWeight: 450 }}
                          >
                            {fmt(it.priceMinor * it.qty)}
                          </div>
                          {it.qty > 1 && (
                            <div className="text-[11.5px] text-mute mt-0.5 tabular-nums">
                              {fmt(it.priceMinor)} × {it.qty}
                            </div>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Order summary */}
              <aside className="lg:col-span-4">
                <div className="bg-surface border border-rule rounded-lg p-6 lg:sticky lg:top-6">
                  <span className="eyebrow">Order summary</span>
                  <div className="mt-4 space-y-2 text-[13.5px]">
                    <Row label={`Subtotal (${totalQty} item${totalQty === 1 ? '' : 's'})`} value={fmt(totalMinor)} />
                    <Row label="Shipping" value="Calculated at checkout" subtle />
                    <Row label="Tax" value="Included" subtle />
                  </div>
                  <div className="my-5 rule" />
                  <Row label="Estimated total" value={fmt(totalMinor)} bold />

                  <button
                    type="button"
                    onClick={() => router.push('/cart/checkout')}
                    disabled={!ready}
                    className="mt-6 w-full h-12 inline-flex items-center justify-center px-5 text-[14px] font-medium tracking-tight rounded-md bg-apothecary text-paper border border-apothecary-2 hover:bg-apothecary-2 transition-colors disabled:opacity-50"
                  >
                    Proceed to checkout
                  </button>
                  <Link
                    href="/books"
                    className="mt-3 block text-center text-[12.5px] text-mute hover:text-ink"
                  >
                    ← Keep browsing
                  </Link>

                  <div className="mt-5 pt-5 border-t border-rule text-[11.5px] text-mute leading-[1.6]">
                    Pay via HBLPay (Visa, Mastercard, UnionPay, or HBL
                    account) or choose cash on delivery on the next step.
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </section>
      )}

      <MarketingFooter />
    </>
  );
}

function QtyStepper({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="inline-flex items-center border border-rule rounded-md overflow-hidden">
      <button
        type="button"
        onClick={() => onChange(Math.max(1, value - 1))}
        disabled={value <= 1}
        className="w-8 h-8 inline-flex items-center justify-center text-ink-2 hover:bg-paper-2 disabled:opacity-40"
        aria-label="Decrease quantity"
      >
        −
      </button>
      <span className="w-8 text-center tabular-nums text-[13.5px] text-ink">
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        className="w-8 h-8 inline-flex items-center justify-center text-ink-2 hover:bg-paper-2"
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  );
}

function Row({
  label,
  value,
  bold,
  subtle,
}: {
  label: string;
  value: string;
  bold?: boolean;
  subtle?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span
        className={cn(
          'text-[13px]',
          bold ? 'text-ink font-medium' : subtle ? 'text-mute' : 'text-ink-2',
        )}
      >
        {label}
      </span>
      <span
        className={cn(
          'tabular-nums',
          bold
            ? 'font-display text-[20px] text-ink'
            : subtle
              ? 'text-mute'
              : 'text-ink',
        )}
        style={bold ? { fontWeight: 500 } : undefined}
      >
        {value}
      </span>
    </div>
  );
}
