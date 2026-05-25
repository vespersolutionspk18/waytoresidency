import type { NextRequest } from 'next/server';
import { desc } from 'drizzle-orm';
import { db } from '@/lib/db';
import { contactSubmission } from '@/lib/db/schema';
import { requireAdmin } from '@/lib/auth-helpers';
import { handle, json } from '@/lib/api-helpers';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return handle(async () => {
    await requireAdmin(request);
    const rows = await db
      .select()
      .from(contactSubmission)
      .orderBy(desc(contactSubmission.createdAt))
      .limit(500);
    return json({ submissions: rows });
  });
}
