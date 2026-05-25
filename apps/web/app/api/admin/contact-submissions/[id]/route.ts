import type { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { contactSubmission } from '@/lib/db/schema';
import { requireAdmin } from '@/lib/auth-helpers';
import { handle, json, error, readJson } from '@/lib/api-helpers';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return handle(async () => {
    await requireAdmin(request);
    const { id } = await params;
    const b = await readJson<{ handled?: boolean }>(request);
    if (typeof b.handled !== 'boolean') {
      return error('handled (boolean) required', 400);
    }
    await db
      .update(contactSubmission)
      .set({ handled: b.handled, updatedAt: new Date() })
      .where(eq(contactSubmission.id, id));
    return json({ ack: true });
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return handle(async () => {
    await requireAdmin(request);
    const { id } = await params;
    await db.delete(contactSubmission).where(eq(contactSubmission.id, id));
    return json({ ack: true });
  });
}
