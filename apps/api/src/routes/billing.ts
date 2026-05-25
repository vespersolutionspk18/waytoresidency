import { Router, type Response } from 'express';
import { and, desc, eq } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { db } from '../db';
import { plan, subscription, transaction } from '../db/schema';
import { requireAuth, type AuthedRequest } from '../middleware/requireAuth';

export const billingRouter = Router();
billingRouter.use(requireAuth);

const DEFAULT_PLAN_SLUG = 'monthly-2026';

/** Lazily creates the default monthly plan if it doesn't exist. */
async function getOrCreateDefaultPlan() {
  const existing = await db
    .select()
    .from(plan)
    .where(eq(plan.slug, DEFAULT_PLAN_SLUG))
    .limit(1);
  if (existing.length > 0) return existing[0]!;
  const [created] = await db
    .insert(plan)
    .values({
      slug: DEFAULT_PLAN_SLUG,
      name: 'Way to Residency — Monthly',
      description:
        'Full access to the question bank, both modes, attempt history, and every explanation.',
      priceMinorUnits: 250000, // PKR 2,500.00 in paisa
      currency: 'PKR',
      interval: 'month',
      features: JSON.stringify([
        'Unlimited tutor sessions',
        'Unlimited timed quiz sessions',
        'Full attempt history & analytics',
        'Every explanation, every distractor',
        'Flag-for-review across sessions',
      ]),
      isActive: true,
    })
    .returning();
  return created!;
}

/* ============================================================
 * GET /api/billing/plan  — fetch active plan (for the order summary page)
 * ============================================================ */
billingRouter.get('/plan', async (_req: AuthedRequest, res: Response) => {
  const p = await getOrCreateDefaultPlan();
  res.json({
    plan: {
      id: p.id,
      slug: p.slug,
      name: p.name,
      description: p.description,
      priceMinorUnits: p.priceMinorUnits,
      currency: p.currency,
      interval: p.interval,
      features: parseFeatures(p.features),
    },
  });
});

/* ============================================================
 * GET /api/billing/subscription  — current user's active subscription
 * ============================================================ */
billingRouter.get(
  '/subscription',
  async (req: AuthedRequest, res: Response) => {
    const userId = req.userId!;
    const rows = await db
      .select()
      .from(subscription)
      .where(eq(subscription.userId, userId))
      .orderBy(desc(subscription.createdAt))
      .limit(1);
    res.json({ subscription: rows[0] ?? null });
  },
);

/* ============================================================
 * POST /api/billing/checkout
 * body: { planSlug? }
 * Creates a pending transaction and returns the orderId for the hosted page.
 * ============================================================ */
billingRouter.post('/checkout', async (req: AuthedRequest, res: Response) => {
  const userId = req.userId!;
  const body = req.body as { planSlug?: string };

  const slug = body.planSlug ?? DEFAULT_PLAN_SLUG;
  let [chosen] = await db.select().from(plan).where(eq(plan.slug, slug));
  if (!chosen) chosen = await getOrCreateDefaultPlan();

  const orderId = `WTR-${Date.now().toString(36).toUpperCase()}-${randomUUID().slice(0, 8).toUpperCase()}`;

  const [tx] = await db
    .insert(transaction)
    .values({
      userId,
      planId: chosen.id,
      amountMinorUnits: chosen.priceMinorUnits,
      currency: chosen.currency,
      status: 'pending',
      provider: 'hblpay',
      providerOrderId: orderId,
    })
    .returning();

  res.status(201).json({
    transaction: {
      id: tx!.id,
      orderId,
      amountMinorUnits: tx!.amountMinorUnits,
      currency: tx!.currency,
      status: tx!.status,
    },
    plan: {
      slug: chosen.slug,
      name: chosen.name,
      priceMinorUnits: chosen.priceMinorUnits,
      currency: chosen.currency,
      interval: chosen.interval,
      features: parseFeatures(chosen.features),
    },
  });
});

/* ============================================================
 * GET /api/billing/transactions/:orderId  — for the hosted page and return page
 * ============================================================ */
billingRouter.get(
  '/transactions/:orderId',
  async (req: AuthedRequest, res: Response) => {
    const userId = req.userId!;
    const orderId = req.params.orderId!;
    const [tx] = await db
      .select()
      .from(transaction)
      .where(
        and(
          eq(transaction.providerOrderId, orderId),
          eq(transaction.userId, userId),
        ),
      );
    if (!tx) {
      res.status(404).json({ error: 'transaction not found' });
      return;
    }
    const [p] = await db.select().from(plan).where(eq(plan.id, tx.planId));
    res.json({
      transaction: {
        id: tx.id,
        orderId: tx.providerOrderId,
        amountMinorUnits: tx.amountMinorUnits,
        currency: tx.currency,
        status: tx.status,
        responseCode: tx.providerResponseCode,
        responseMessage: tx.providerResponseMessage,
        createdAt: tx.createdAt,
        updatedAt: tx.updatedAt,
      },
      plan: p
        ? {
            slug: p.slug,
            name: p.name,
            priceMinorUnits: p.priceMinorUnits,
            currency: p.currency,
            interval: p.interval,
          }
        : null,
    });
  },
);

