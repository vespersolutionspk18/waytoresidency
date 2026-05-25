import type { NextRequest } from 'next/server';
import { desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { subscription } from '@/lib/db/schema';
import { requireUser } from '@/lib/auth-helpers';
import { handle, json } from '@/lib/api-helpers';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return handle(async () => {
    const me = await requireUser(request);
    const rows = await db
      .select()
      .from(subscription)
      .where(eq(subscription.userId, me.id))
      .orderBy(desc(subscription.createdAt))
      .limit(1);
    return json({ subscription: rows[0] ?? null });
  });
}
