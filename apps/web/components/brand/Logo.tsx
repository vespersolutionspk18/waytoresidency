import { cn } from '@/lib/utils';

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 28 28"
      aria-hidden="true"
      className={cn('shrink-0', className)}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="square"
      strokeLinejoin="miter"
    >
      {/* stylized R / Rx */}
      <path d="M7.5 4.5v19" />
      <path d="M7.5 4.5h7.2c2.6 0 4.6 1.9 4.6 4.4s-2 4.4-4.6 4.4H7.5" />
      <path d="M13.6 13.3 21 23.5" />
      {/* small horizontal serif at bottom */}
      <path d="M5.6 23.5h3.8" />
    </svg>
  );
}

export function Wordmark({
  size = 'md',
  className,
}: {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const cls = {
    sm: 'text-[15px]',
    md: 'text-[18px]',
    lg: 'text-[22px]',
  }[size];
  return (
    <span
      className={cn(
        'font-display tracking-tight text-ink',
        cls,
        className,
      )}
      style={{ fontVariationSettings: '"SOFT" 30, "WONK" 0, "opsz" 14' }}
    >
      way to <span className="serif-italic">residency</span>
      <span className="text-copper">.</span>
    </span>
  );
}

export function Brand({
  size = 'md',
  className,
}: {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const markSize = { sm: 'w-5 h-5', md: 'w-6 h-6', lg: 'w-7 h-7' }[size];
  return (
    <span className={cn('inline-flex items-center gap-2.5 text-ink', className)}>
      <LogoMark className={markSize} />
      <Wordmark size={size} />
    </span>
  );
}
