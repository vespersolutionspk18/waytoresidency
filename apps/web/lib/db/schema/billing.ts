import {
  pgTable,
  text,
  uuid,
  integer,
  boolean,
  timestamp,
  pgEnum,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';
import { user } from './auth';

export const billingInterval = pgEnum('billing_interval', ['month', 'year']);

export const subscriptionStatus = pgEnum('subscription_status', [
  'trialing',
  'active',
  'past_due',
  'canceled',
  'expired',
]);

export const transactionStatus = pgEnum('transaction_status', [
  'pending',
  'succeeded',
  'failed',
  'refunded',
  'under_review',
]);

export const paymentProvider = pgEnum('payment_provider', ['hblpay']);

export const plan = pgTable(
  'plan',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: text('slug').notNull().unique(),
    name: text('name').notNull(),
    description: text('description'),
    priceMinorUnits: integer('price_minor_units').notNull(),
    currency: text('currency').notNull().default('PKR'),
    interval: billingInterval('interval').notNull(),
    features: jsonb('features').notNull().default('[]'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [index('plan_active_idx').on(t.isActive)],
);

export const subscription = pgTable(
  'subscription',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    planId: uuid('plan_id')
      .notNull()
      .references(() => plan.id, { onDelete: 'restrict' }),
    status: subscriptionStatus('status').notNull().default('trialing'),
    currentPeriodStart: timestamp('current_period_start').notNull(),
    currentPeriodEnd: timestamp('current_period_end').notNull(),
    cancelAtPeriodEnd: boolean('cancel_at_period_end').notNull().default(false),
    provider: paymentProvider('provider').notNull().default('hblpay'),
    providerSubscriptionId: text('provider_subscription_id'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('subscription_user_idx').on(t.userId),
    index('subscription_status_idx').on(t.status),
    index('subscription_period_end_idx').on(t.currentPeriodEnd),
  ],
);

export const transaction = pgTable(
  'transaction',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    subscriptionId: uuid('subscription_id').references(() => subscription.id, {
      onDelete: 'set null',
    }),
    planId: uuid('plan_id')
      .notNull()
      .references(() => plan.id, { onDelete: 'restrict' }),
    amountMinorUnits: integer('amount_minor_units').notNull(),
    currency: text('currency').notNull().default('PKR'),
    status: transactionStatus('status').notNull().default('pending'),
    provider: paymentProvider('provider').notNull().default('hblpay'),
    providerOrderId: text('provider_order_id').notNull(),
    providerSessionId: text('provider_session_id'),
    providerResponseCode: text('provider_response_code'),
    providerResponseMessage: text('provider_response_message'),
    providerPayload: jsonb('provider_payload'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('transaction_user_idx').on(t.userId),
    index('transaction_status_idx').on(t.status),
    index('transaction_provider_order_idx').on(t.providerOrderId),
  ],
);