/* ============================================================
 * POST /api/billing/cart-checkout
 * body: { items: [{ slug, title, priceMinor, qty }], shipping?: {...}, paymentMethod: 'hblpay' | 'cod' }
 * Creates a one-off book-order transaction (no subscription).
 * For 'cod' it marks the transaction as 'under_review' (we follow up by phone).
 * For 'hblpay' it leaves the transaction 'pending' so the next step can hit the hosted page.
 * ============================================================ */
billingRouter.post('/cart-checkout', async (req: AuthedRequest, res: Response) => {
  const userId = req.userId!;
  const body = req.body as {
    items?: { slug: string; title: string; priceMinor: number; qty: number }[];
    shipping?: Record<string, unknown>;
    paymentMethod?: 'hblpay' | 'cod';
  };
  if (!Array.isArray(body.items) || body.items.length === 0) {
    res.status(400).json({ error: 'Cart is empty.' });
    return;
  }
  const payment = body.paymentMethod === 'cod' ? 'cod' : 'hblpay';

  let totalMinor = 0;
  const cleaned = body.items.map((it) => {
    const qty = Math.max(1, Math.min(99, Math.floor(Number(it.qty) || 1)));
    const priceMinor = Math.max(0, Math.floor(Number(it.priceMinor) || 0));
    totalMinor += qty * priceMinor;
    return { slug: String(it.slug), title: String(it.title), qty, priceMinor };
  });

  if (totalMinor <= 0) {
    res.status(400).json({ error: 'Order total must be positive.' });
    return;
  }

  // Use the default plan as a placeholder reference (schema requires plan_id NOT NULL).
  const plan = await getOrCreateDefaultPlan();

  const orderId = `WTR-BK-${Date.now().toString(36).toUpperCase()}-${randomUUID().slice(0, 6).toUpperCase()}`;

  const status: 'pending' | 'under_review' = payment === 'cod' ? 'under_review' : 'pending';
  const [tx] = await db
    .insert(transaction)
    .values({
      userId,
      planId: plan.id,
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

  res.status(201).json({
    orderId: tx!.providerOrderId,
    transactionId: tx!.id,
    status: tx!.status,
    paymentMethod: payment,
    amountMinorUnits: totalMinor,
  });
});

/* ============================================================
 * POST /api/billing/cancel-subscription
 * Sets active sub to cancel-at-period-end.
 * ============================================================ */
billingRouter.post('/cancel-subscription', async (req: AuthedRequest, res: Response) => {
  const userId = req.userId!;
  const [sub] = await db
    .select()
    .from(subscription)
    .where(eq(subscription.userId, userId))
    .orderBy(desc(subscription.createdAt))
    .limit(1);
  if (!sub) {
    res.status(404).json({ error: 'No subscription found' });
    return;
  }
  if (sub.status === 'canceled' || sub.status === 'expired') {
    res.status(409).json({ error: `Subscription is already ${sub.status}` });
    return;
  }
  await db
    .update(subscription)
    .set({
      cancelAtPeriodEnd: true,
      status: 'canceled',
      updatedAt: new Date(),
    })
    .where(eq(subscription.id, sub.id));
  res.json({ ack: true });
});

/* ============================================================
 * POST /api/billing/mock-complete
 * body: { orderId, outcome: 'success' | 'fail' | 'under_review', method? }
 * Simulates the HBL callback. On success it also creates/extends the subscription.
 * ============================================================ */
billingRouter.post(
  '/mock-complete',
  async (req: AuthedRequest, res: Response) => {
    const userId = req.userId!;
    const body = req.body as {
      orderId?: string;
      outcome?: string;
      method?: string;
    };
    if (!body.orderId || !body.outcome) {
      res.status(400).json({ error: 'orderId and outcome are required' });
      return;
    }
    const outcome =
      body.outcome === 'success'
        ? 'success'
        : body.outcome === 'fail'
          ? 'fail'
          : body.outcome === 'under_review'
            ? 'under_review'
            : null;
    if (!outcome) {
      res.status(400).json({ error: 'invalid outcome' });
      return;
    }

    const [tx] = await db
      .select()
      .from(transaction)
      .where(
        and(
          eq(transaction.providerOrderId, body.orderId),
          eq(transaction.userId, userId),
        ),
      );
    if (!tx) {
      res.status(404).json({ error: 'transaction not found' });
      return;
    }
    if (tx.status !== 'pending') {
      res.status(409).json({ error: `transaction is already ${tx.status}` });
      return;
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
        .where(eq(subscription.userId, userId))
        .orderBy(desc(subscription.createdAt))
        .limit(1);

      const now = new Date();
      const periodEnd = new Date(now);
      periodEnd.setDate(periodEnd.getDate() + 30);

      if (
        existingSub &&
        ['trialing', 'active', 'past_due'].includes(existingSub.status)
      ) {
        // extend from the later of now or current_period_end
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
            userId,
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

    res.json({
      ack: true,
      transaction: {
        orderId: tx.providerOrderId,
        status,
        responseCode,
        responseMessage,
      },
      subscriptionId,
    });
  },
);

function parseFeatures(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.filter((f): f is string => typeof f === 'string');
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed))
        return parsed.filter((f): f is string => typeof f === 'string');
    } catch {
      /* ignore */
    }
  }
  return [];
}
