import type { NextRequest } from 'next/server';
import { requireUser } from '@/lib/auth-helpers';
import { handle, json } from '@/lib/api-helpers';
import { getOrCreateDefaultPlan, parseFeatures } from '@/lib/billing-helpers';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return handle(async () => {
    await requireUser(request);
    const p = await getOrCreateDefaultPlan();
    return json({
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
}
