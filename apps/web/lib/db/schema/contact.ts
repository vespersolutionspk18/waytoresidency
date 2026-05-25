import {
  pgTable,
  text,
  uuid,
  boolean,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';

export const contactSubmission = pgTable(
  'contact_submission',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    firstName: text('first_name').notNull(),
    lastName: text('last_name'),
    email: text('email').notNull(),
    phone: text('phone'),
    message: text('message').notNull(),
    handled: boolean('handled').notNull().default(false),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('contact_submission_created_idx').on(t.createdAt),
    index('contact_submission_handled_idx').on(t.handled),
  ],
);
