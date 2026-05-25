'use client';

import Link from 'next/link';
import { useCart } from './CartProvider';
import { cn } from '@/lib/utils';

export function CartIndicator({ className }: { className?: string }) {
  const { totalQty, ready } = useCart();
  if (!ready) return null;

  return (
    <Link
      href="/cart"
      className={cn(
        'relative inline-flex items-center justify-center h-9 px-3 text-[13px] font-medium rounded-md border border-rule-2 text-ink-2 hover:text-ink hover:border-mute hover:bg-paper-2 transition-colors',
        className,
      )}
      aria-label={`Cart, ${totalQty} item${totalQty === 1 ? '' : 's'}`}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 14 14"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        aria-hidden
        className="mr-1.5"
      >
        <path d="M1 1h2l1.5 8.5a1.5 1.5 0 0 0 1.5 1.2h5.6a1.5 1.5 0 0 0 1.5-1.2L14 4H4" />
        <circle cx="5" cy="12" r="0.8" fill="currentColor" />
        <circle cx="11" cy="12" r="0.8" fill="currentColor" />
      </svg>
      Cart
      {totalQty > 0 && (
        <span className="ml-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-copper text-paper text-[10.5px] font-medium rounded-full tabular-nums">
          {totalQty}
        </span>
      )}
    </Link>
  );
}
