import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { nextCookies } from 'better-auth/next-js';
import { db } from './db';
import * as schema from './db/schema/auth';

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  user: {
    additionalFields: {
      isAdmin: {
        type: 'boolean',
        required: false,
        defaultValue: false,
        input: false, // never settable from the client
      },
    },
  },
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    requireEmailVerification: false,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
    // 30-second cache cuts ~500ms off every authed request (skips the DB
    // session lookup). Tradeoff: changes to a user's isAdmin field take up
    // to 30s to take effect across active sessions. For prod we accept this.
    cookieCache: {
      enabled: true,
      maxAge: 30,
    },
  },
  trustedOrigins: [resolveAppUrl()],
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: resolveAppUrl(),
  // Required for server actions to write Set-Cookie via next/headers.
  plugins: [nextCookies()],
});

export type Auth = typeof auth;

/**
 * Resolve the public base URL for this deployment.
 *
 * Priority:
 *   1. BETTER_AUTH_URL / NEXT_PUBLIC_APP_URL (if a valid URL)
 *   2. VERCEL_PROJECT_PRODUCTION_URL (Vercel auto-injects this — stable prod domain)
 *   3. VERCEL_URL (Vercel auto-injects this — per-deployment / preview URL)
 *   4. http://localhost:3000 (local dev fallback)
 *
 * The validity check lets users paste anything into Vercel's UI without
 * crashing the build — invalid entries fall through to the Vercel-injected vars.
 */
function resolveAppUrl(): string {
  const candidates = [
    process.env.BETTER_AUTH_URL,
    process.env.NEXT_PUBLIC_APP_URL,
  ];
  for (const c of candidates) {
    if (isValidHttpUrl(c)) return c!.replace(/\/$/, '');
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
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
