// Env is loaded by `tsx --env-file=.env.local` in package.json.
import { eq } from 'drizzle-orm';
import { db } from '../lib/db';
import { user, session } from '../lib/db/schema';

const email = process.argv[2];
if (!email) {
  console.error('usage: pnpm admin:promote <email>');
  process.exit(1);
}

const [u] = await db.select().from(user).where(eq(user.email, email));
if (!u) {
  console.error(`no user with email ${email}`);
  process.exit(1);
}
await db.update(user).set({ isAdmin: true }).where(eq(user.id, u.id));
// Revoke any existing sessions so the next request reflects the new role.
const deleted = await db.delete(session).where(eq(session.userId, u.id)).returning();
console.log(`✓ promoted ${u.name} (${u.email}) to admin`);
if (deleted.length > 0) {
  console.log(`  revoked ${deleted.length} active session${deleted.length === 1 ? '' : 's'} so they sign in again`);
}
process.exit(0);
