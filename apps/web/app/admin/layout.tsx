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

  useEffect(() => {
    adminApi
      .whoami()
      .then((r) => setMe({ name: r.user.name, email: r.user.email }))
      .catch((e: Error & { status?: number }) => {
        if (e.status === 401) router.replace('/sign-in?redirect=/admin');
        else setDenied(true);
      });
  }, [router]);

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
    <div className="min-h-screen flex bg-paper">
      <aside className="w-[240px] shrink-0 border-r border-rule bg-paper-2 flex flex-col">
        <Link
          href="/admin"
          className="px-5 py-5 border-b border-rule flex items-center gap-2.5"
        >
          <LogoMark className="w-5 h-5 text-ink" />
          <span
            className="font-display text-[16px] text-ink tracking-tight"
            style={{ fontWeight: 500 }}
          >
            admin<span className="text-copper">.</span>
          </span>
        </Link>

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
