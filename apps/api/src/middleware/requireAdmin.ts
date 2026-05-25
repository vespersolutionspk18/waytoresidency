import type { Response, NextFunction } from 'express';
import { eq } from 'drizzle-orm';
import { fromNodeHeaders } from 'better-auth/node';
import { auth } from '../auth';
import { db } from '../db';
import { user } from '../db/schema';
import type { AuthedRequest } from './requireAuth';

export async function requireAdmin(
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
) {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });
  if (!session?.user) {
    res.status(401).json({ error: 'unauthenticated' });
    return;
  }
  const [row] = await db
    .select({ isAdmin: user.isAdmin })
    .from(user)
    .where(eq(user.id, session.user.id));
  if (!row?.isAdmin) {
    res.status(403).json({ error: 'admin only' });
    return;
  }
  req.userId = session.user.id;
  next();
}
