import type { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { contactSubmission } from '@/lib/db/schema';
import { handle, json, error, readJson } from '@/lib/api-helpers';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  return handle(async () => {
    const b = await readJson<{
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: string;
      message?: string;
    }>(request);
    const firstName = (b.firstName ?? '').trim();
    const email = (b.email ?? '').trim();
    const message = (b.message ?? '').trim();
    if (!firstName || !email || !message) {
      return error('First name, email, and message are required.', 400);
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return error('Please use a valid email address.', 400);
    }
    const [row] = await db
      .insert(contactSubmission)
      .values({
        firstName,
        lastName: (b.lastName ?? '').trim() || null,
        email,
        phone: (b.phone ?? '').trim() || null,
        message,
      })
      .returning({ id: contactSubmission.id });
    return json({ ack: true, id: row?.id }, { status: 201 });
  });
}
