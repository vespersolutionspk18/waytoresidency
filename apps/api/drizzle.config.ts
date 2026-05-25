import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: [
    './src/db/schema/auth.ts',
    './src/db/schema/content.ts',
    './src/db/schema/attempts.ts',
    './src/db/schema/billing.ts',
    './src/db/schema/contact.ts',
  ],
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  strict: true,
  verbose: true,
});
