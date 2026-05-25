import { eq } from 'drizzle-orm';
import { db } from './db';
import { plan } from './db/schema';

export const DEFAULT_PLAN_SLUG = 'monthly-2026';

/** Lazily creates the default monthly plan if it doesn't exist. */
export async function getOrCreateDefaultPlan() {
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

export function parseFeatures(raw: unknown): string[] {
  if (Array.isArray(raw))
    return raw.filter((f): f is string => typeof f === 'string');
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
