import type { NextRequest } from 'next/server';
import { randomUUID } from 'node:crypto';
import { db } from '@/lib/db';
import { transaction } from '@/lib/db/schema';
import { requireUser } from '@/lib/auth-helpers';
import { handle, json, error, readJson } from '@/lib/api-helpers';
import { getOrCreateDefaultPlan } from '@/lib/billing-helpers';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  return handle(async () => {
    const me = await requireUser(request);
    const body = await readJson<{
      items?: {
        slug: string;
        title: string;
        priceMinor: number;
        qty: number;
      }[];
      shipping?: Record<string, unknown>;
      paymentMethod?: 'hblpay' | 'cod';
    }>(request);

    if (!Array.isArray(body.items) || body.items.length === 0) {
      return error('Cart is empty.', 400);
    }
    const payment = body.paymentMethod === 'cod' ? 'cod' : 'hblpay';

    let totalMinor = 0;
    const cleaned = body.items.map((it) => {
      const qty = Math.max(1, Math.min(99, Math.floor(Number(it.qty) || 1)));
      const priceMinor = Math.max(0, Math.floor(Number(it.priceMinor) || 0));
      totalMinor += qty * priceMinor;
      return {
        slug: String(it.slug),
        title: String(it.title),
        qty,
        priceMinor,
      };
    });

    if (totalMinor <= 0) {
      return error('Order total must be positive.', 400);
    }

    // Use the default plan as a placeholder reference (plan_id is NOT NULL).
    const planRow = await getOrCreateDefaultPlan();
    const orderId = `WTR-BK-${Date.now().toString(36).toUpperCase()}-${randomUUID().slice(0, 6).toUpperCase()}`;
    const status: 'pending' | 'under_review' =
      payment === 'cod' ? 'under_review' : 'pending';

    const [tx] = await db
      .insert(transaction)
      .values({
        userId: me.id,
        planId: planRow.id,
        amountMinorUnits: totalMinor,
        currency: 'PKR',
        status,
        provider: 'hblpay',
        providerOrderId: orderId,
        providerResponseCode: payment === 'cod' ? 'COD' : null,
        providerResponseMessage:
          payment === 'cod'
            ? 'Cash on delivery, awaiting courier confirmation.'
            : null,
        providerPayload: JSON.stringify({
          kind: 'book_order',
          items: cleaned,
          shipping: body.shipping ?? null,
          paymentMethod: payment,
        }),
      })
      .returning();

    return json(
      {
        orderId: tx!.providerOrderId,
        transactionId: tx!.id,
        status: tx!.status,
        paymentMethod: payment,
        amountMinorUnits: totalMinor,
      },
      { status: 201 },
    );
  });
}
