'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/api';
import { signOut } from '@/lib/auth-client';
import { LogoMark } from '@/components/brand/Logo';
import { cn } from '@/lib/utils';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [me, setMe] = useState<{ name: string; email: string } | null>(null);
  const [denied, setDenied] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    adminApi
      .whoami()
      .then((r) => setMe({ name: r.user.name, email: r.user.email }))
      .catch((e: Error & { status?: number }) => {
        if (e.status === 401) router.replace('/sign-in?redirect=/admin');
        else setDenied(true);
      });
  }, [router]);

  // Close drawer when route changes (mobile nav UX)
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  // Close drawer on Escape
  useEffect(() => {
    if (!drawerOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setDrawerOpen(false);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [drawerOpen]);

  // Lock body scroll while the drawer is open
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [drawerOpen]);

  if (denied) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-[420px] text-center">
          <span className="section-numeral">§ 403</span>
          <h1
            className="mt-2 font-display text-[28px] tracking-[-0.012em]"
            style={{ fontWeight: 450 }}
          >
            Admin only.
          </h1>
          <p className="mt-2 text-[14px] text-mute leading-[1.6]">
            Ask an existing admin to promote your account.
          </p>
          <Link
            href="/dashboard"
            className="mt-5 inline-flex items-center h-10 px-4 text-[13.5px] font-medium rounded-md bg-apothecary text-paper border border-apothecary-2"
          >
            ← Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!me) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="serif-italic text-mute">Verifying admin access…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper lg:flex">
      {/* ---------- Mobile top bar (hamburger + brand) ---------- */}
      <div className="lg:hidden sticky top-0 z-30 bg-paper-2/95 backdrop-blur border-b border-rule h-14 px-3 flex items-center justify-between">
        <Link href="/admin" className="flex items-center gap-2.5 px-2 py-1">
          <LogoMark className="w-5 h-5 text-ink" />
          <span
            className="font-display text-[16px] text-ink tracking-tight"
            style={{ fontWeight: 500 }}
          >
            admin<span className="text-copper">.</span>
          </span>
        </Link>
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-label="Open admin menu"
          className="h-10 w-10 inline-flex items-center justify-center rounded-md text-ink-2 hover:text-ink hover:bg-paper"
        >
          <HamburgerIcon />
        </button>
      </div>

      {/* ---------- Backdrop (mobile only, when drawer open) ---------- */}
      {drawerOpen && (
        <div
          onClick={() => setDrawerOpen(false)}
          className="lg:hidden fixed inset-0 z-40 bg-ink/40 backdrop-blur-[1px]"
          aria-hidden
        />
      )}

      {/* ---------- Sidebar / Drawer ---------- */}
      <aside
        className={cn(
          // Desktop: fixed sidebar, always visible
          'lg:relative lg:w-[240px] lg:shrink-0 lg:translate-x-0 lg:flex',
          // Mobile: off-canvas drawer
          'fixed inset-y-0 left-0 z-50 w-[280px] flex flex-col bg-paper-2 border-r border-rule transform transition-transform duration-200 ease-out',
          drawerOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        <div className="px-5 py-5 border-b border-rule flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-2.5">
            <LogoMark className="w-5 h-5 text-ink" />
            <span
              className="font-display text-[16px] text-ink tracking-tight"
              style={{ fontWeight: 500 }}
            >
              admin<span className="text-copper">.</span>
            </span>
          </Link>
          {/* Close button — mobile only */}
          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            aria-label="Close menu"
            className="lg:hidden h-8 w-8 inline-flex items-center justify-center rounded text-mute hover:text-ink"
          >
            <CloseIcon />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-5">
          <NavSection title="Overview">
            <NavItem href="/admin" pathname={pathname} exact>
              Dashboard
            </NavItem>
          </NavSection>

          <NavSection title="People">
            <NavItem href="/admin/users" pathname={pathname}>
              Users
            </NavItem>
            <NavItem href="/admin/payments" pathname={pathname}>
              Payments
            </NavItem>
            <NavItem href="/admin/messages" pathname={pathname}>
              Messages
            </NavItem>
          </NavSection>

          <NavSection title="Content">
            <NavItem href="/admin/content" pathname={pathname}>
              Content
            </NavItem>
          </NavSection>
        </nav>

        <div className="border-t border-rule px-3 py-3">
          <div className="px-3 py-2 mb-1">
            <div className="text-[12px] text-ink truncate" title={me.email}>
              {me.name}
            </div>
            <div className="text-[11px] text-mute truncate">{me.email}</div>
          </div>
          <Link
            href="/dashboard"
            className="block w-full px-3 py-2 text-[12.5px] text-ink-2 hover:text-ink hover:bg-paper rounded transition-colors"
          >
            ← Back to app
          </Link>
          <button
            type="button"
            onClick={async () => {
              await signOut();
              router.push('/');
            }}
            className="w-full text-left px-3 py-2 text-[12.5px] text-mute hover:text-wrong hover:bg-paper rounded transition-colors"
          >
            Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}

function NavSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="px-3 py-1.5 eyebrow text-[10px] text-mute">{title}</div>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function NavItem({
  href,
  pathname,
  exact,
  children,
}: {
  href: string;
  pathname: string;
  exact?: boolean;
  children: React.ReactNode;
}) {
  const active = exact ? pathname === href : pathname.startsWith(href);
  return (
    <Link
      href={href}
      className={cn(
        'block px-3 py-1.5 text-[13.5px] rounded transition-colors',
        active
          ? 'bg-apothecary text-paper'
          : 'text-ink-2 hover:text-ink hover:bg-paper',
      )}
    >
      {children}
    </Link>
  );
}

function HamburgerIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <path d="M2 5h14M2 9h14M2 13h14" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <path d="M3 3l8 8M11 3l-8 8" />
    </svg>
  );
}
