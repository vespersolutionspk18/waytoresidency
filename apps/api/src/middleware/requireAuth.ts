import type { Request, Response, NextFunction } from 'express';
import { fromNodeHeaders } from 'better-auth/node';
import { auth } from '../auth';

// Express 5's default ParamsDictionary types each value as `string | string[]`
// (to accommodate wildcard `*id` captures we don't use). We narrow it back to
// plain strings so handlers can pass `req.params.id` straight into Drizzle / SQL.
export interface AuthedRequest extends Request<Record<string, string>> {
  userId?: string;
}

export async function requireAuth(
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
  req.userId = session.user.id;
  next();
}
