import { createAuthClient } from 'better-auth/react';
import { inferAdditionalFields } from 'better-auth/client/plugins';

/**
 * Resolve the public origin used by the auth client.
 *
 * Priority:
 *   1. NEXT_PUBLIC_APP_URL (if a valid http(s) URL)
 *   2. NEXT_PUBLIC_VERCEL_URL (Vercel auto-injects this on the client)
 *   3. window.location.origin (browser only — covers preview URLs etc.)
 *   4. http://localhost:3000 (build-time / dev fallback)
 *
 * The validity check tolerates users pasting placeholder text into the
 * Vercel env-var UI without crashing the build.
 */
function resolveBaseUrl(): string {
  const candidate = process.env.NEXT_PUBLIC_APP_URL;
  if (isValidHttpUrl(candidate)) return candidate!.replace(/\/$/, '');

  if (process.env.NEXT_PUBLIC_VERCEL_URL) {
    return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`;
  }

  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }

  return 'http://localhost:3000';
}

function isValidHttpUrl(v: string | undefined): boolean {
  if (!v) return false;
  try {
    const u = new URL(v.trim());
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

export const authClient = createAuthClient({
  baseURL: `${resolveBaseUrl()}/api/auth`,
  plugins: [
    inferAdditionalFields({
      user: {
        isAdmin: {
          type: 'boolean',
          defaultValue: false,
        },
      },
    }),
  ],
});

export const { useSession, signIn, signUp, signOut } = authClient;

/** Where to land a user right after auth (post sign-in / sign-up). */
export async function postAuthRedirectPath(fallback: string = '/dashboard'): Promise<string> {
  try {
    const res = await authClient.getSession();
    const isAdmin = (res?.data?.user as { isAdmin?: boolean } | undefined)?.isAdmin;
    if (isAdmin) return '/admin';
  } catch {
    /* noop */
  }
  return fallback;
}
