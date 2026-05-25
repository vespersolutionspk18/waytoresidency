'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useSession, signOut } from '@/lib/auth-client';
import { Brand } from '@/components/brand/Logo';
import { CartIndicator } from '@/components/cart/CartIndicator';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/services', label: 'Services' },
  { href: '/books', label: 'Books' },
  { href: '/dr-rashid', label: 'Dr. Rashid' },
  { href: '/contact', label: 'Contact' },
];

export function MarketingNav() {
  const { data, isPending } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);
  const [open, setOpen] = useState(false);

  return (
    <header className="border-b border-rule bg-paper relative z-20">
      <div className="w-full px-6 md:px-12 lg:px-16 h-[68px] flex items-center justify-between gap-8">
        <Link href="/" className="shrink-0">
          <Brand size="md" />
        </Link>

        <nav className="hidden lg:flex items-center gap-7 text-[13.5px]">
          {NAV.map((item) => {
            const active =
              item.href === '/'
                ? pathname === '/'
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'transition-colors',
                  active ? 'text-ink font-medium' : 'text-ink-2 hover:text-ink',
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3 shrink-0">
          <CartIndicator className="hidden md:inline-flex" />
          {isPending ? (
            <span className="text-mute text-[12.5px]">...</span>
          ) : data?.user ? (
            (() => {
              const isAdmin =
                (data.user as { isAdmin?: boolean }).isAdmin === true;
              const homeHref = isAdmin ? '/admin' : '/dashboard';
              const homeLabel = isAdmin ? 'Admin' : 'Dashboard';
              return (
                <>
                  <Link
                    href={isAdmin ? '/admin' : '/account'}
                    className="hidden md:inline-flex items-center gap-2 h-9 px-3 text-[12.5px] text-ink-2 hover:text-ink hover:bg-paper-2 rounded-md"
                  >
                    <span className="w-6 h-6 rounded-full bg-apothecary text-paper inline-flex items-center justify-center text-[11px] font-medium">
                      {(data.user.name ?? data.user.email)
                        .split(' ')
                        .map((s) => s[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase()}
                    </span>
                    <span className="serif-italic">
                      {data.user.name?.split(' ')[0] ?? data.user.email}
                    </span>
                    {isAdmin && (
                      <span className="text-[9.5px] uppercase tracking-wider text-copper">
                        admin
                      </span>
                    )}
                  </Link>
                  <Link
                    href={homeHref}
                    className="h-9 inline-flex items-center px-4 text-[13px] font-medium tracking-tight rounded-md bg-apothecary text-paper border border-apothecary-2 hover:bg-apothecary-2 transition-colors"
                  >
                    {homeLabel}
                  </Link>
                </>
              );
            })()
          ) : (
            <>
              <Link
                href="/sign-in"
                className="hidden md:inline text-[13.5px] text-ink hover:text-apothecary font-medium"
              >
                Sign in
              </Link>
              <Link
                href="/sign-up"
                className="h-9 inline-flex items-center px-4 text-[13px] font-medium tracking-tight rounded-md bg-apothecary text-paper border border-apothecary-2 hover:bg-apothecary-2 transition-colors"
              >
                Start free
              </Link>
            </>
          )}
          <button
            type="button"
            className="lg:hidden inline-flex items-center justify-center w-9 h-9 rounded-md border border-rule-2 text-ink-2 hover:text-ink hover:border-mute"
            aria-label="Open menu"
            onClick={() => setOpen((o) => !o)}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
              <path d="M2 4h12M2 8h12M2 12h12" />
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <div className="lg:hidden border-t border-rule bg-paper">
          <nav className="px-6 py-3 flex flex-col gap-1">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="py-2 text-[14px] text-ink-2 hover:text-ink"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}

export function MarketingFooter() {
  return (
    <footer className="border-t border-rule bg-paper-2">
      <div className="w-full px-6 md:px-12 lg:px-16 py-12 lg:py-16 grid grid-cols-1 md:grid-cols-12 gap-10">
        <div className="md:col-span-4">
          <Brand size="md" />
          <p className="mt-4 text-[14px] text-ink-2 leading-[1.65] max-w-[40ch]">
            A learning home for medical graduates preparing for the FCPS Part 1
            and the Aga Khan University Residency and Internship entrance
            exams. Founded by Dr. Rashid Mahmood. Based in Bahawalpur, serving
            students all across Pakistan.
          </p>
        </div>

        <div className="md:col-span-2">
          <div className="eyebrow mb-3">Explore</div>
          <ul className="space-y-1.5 text-[13.5px]">
            <FooterLink href="/">Home</FooterLink>
            <FooterLink href="/about">About</FooterLink>
            <FooterLink href="/services">Services</FooterLink>
            <FooterLink href="/books">Books</FooterLink>
            <FooterLink href="/dr-rashid">Dr. Rashid</FooterLink>
            <FooterLink href="/contact">Contact</FooterLink>
          </ul>
        </div>

        <div className="md:col-span-3">
          <div className="eyebrow mb-3">Get in touch</div>
          <ul className="space-y-2.5 text-[13.5px] text-ink-2">
            <li>
              <span className="text-mute text-[11.5px] uppercase tracking-wider block">Address</span>
              Street 2, Cheema Town Phase 2, Bahawalpur, Pakistan
            </li>
            <li>
              <span className="text-mute text-[11.5px] uppercase tracking-wider block">Email</span>
              <a href="mailto:dr.rashid157@gmail.com" className="hover:text-ink">
                dr.rashid157@gmail.com
              </a>
            </li>
            <li>
              <span className="text-mute text-[11.5px] uppercase tracking-wider block">Phone</span>
              <a href="tel:+923087747686" className="hover:text-ink font-mono">
                +92 308 7747686
              </a>
            </li>
          </ul>
        </div>

        <div className="md:col-span-3">
          <div className="eyebrow mb-3">Follow along</div>
          <ul className="space-y-1.5 text-[13.5px]">
            <FooterLink href="https://www.facebook.com/" external>Facebook</FooterLink>
            <FooterLink href="https://www.instagram.com/" external>Instagram</FooterLink>
            <FooterLink href="https://www.youtube.com/" external>YouTube</FooterLink>
            <FooterLink href="https://wa.me/923087747686" external>WhatsApp</FooterLink>
            <FooterLink href="mailto:dr.rashid157@gmail.com" external>Email</FooterLink>
          </ul>
        </div>
      </div>
      <div className="w-full px-6 md:px-12 lg:px-16 py-5 border-t border-rule text-[12px] text-mute flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <span>© {new Date().getFullYear()} waytoresidency.com. All rights reserved.</span>
        <span className="serif-italic">A reading room for the medical mind.</span>
      </div>
    </footer>
  );
}

function FooterLink({
  href,
  external,
  children,
}: {
  href: string;
  external?: boolean;
  children: React.ReactNode;
}) {
  if (external) {
    return (
      <li>
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-ink-2 hover:text-ink"
        >
          {children}
        </a>
      </li>
    );
  }
  return (
    <li>
      <Link href={href} className="text-ink-2 hover:text-ink">
        {children}
      </Link>
    </li>
  );
}
