import Link from 'next/link';
import { Brand } from '@/components/brand/Logo';
import { SignOutButton } from '@/components/app/SignOutButton';
import { AdminGuard } from '@/components/app/AdminGuard';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-rule">
        <div className="mx-auto max-w-[1180px] px-4 sm:px-6 md:px-8 h-[60px] flex items-center justify-between gap-4">
          <Link href="/" className="inline-flex shrink-0" aria-label="Home">
            <Brand size="md" />
          </Link>
          {/* Tight nav: hides separators + Home link on small screens to free room. */}
          <nav className="flex items-center gap-3 sm:gap-5 md:gap-6 text-[13px] sm:text-[13.5px]">
            <Link href="/dashboard" className="text-ink-2 hover:text-ink">
              Dashboard
            </Link>
            <span className="text-mute hidden sm:inline">·</span>
            <Link href="/account" className="text-ink-2 hover:text-ink">
              Account
            </Link>
            <span className="text-mute hidden md:inline">·</span>
            <Link href="/" className="hidden md:inline text-ink-2 hover:text-ink">
              Home
            </Link>
            <SignOutButton />
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <AdminGuard>{children}</AdminGuard>
      </main>
    </div>
  );
}
