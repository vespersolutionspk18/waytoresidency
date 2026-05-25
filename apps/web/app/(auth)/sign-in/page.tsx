'use client';

import { Suspense, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn, postAuthRedirectPath } from '@/lib/auth-client';
import { TextField } from '@/components/ui/TextField';
import { Button } from '@/components/ui/Button';

export default function SignInPage() {
  return (
    <Suspense fallback={<SignInFallback />}>
      <SignInForm />
    </Suspense>
  );
}

function SignInFallback() {
  return (
    <div className="rise">
      <p className="serif-italic text-mute">Opening the reading room…</p>
    </div>
  );
}

function SignInForm() {
  const router = useRouter();
  const search = useSearchParams();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);

    const form = new FormData(e.currentTarget);
    const email = String(form.get('email') ?? '').trim();
    const password = String(form.get('password') ?? '');

    const { error: authError } = await signIn.email({ email, password });

    if (authError) {
      setError(authError.message ?? 'Invalid email or password.');
      setPending(false);
      return;
    }

    const fallback = search.get('redirect') ?? '/dashboard';
    // Admins always land in /admin, regardless of any explicit redirect target.
    const dest = await postAuthRedirectPath(fallback);
    router.push(dest);
    router.refresh();
  }

  return (
    <div className="rise">
      <div className="flex items-baseline gap-3 mb-1">
        <span className="section-numeral">§ Return</span>
        <span className="eyebrow">Sign in</span>
      </div>
      <h1
        className="font-display text-[34px] leading-[1.08] tracking-[-0.015em] text-ink"
        style={{ fontWeight: 430 }}
      >
        Welcome <span className="serif-italic text-apothecary">back</span>.
      </h1>
      <p className="mt-3 text-[14.5px] text-mute leading-[1.55]">
        Pick up where you left off, your in-progress sessions are waiting.
      </p>

      <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-5">
        <TextField
          label="Email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@hospital.org"
        />
        <TextField
          label="Password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          placeholder="Your passphrase"
        />

        {error && (
          <div className="border border-wrong/40 bg-[#f5e7e4] text-wrong text-[13px] rounded-md px-3.5 py-2.5">
            {error}
          </div>
        )}

        <Button type="submit" size="lg" loading={pending} className="mt-1">
          Continue
        </Button>
      </form>

      <div className="mt-7 pt-6 border-t border-rule flex items-center justify-between text-[13px]">
        <span className="text-mute">New here?</span>
        <Link
          href={`/sign-up${search.toString() ? `?${search.toString()}` : ''}`}
          className="text-ink font-medium hover:text-apothecary"
        >
          Create an account →
        </Link>
      </div>
    </div>
  );
}
