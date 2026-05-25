'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart, type CartItem } from './CartProvider';
import { cn } from '@/lib/utils';

type Props = {
  item: Omit<CartItem, 'qty'>;
  className?: string;
  variant?: 'link' | 'primary' | 'secondary';
  label?: string;
};

export function AddToCartButton({
  item,
  className,
  variant = 'primary',
  label = 'Add to cart',
}: Props) {
  const { add } = useCart();
  const router = useRouter();
  const [added, setAdded] = useState(false);

  function handleAdd() {
    add(item, 1);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1600);
  }

  if (variant === 'link') {
    return (
      <button
        type="button"
        onClick={handleAdd}
        className={cn(
          'text-[12.5px] font-medium transition-colors',
          added
            ? 'text-correct'
            : 'text-apothecary hover:text-apothecary-2',
          className,
        )}
      >
        {added ? 'Added →' : `${label} →`}
      </button>
    );
  }

  const baseClasses =
    variant === 'secondary'
      ? 'h-11 inline-flex items-center px-5 text-[14px] tracking-tight text-ink-2 hover:text-ink border border-rule rounded-md hover:border-mute hover:bg-paper-2 transition-colors'
      : 'h-11 inline-flex items-center px-5 text-[14px] font-medium tracking-tight rounded-md bg-apothecary text-paper border border-apothecary-2 hover:bg-apothecary-2 transition-colors';

  return (
    <div className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={handleAdd}
        className={cn(baseClasses, added && 'bg-correct border-correct hover:bg-correct', className)}
      >
        {added ? 'Added to cart ✓' : label}
      </button>
      {added && (
        <button
          type="button"
          onClick={() => router.push('/cart')}
          className="text-[12.5px] text-apothecary hover:text-apothecary-2 underline underline-offset-4"
        >
          View cart →
        </button>
      )}
    </div>
  );
}
