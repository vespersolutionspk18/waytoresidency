import type { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { user } from '@/lib/db/schema';
import { requireAdmin } from '@/lib/auth-helpers';
import { handle, json } from '@/lib/api-helpers';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return handle(async () => {
    const me = await requireAdmin(request);
    const [u] = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
      })
      .from(user)
      .where(eq(user.id, me.id));
    return json({ user: u });
  });
}
