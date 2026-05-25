import type { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { subject } from '@/lib/db/schema';
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
    const b = await readJson<Record<string, unknown>>(request);
    const patch: Record<string, unknown> = {};
    for (const k of ['courseId', 'slug', 'name', 'description', 'sortOrder']) {
      if (k in b) patch[k] = b[k];
    }
    if (!Object.keys(patch).length) {
      return error('no valid fields', 400);
    }
    await db.update(subject).set(patch).where(eq(subject.id, id));
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
    await db.delete(subject).where(eq(subject.id, id));
    return json({ ack: true });
  });
}
