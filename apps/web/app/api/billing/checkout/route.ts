import type { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { db } from '@/lib/db';
import { plan, transaction } from '@/lib/db/schema';
import { requireUser } from '@/lib/auth-helpers';
import { handle, json, readJson } from '@/lib/api-helpers';
import {
  DEFAULT_PLAN_SLUG,
  getOrCreateDefaultPlan,
  parseFeatures,
} from '@/lib/billing-helpers';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  return handle(async () => {
    const me = await requireUser(request);
    const body = await readJson<{ planSlug?: string }>(request);
    const slug = body.planSlug ?? DEFAULT_PLAN_SLUG;

    let [chosen] = await db.select().from(plan).where(eq(plan.slug, slug));
    if (!chosen) chosen = await getOrCreateDefaultPlan();

    const orderId = `WTR-${Date.now().toString(36).toUpperCase()}-${randomUUID().slice(0, 8).toUpperCase()}`;

    const [tx] = await db
      .insert(transaction)
      .values({
        userId: me.id,
        planId: chosen.id,
        amountMinorUnits: chosen.priceMinorUnits,
        currency: chosen.currency,
        status: 'pending',
        provider: 'hblpay',
        providerOrderId: orderId,
      })
      .returning();

    return json(
      {
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
      },
      { status: 201 },
    );
  });
}
