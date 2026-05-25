import type { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { handle, json, error } from '@/lib/api-helpers';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return handle(async () => {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) return error('unauthenticated', 401);
    return json(session);
  });
}
