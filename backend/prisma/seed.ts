import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { PrismaClient } from '../generated/client';
import {
  SEED_DEFAULT_PREFERENCES,
  SEED_GLOBAL_POLICIES,
  SEED_USER_PREFERENCES,
  SEED_USER_QUIET_HOURS,
  SEED_USERS,
} from '../src/shared/fixtures/seed-data.fixture';

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  const count = await prisma.defaultPreference.count();
  if (count > 0) {
    console.log('Database already seeded, skipping.');
    await prisma.$disconnect();
    await pool.end();
    return;
  }

  await prisma.$transaction(async (tx) => {
    await tx.defaultPreference.createMany({ data: [...SEED_DEFAULT_PREFERENCES] });
    await tx.globalPolicy.createMany({ data: [...SEED_GLOBAL_POLICIES] });
    await tx.user.createMany({ data: [...SEED_USERS] });
    await tx.userPreference.createMany({ data: [...SEED_USER_PREFERENCES] });
    await tx.userQuietHours.createMany({ data: [...SEED_USER_QUIET_HOURS] });
  });

  console.log('Seed completed.');
  await prisma.$disconnect();
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
