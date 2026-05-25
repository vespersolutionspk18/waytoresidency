import { createAuthClient } from 'better-auth/react';
import { inferAdditionalFields } from 'better-auth/client/plugins';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

export const authClient = createAuthClient({
  baseURL: `${APP_URL}/api/auth`,
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
