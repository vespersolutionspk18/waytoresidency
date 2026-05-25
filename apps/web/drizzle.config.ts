import { config as loadEnv } from 'dotenv';
loadEnv({ path: '.env.local' });
loadEnv({ path: '.env' });

import type { Config } from 'drizzle-kit';

export default {
  schema: [
    './lib/db/schema/auth.ts',
    './lib/db/schema/content.ts',
    './lib/db/schema/attempts.ts',
    './lib/db/schema/billing.ts',
    './lib/db/schema/contact.ts',
  ],
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
} satisfies Config;
