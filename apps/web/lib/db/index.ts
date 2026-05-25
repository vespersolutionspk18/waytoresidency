import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool, neonConfig } from '@neondatabase/serverless';
import * as schema from './schema';

// Outside of edge runtimes (e.g. Node.js scripts, Vercel Node functions, local
// `next dev`) we need to supply a WebSocket constructor explicitly because the
// Node runtime doesn't expose the WebSocket global.
if (typeof globalThis.WebSocket === 'undefined') {
  // Use require() so the cost only hits Node, never the browser bundle.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  neonConfig.webSocketConstructor = require('ws');
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is required');
}

// Re-use a single Pool across invocations of the same Lambda/edge instance.
// On Vercel each function instance keeps the Pool warm for the lifetime of the
// container, which is exactly the pattern Neon's serverless driver expects.
const globalForPool = globalThis as unknown as { __wtrPool?: Pool };
const pool =
  globalForPool.__wtrPool ?? new Pool({ connectionString, max: 5 });
if (process.env.NODE_ENV !== 'production') globalForPool.__wtrPool = pool;

export const db = drizzle(pool, { schema });
export type Db = typeof db;
