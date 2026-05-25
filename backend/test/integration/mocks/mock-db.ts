import {
  SEED_DEFAULT_PREFERENCES,
  SEED_GLOBAL_POLICIES,
  SEED_USER_PREFERENCES,
  SEED_USER_QUIET_HOURS,
  SEED_USERS,
} from '../../../src/shared/fixtures/seed-data.fixture';
import type { MockDb } from './mock-db.types';

export function createMockDb(): MockDb {
  return {
    users: new Map(
      SEED_USERS.map((u) => [
        u.id,
        { id: u.id, region: u.region, created_at: new Date('2026-05-25T10:00:00Z') },
      ]),
    ),
    defaultPreferences: SEED_DEFAULT_PREFERENCES.map((p, i) => ({
      ...p,
      id: `dp-${i}`,
      created_at: new Date('2026-05-25T10:00:00Z'),
      updated_at: new Date('2026-05-25T10:00:00Z'),
    })),
    userPreferences: SEED_USER_PREFERENCES.map((p, i) => ({
      ...p,
      id: `up-${i}`,
      user_id: p.user_id as string,
    })),
    userQuietHours: SEED_USER_QUIET_HOURS.map((q) => ({ ...q, user_id: q.user_id as string })),
    globalPolicies: SEED_GLOBAL_POLICIES.map((p, i) => ({
      ...p,
      id: `gp-${i}`,
      created_at: new Date('2026-05-25T10:00:00Z'),
    })),
    evaluationLogs: [],
  };
}
