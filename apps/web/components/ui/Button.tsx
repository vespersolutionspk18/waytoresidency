import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variantCls: Record<Variant, string> = {
  primary:
    'bg-apothecary text-paper hover:bg-apothecary-2 border border-apothecary-2',
  secondary:
    'bg-surface text-ink border border-rule-2 hover:bg-paper-2 hover:border-mute',
  ghost: 'bg-transparent text-ink-2 hover:text-ink hover:bg-paper-2',
};

const sizeCls: Record<Size, string> = {
  sm: 'h-9 px-3.5 text-[13px]',
  md: 'h-11 px-5 text-[14px]',
  lg: 'h-12 px-6 text-[15px]',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading, className, children, disabled, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2',
        'font-medium tracking-tight rounded-md',
        'transition-colors duration-150',
        'focus-ring',
        'disabled:opacity-60 disabled:cursor-not-allowed',
        variantCls[variant],
        sizeCls[size],
        className,
      )}
      {...rest}
    >
      {loading && (
        <span
          aria-hidden="true"
          className="inline-block w-3.5 h-3.5 border border-current border-r-transparent rounded-full animate-spin"
        />
      )}
      {children}
    </button>
  );
});
