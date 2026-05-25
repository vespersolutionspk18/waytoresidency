'use client';

import { Suspense, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signUp, postAuthRedirectPath } from '@/lib/auth-client';
import { TextField } from '@/components/ui/TextField';
import { Button } from '@/components/ui/Button';

export default function SignUpPage() {
  return (
    <Suspense fallback={<SignUpFallback />}>
      <SignUpForm />
    </Suspense>
  );
}

function SignUpFallback() {
  return (
    <div className="rise">
      <p className="serif-italic text-mute">Preparing your reading room…</p>
    </div>
  );
}

function SignUpForm() {
  const router = useRouter();
  const search = useSearchParams();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);

    const form = new FormData(e.currentTarget);
    const name = String(form.get('name') ?? '').trim();
    const email = String(form.get('email') ?? '').trim();
    const password = String(form.get('password') ?? '');

    const { error: authError } = await signUp.email({
      name,
      email,
      password,
    });

    if (authError) {
      setError(authError.message ?? 'Could not create your account.');
      setPending(false);
      return;
    }

    const fallback = search.get('redirect') ?? '/billing/checkout';
    // Admins always land in /admin, regardless of any explicit redirect target.
    const dest = await postAuthRedirectPath(fallback);
    router.push(dest);
    router.refresh();
  }

  return (
    <div className="rise">
      <div className="flex items-baseline gap-3 mb-1">
        <span className="section-numeral">§ Begin</span>
        <span className="eyebrow">Create account</span>
      </div>
      <h1
        className="font-display text-[34px] leading-[1.08] tracking-[-0.015em] text-ink"
        style={{ fontWeight: 430 }}
      >
        Set up your <span className="serif-italic text-apothecary">reading room</span>.
      </h1>
      <p className="mt-3 text-[14.5px] text-mute leading-[1.55]">
        One account, both modes, your full attempt history. No tiers, no
        upsells, no question-bank fragments.
      </p>

      <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-5">
        <TextField
          label="Your name"
          name="name"
          required
          autoComplete="name"
          placeholder="Dr. Jane Khan"
        />
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
          minLength={8}
          autoComplete="new-password"
          placeholder="At least 8 characters"
          hint="Use a unique passphrase you don't reuse elsewhere."
        />

        {error && (
          <div className="border border-wrong/40 bg-[#f5e7e4] text-wrong text-[13px] rounded-md px-3.5 py-2.5">
            {error}
          </div>
        )}

        <Button type="submit" size="lg" loading={pending} className="mt-1">
          Create account
        </Button>
      </form>

      <div className="mt-7 pt-6 border-t border-rule flex items-center justify-between text-[13px]">
        <span className="text-mute">Already enrolled?</span>
        <Link
          href={`/sign-in${search.toString() ? `?${search.toString()}` : ''}`}
          className="text-ink font-medium hover:text-apothecary"
        >
          Sign in →
        </Link>
      </div>
    </div>
  );
}
