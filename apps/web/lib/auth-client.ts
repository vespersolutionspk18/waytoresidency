import { createAuthClient } from 'better-auth/react';
import { inferAdditionalFields } from 'better-auth/client/plugins';

/**
 * Resolve the public origin used by the auth client.
 *
 * In the browser, ALWAYS use window.location.origin. This guarantees the
 * fetch goes back to whatever hostname served the page (production alias,
 * preview deployment, or custom domain) so cookies stay first-party and
 * CORS is a non-issue.
 *
 * NEXT_PUBLIC_VERCEL_URL is the per-deployment hash URL (e.g.
 * `my-app-abc123-team.vercel.app`) — if we used that for client fetches
 * while the user is on the production alias `my-app.vercel.app`, every
 * request would be cross-origin and the browser would block it.
 *
 * The env-var fallbacks only matter at SSR / build time (no window).
 */
function resolveBaseUrl(): string {
  // 1. Browser: always trust the URL we were served from.
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }

  // 2. Explicit override (only honored during SSR / build).
  const candidate = process.env.NEXT_PUBLIC_APP_URL;
  if (isValidHttpUrl(candidate)) return candidate!.replace(/\/$/, '');

  // 3. Vercel's stable production alias (not the per-deployment hash URL).
  if (process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL}`;
  }

  // 4. Per-deployment URL (preview deployments).
  if (process.env.NEXT_PUBLIC_VERCEL_URL) {
    return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`;
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
