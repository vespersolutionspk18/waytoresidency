import 'dotenv/config';
import { eq } from 'drizzle-orm';
import { db } from '../src/db';
import { user } from '../src/db/schema';
import { auth } from '../src/auth';

const ADMIN_EMAIL = 'admin@waytoresidency.com';
const ADMIN_PASSWORD = 'WtrAdmin2026!';
const ADMIN_NAME = 'Way to Residency Admin';

async function main() {
  let [existing] = await db
    .select()
    .from(user)
    .where(eq(user.email, ADMIN_EMAIL));

  if (!existing) {
    try {
      await auth.api.signUpEmail({
        body: {
          email: ADMIN_EMAIL,
          password: ADMIN_PASSWORD,
          name: ADMIN_NAME,
        },
      });
      [existing] = await db
        .select()
        .from(user)
        .where(eq(user.email, ADMIN_EMAIL));
      console.log(`✓ created admin account ${ADMIN_EMAIL}`);
    } catch (e) {
      console.error('failed to create admin user via Better Auth:', e);
      process.exit(1);
    }
  } else {
    console.log(`• admin account ${ADMIN_EMAIL} already exists, updating role`);
  }

  if (!existing) {
    console.error('could not find or create the admin user');
    process.exit(1);
  }

  if (!existing.isAdmin) {
    await db
      .update(user)
      .set({ isAdmin: true })
      .where(eq(user.id, existing.id));
    console.log(`✓ promoted ${ADMIN_EMAIL} to admin`);
  }

  console.log('');
  console.log('─────────────────────────────────────────');
  console.log('  Default admin credentials');
  console.log('─────────────────────────────────────────');
  console.log(`  Email:    ${ADMIN_EMAIL}`);
  console.log(`  Password: ${ADMIN_PASSWORD}`);
  console.log('─────────────────────────────────────────');
  console.log('');
  console.log(
    '  Sign in at http://localhost:3000/sign-in, you will be routed straight to /admin.',
  );
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
