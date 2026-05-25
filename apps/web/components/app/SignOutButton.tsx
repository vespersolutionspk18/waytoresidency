'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { signOut } from '@/lib/auth-client';

export function SignOutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  return (
    <button
      type="button"
      disabled={pending}
      onClick={async () => {
        setPending(true);
        await signOut();
        router.push('/');
        router.refresh();
      }}
      className="h-9 inline-flex items-center px-3.5 text-[13px] font-medium tracking-tight rounded-md border border-rule-2 text-ink-2 hover:border-mute hover:text-ink hover:bg-paper-2 transition-colors disabled:opacity-50 focus-ring"
    >
      {pending ? 'Signing out…' : 'Sign out'}
    </button>
  );
}
