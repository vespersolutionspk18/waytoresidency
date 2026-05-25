import Link from 'next/link';
import { Brand } from '@/components/brand/Logo';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-[1.05fr_1fr]">
      {/* ---------- Left: editorial colophon ---------- */}
      <aside className="hidden lg:flex flex-col justify-between bg-paper-2 border-r border-rule px-12 py-10">
        <Link href="/" className="inline-flex">
          <Brand size="md" />
        </Link>

        <div className="max-w-[44ch]">
          <span className="section-numeral">From the colophon</span>
          <p
            className="mt-4 font-display text-[34px] leading-[1.12] tracking-[-0.015em] text-ink"
            style={{ fontWeight: 420, fontVariationSettings: '"SOFT" 50, "WONK" 0, "opsz" 96' }}
          >
            &ldquo;In medicine,{' '}
            <span className="serif-italic text-apothecary">
              the question well asked
            </span>{' '}
            is the answer half-given.&rdquo;
          </p>
          <p className="mt-4 text-[12.5px] text-mute">
           , adapted from <span className="serif-italic">Aphorisms</span>, after Hippocrates
          </p>
        </div>

        <div className="flex items-center gap-6 text-[12px] text-mute">
          <span>Vol. I · 2026</span>
          <span className="h-px flex-1 bg-rule" />
          <Link href="/" className="hover:text-ink">
            ← Back to home
          </Link>
        </div>
      </aside>

      {/* ---------- Right: form ---------- */}
      <main className="flex flex-col items-center justify-center px-6 py-10 lg:px-12">
        <div className="lg:hidden mb-10">
          <Brand size="sm" />
        </div>
        <div className="w-full max-w-[400px]">{children}</div>
      </main>
    </div>
  );
}
