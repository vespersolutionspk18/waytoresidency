import { cn } from '@/lib/utils';

type Props = { text: string | null | undefined; className?: string };

/**
 * Renders explanation content.
 * - If it looks like HTML (contains an HTML tag), render it directly with `prose-content` styles.
 * - Otherwise, fall back to a light text-based parser that detects:
 *     - blank-line-separated blocks
 *     - lines ending in : / ? / ! as headings
 *     - "Label: rest" lines as labeled paragraphs
 */
export function FormattedText({ text, className }: Props) {
  if (!text || !text.trim()) return null;
  if (isHtml(text)) {
    return (
      <div
        className={cn('prose-content', className)}
        // explanation comes from admin-authored content; sanitize-on-write or use DOMPurify
        // before deploying to a context where non-admins can write to it.
        dangerouslySetInnerHTML={{ __html: text }}
      />
    );
  }
  return <PlainTextFormatter text={text} className={className} />;
}

function isHtml(s: string): boolean {
  return /<\s*[a-zA-Z][^>]*>/.test(s);
}

function PlainTextFormatter({ text, className }: Props) {
  const blocks = text!
    .replace(/\r\n/g, '\n')
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean);
  return (
    <div className={cn('text-[14.5px] leading-[1.7] text-ink-2', className)}>
      {blocks.map((block, i) => (
        <Block key={i} text={block} first={i === 0} />
      ))}
    </div>
  );
}

function isHeadingLine(line: string): boolean {
  const t = line.trim();
  if (t.length < 2 || t.length > 110) return false;
  const last = t[t.length - 1];
  if (last !== ':' && last !== '?' && last !== '!') return false;
  const body = t.slice(0, -1);
  if (/[.!?]\s+[A-Z]/.test(body)) return false;
  return true;
}

function Block({ text, first }: { text: string; first: boolean }) {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) return null;
  if (lines.length === 1 && isHeadingLine(lines[0]!)) {
    return (
      <h4
        className={cn(
          'font-display text-[16.5px] text-ink tracking-[-0.005em]',
          first ? 'mt-0' : 'mt-6',
          'mb-2 pb-1 border-b border-rule',
        )}
        style={{ fontWeight: 500 }}
      >
        {lines[0]!.replace(/[:?!]$/, '')}
      </h4>
    );
  }
  let headerEl: React.ReactNode = null;
  let body = lines;
  if (isHeadingLine(lines[0]!)) {
    headerEl = (
      <h4
        className={cn(
          'font-display text-[16.5px] text-ink tracking-[-0.005em]',
          first ? 'mt-0' : 'mt-6',
          'mb-2 pb-1 border-b border-rule',
        )}
        style={{ fontWeight: 500 }}
      >
        {lines[0]!.replace(/[:?!]$/, '')}
      </h4>
    );
    body = lines.slice(1);
  }
  return (
    <section className={cn(!first && !headerEl && 'mt-4')}>
      {headerEl}
      {body.map((line, i) => (
        <LineRenderer key={i} line={line} index={i} />
      ))}
    </section>
  );
}

function LineRenderer({ line, index }: { line: string; index: number }) {
  const m = line.match(/^([A-Z][A-Za-z0-9 ’'\-/()]{1,55}):\s+(.+)$/);
  if (m && m[2]!.length > 8 && !m[1]!.endsWith(' is')) {
    return (
      <p className={cn(index === 0 ? 'mt-0' : 'mt-2')}>
        <span className="font-semibold text-ink">{m[1]}:</span>{' '}
        <span>{m[2]}</span>
      </p>
    );
  }
  if (isHeadingLine(line)) {
    return (
      <h5
        className={cn(
          'font-display text-[15px] text-ink tracking-[-0.005em]',
          index === 0 ? 'mt-0' : 'mt-4',
          'mb-1.5',
        )}
        style={{ fontWeight: 500 }}
      >
        {line.replace(/[:?!]$/, '')}
      </h5>
    );
  }
  return <p className={cn(index === 0 ? 'mt-0' : 'mt-2')}>{line}</p>;
}
