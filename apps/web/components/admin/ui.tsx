import { cn } from '@/lib/utils';

export function PageHeader({
  numeral,
  title,
  subtitle,
  actions,
}: {
  numeral: string;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="border-b border-rule px-4 sm:px-6 md:px-8 py-4 md:py-6 flex flex-col md:flex-row md:items-end md:justify-between gap-4 md:gap-6">
      <div className="min-w-0">
        <div className="flex items-baseline gap-3 mb-1">
          <span className="section-numeral">{numeral}</span>
          <span className="eyebrow">Admin</span>
        </div>
        <h1
          className="font-display text-[22px] sm:text-[26px] md:text-[28px] leading-[1.1] tracking-[-0.012em] text-ink"
          style={{ fontWeight: 450 }}
        >
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1.5 text-[13px] md:text-[13.5px] text-mute max-w-[60ch]">
            {subtitle}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 flex-wrap md:flex-nowrap md:shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}

export function Card({
  title,
  actions,
  children,
  className,
}: {
  title?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn('bg-surface border border-rule rounded-lg overflow-hidden', className)}
    >
      {(title || actions) && (
        <header className="px-5 py-3 border-b border-rule bg-paper-2 flex items-center justify-between gap-3">
          {typeof title === 'string' ? (
            <span className="eyebrow">{title}</span>
          ) : (
            title
          )}
          {actions}
        </header>
      )}
      {children}
    </section>
  );
}

export function Pill({
  status,
  children,
}: {
  status:
    | 'success'
    | 'danger'
    | 'warn'
    | 'neutral'
    | 'info'
    | 'muted';
  children: React.ReactNode;
}) {
  const map = {
    success: 'bg-correct text-paper',
    danger: 'bg-wrong text-paper',
    warn: 'bg-copper-soft text-copper border border-copper/40',
    info: 'bg-apothecary-soft text-apothecary border border-apothecary/30',
    neutral: 'bg-ink text-paper',
    muted: 'bg-paper-2 text-mute border border-rule',
  } as const;
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 text-[10.5px] uppercase tracking-wider font-medium rounded',
        map[status],
      )}
    >
      {children}
    </span>
  );
}

export function statusPill(status: string) {
  switch (status) {
    case 'succeeded':
    case 'active':
      return <Pill status="success">{status}</Pill>;
    case 'failed':
    case 'expired':
    case 'canceled':
      return <Pill status="danger">{status}</Pill>;
    case 'under_review':
    case 'past_due':
      return <Pill status="warn">{status.replace('_', ' ')}</Pill>;
    case 'pending':
    case 'trialing':
      return <Pill status="info">{status}</Pill>;
    default:
      return <Pill status="muted">{status}</Pill>;
  }
}

export function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-6 py-12 text-center">
      <p className="serif-italic text-mute text-[14.5px]">{children}</p>
    </div>
  );
}

export function fmtMoney(minor: number, currency: string) {
  return `${currency} ${(minor / 100).toLocaleString('en-PK', { minimumFractionDigits: 0 })}`;
}

export function fmtDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
