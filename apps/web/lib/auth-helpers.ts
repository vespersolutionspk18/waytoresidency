import { eq } from 'drizzle-orm';
import { auth } from './auth';
import { db } from './db';
import { user } from './db/schema';

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
};

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

/**
 * Returns the signed-in user or throws HttpError(401).
 * Use inside route handlers — the throw is caught by `withErrorHandling`.
 */
export async function requireUser(request: Request): Promise<SessionUser> {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    throw new HttpError(401, 'unauthenticated');
  }
  const u = session.user as {
    id: string;
    email: string;
    name: string;
    isAdmin?: boolean;
  };
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    isAdmin: u.isAdmin ?? false,
  };
}

/**
 * Returns the signed-in user only if they are an admin.
 * Re-checks the DB (not just the session token) so admin revocation
 * takes effect immediately.
 */
export async function requireAdmin(request: Request): Promise<SessionUser> {
  const me = await requireUser(request);
  const [row] = await db
    .select({ isAdmin: user.isAdmin })
    .from(user)
    .where(eq(user.id, me.id));
  if (!row?.isAdmin) {
    throw new HttpError(403, 'admin only');
  }
  return { ...me, isAdmin: true };
}

/** Returns the user or null (no throw). For optional auth endpoints. */
export async function getOptionalUser(
  request: Request,
): Promise<SessionUser | null> {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) return null;
  const u = session.user as {
    id: string;
    email: string;
    name: string;
    isAdmin?: boolean;
  };
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    isAdmin: u.isAdmin ?? false,
  };
}
