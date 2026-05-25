import type { NextRequest } from 'next/server';
import { and, desc, eq } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { db } from '@/lib/db';
import { subscription, transaction } from '@/lib/db/schema';
import { requireUser } from '@/lib/auth-helpers';
import { handle, json, error, readJson } from '@/lib/api-helpers';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  return handle(async () => {
    const me = await requireUser(request);
    const body = await readJson<{
      orderId?: string;
      outcome?: string;
      method?: string;
    }>(request);

    if (!body.orderId || !body.outcome) {
      return error('orderId and outcome are required', 400);
    }
    const outcome =
      body.outcome === 'success'
        ? 'success'
        : body.outcome === 'fail'
          ? 'fail'
          : body.outcome === 'under_review'
            ? 'under_review'
            : null;
    if (!outcome) return error('invalid outcome', 400);

    const [tx] = await db
      .select()
      .from(transaction)
      .where(
        and(
          eq(transaction.providerOrderId, body.orderId),
          eq(transaction.userId, me.id),
        ),
      );
    if (!tx) return error('transaction not found', 404);
    if (tx.status !== 'pending') {
      return error(`transaction is already ${tx.status}`, 409);
    }

    const sessionId = `SESS-${randomUUID().replace(/-/g, '').slice(0, 20).toUpperCase()}`;
    const method = body.method ?? 'card';

    let status: 'succeeded' | 'failed' | 'under_review';
    let responseCode: string;
    let responseMessage: string;
    if (outcome === 'success') {
      status = 'succeeded';
      responseCode = '100';
      responseMessage =
        'Dear Customer, Thank you for your payment, Your transaction has been received successfully.';
    } else if (outcome === 'under_review') {
      status = 'under_review';
      responseCode = '481';
      responseMessage =
        'Dear Customer, Your transaction has been received and under review, our representative will contact you shortly.';
    } else {
      status = 'failed';
      responseCode = '230';
      responseMessage =
        'Dear Customer, Your transaction has been declined by your issuing bank, Kindly contact your issuing bank for further details.';
    }

    await db
      .update(transaction)
      .set({
        status,
        providerSessionId: sessionId,
        providerResponseCode: responseCode,
        providerResponseMessage: responseMessage,
        providerPayload: JSON.stringify({
          mocked: true,
          method,
          sessionId,
          completedAt: new Date().toISOString(),
        }),
        updatedAt: new Date(),
      })
      .where(eq(transaction.id, tx.id));

    // On success, create/extend a subscription
    let subscriptionId: string | null = null;
    if (status === 'succeeded') {
      const [existingSub] = await db
        .select()
        .from(subscription)
        .where(eq(subscription.userId, me.id))
        .orderBy(desc(subscription.createdAt))
        .limit(1);

      const now = new Date();
      const periodEnd = new Date(now);
      periodEnd.setDate(periodEnd.getDate() + 30);

      if (
        existingSub &&
        ['trialing', 'active', 'past_due'].includes(existingSub.status)
      ) {
        const baseEnd = new Date(existingSub.currentPeriodEnd);
        const newEnd = baseEnd > now ? baseEnd : now;
        newEnd.setDate(newEnd.getDate() + 30);
        await db
          .update(subscription)
          .set({
            status: 'active',
            currentPeriodEnd: newEnd,
            updatedAt: now,
          })
          .where(eq(subscription.id, existingSub.id));
        subscriptionId = existingSub.id;
      } else {
        const [created] = await db
          .insert(subscription)
          .values({
            userId: me.id,
            planId: tx.planId,
            status: 'active',
            currentPeriodStart: now,
            currentPeriodEnd: periodEnd,
            provider: 'hblpay',
            providerSubscriptionId: sessionId,
          })
          .returning();
        subscriptionId = created!.id;
      }

      await db
        .update(transaction)
        .set({ subscriptionId })
        .where(eq(transaction.id, tx.id));
    }

    return json({
      ack: true,
      transaction: {
        orderId: tx.providerOrderId,
        status,
        responseCode,
        responseMessage,
      },
      subscriptionId,
    });
  });
}
