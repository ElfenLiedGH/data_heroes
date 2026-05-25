import { PreferenceSource, Region } from '../../../generated/client';
import { PreferenceResolver, EffectivePreference } from '../../modules/notification-preferences/domain/users/preference-resolver';
import {
  SEED_GLOBAL_POLICIES,
  SEED_USER_PREFERENCES,
  SEED_USER_QUIET_HOURS,
  SEED_USERS,
} from './seed-data.fixture';

export function parsePreferenceKey(key: string): Readonly<{ notification_type: string; channel: string }> {
  const [notification_type, channel] = key.split(':');
  return { notification_type, channel };
}

export function findPreferenceByKey<T extends Readonly<{ notification_type: string; channel: string }>>(
  preferences: T[],
  key: string,
): T | undefined {
  const { notification_type, channel } = parsePreferenceKey(key);
  return preferences.find(
   (p) => p.notification_type === notification_type && p.channel === channel,
  );
}

export function resolveSeedEffectivePreferences(userId: string): EffectivePreference[] {
  const user = SEED_USERS.find((u) => u.id === userId);
  if (!user) {
   throw new Error(`Unknown seed user: ${userId}`);
  }

  const userPreferences = SEED_USER_PREFERENCES.filter((p) => p.user_id === userId).map(
   (p) => ({
     notification_type: p.notification_type,
     channel: p.channel,
     enabled: p.enabled,
     source: p.source,
   }),
  );

  return PreferenceResolver.resolveEffectivePreferences(
   user.region,
   userPreferences,
   SEED_GLOBAL_POLICIES.map((p) => ({ ...p, id: 'seed-policy' })),
  );
}

export function getSeedUserRegion(userId: string): Region {
  const user = SEED_USERS.find((u) => u.id === userId);
  if (!user) {
   throw new Error(`Unknown seed user: ${userId}`);
  }
  return user.region;
}

export function getSeedQuietHours(userId: string) {
  const quietHours = SEED_USER_QUIET_HOURS.find((q) => q.user_id === userId);
  if (!quietHours) {
   return null;
  }
  return {
   start_time: quietHours.start_time,
   end_time: quietHours.end_time,
   timezone: quietHours.timezone,
   enabled: quietHours.enabled,
  };
}

export const SEED_PREFERENCE_SCENARIOS = [
  {
   user_id: 'user-01',
   description: 'only copied defaults, US (no global policy)',
   expect_all_default: true,
   expect_no_source: true,
   expect_blocked: [] as string[],
   expect_user: [] as string[],
  },
  {
   user_id: 'user-02',
   description: 'user override marketing email enabled',
   expect_all_default: false,
   expect_no_source: false,
   expect_blocked: [],
   expect_user: ['marketing:email'],
  },
  {
   user_id: 'user-03',
   description: 'user override marketing email disabled',
   expect_all_default: false,
   expect_no_source: false,
   expect_blocked: [],
   expect_user: ['marketing:email'],
  },
  {
   user_id: 'user-04',
   description: 'only copied defaults, RU, quiet hours configured',
   expect_all_default: true,
   expect_no_source: true,
   expect_blocked: [],
   expect_user: [],
  },
  {
   user_id: 'user-05',
   description: 'EU: global marketing sms + user marketing push enabled',
   expect_all_default: false,
   expect_no_source: false,
   expect_blocked: ['marketing:sms'],
   expect_user: ['marketing:push'],
  },
  {
   user_id: 'user-06',
   description: 'only copied defaults, US',
   expect_all_default: true,
   expect_no_source: true,
   expect_blocked: [],
   expect_user: [],
  },
  {
   user_id: 'user-07',
   description: 'EU: global marketing sms without user override',
   expect_all_default: false,
   expect_no_source: false,
   expect_blocked: ['marketing:sms'],
   expect_user: [],
  },
  {
   user_id: 'user-08',
   description: 'user override transactional push disabled',
   expect_all_default: false,
   expect_no_source: false,
   expect_blocked: [],
   expect_user: ['transactional:push'],
  },
  {
   user_id: 'user-09',
   description: 'GLOBAL region: marketing sms stays default (policy is EU-only)',
   expect_all_default: true,
   expect_no_source: true,
   expect_blocked: [],
   expect_user: [],
  },
  {
   user_id: 'user-10',
   description: 'user overrides marketing email and marketing push enabled',
   expect_all_default: false,
   expect_no_source: false,
   expect_blocked: [],
   expect_user: ['marketing:email', 'marketing:push'],
  },
  {
   user_id: 'user-11',
   description: 'only copied defaults, US',
   expect_all_default: true,
   expect_no_source: true,
   expect_blocked: [],
   expect_user: [],
  },
  {
   user_id: 'user-12',
   description: 'GLOBAL region: only copied defaults',
   expect_all_default: true,
   expect_no_source: true,
   expect_blocked: [],
   expect_user: [],
  },
] as const;

export function getSeedUserPreferenceRows(userId: string) {
  return SEED_USER_PREFERENCES.filter((p) => p.user_id === userId).map((p) => ({
   notification_type: p.notification_type,
   channel: p.channel,
   enabled: p.enabled,
   source: p.source,
  }));
}

export { PreferenceSource };
