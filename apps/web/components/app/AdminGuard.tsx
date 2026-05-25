'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/lib/auth-client';

/**
 * Wraps any client-side area where admins should not be allowed.
 * If the signed-in user is an admin, render nothing and replace the route with /admin.
 * If the session is still loading, render a quiet placeholder so we don't flash content.
 */
export function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data, isPending } = useSession();
  const isAdmin =
    (data?.user as { isAdmin?: boolean } | undefined)?.isAdmin === true;

  useEffect(() => {
    if (!isPending && isAdmin) {
      router.replace('/admin');
    }
  }, [isPending, isAdmin, router]);

  if (isPending) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="serif-italic text-mute text-[14.5px]">Loading…</p>
      </div>
    );
  }

  if (isAdmin) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <span className="section-numeral">§ Admin</span>
          <p className="mt-2 serif-italic text-mute text-[14.5px]">
            Routing you to the admin dashboard…
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
