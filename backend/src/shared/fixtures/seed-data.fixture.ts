import {
  Channel,
  NotificationType,
  PolicyAction,
  PreferenceSource,
  Region,
} from '../../../generated/client';
import { PREFERENCE_CATALOG, EVALUATION_DECISION } from '../constants';
import { DefaultPreferenceResolver } from '../../modules/notification-preferences/domain/default-preferences/default-preference-resolver';

export const SEED_GLOBAL_DEFAULT_PREFERENCES = [
  { region: null, notification_type: NotificationType.transactional, channel: Channel.email, enabled: true },
  { region: null, notification_type: NotificationType.marketing, channel: Channel.email, enabled: false },
  { region: null, notification_type: NotificationType.transactional, channel: Channel.sms, enabled: true },
  { region: null, notification_type: NotificationType.marketing, channel: Channel.sms, enabled: false },
  { region: null, notification_type: NotificationType.transactional, channel: Channel.push, enabled: true },
  { region: null, notification_type: NotificationType.marketing, channel: Channel.push, enabled: false },
] as const;

export const SEED_REGION_DEFAULT_PREFERENCES = [
  {
   region: Region.EU,
   notification_type: NotificationType.marketing,
   channel: Channel.email,
   enabled: true,
  },
] as const;

export const SEED_DEFAULT_PREFERENCES = [
  ...SEED_GLOBAL_DEFAULT_PREFERENCES,
  ...SEED_REGION_DEFAULT_PREFERENCES,
] as const;

export const SEED_GLOBAL_POLICIES = [
  {
   notification_type: NotificationType.marketing,
   channel: Channel.sms,
   region: Region.EU,
   action: PolicyAction.deny,
   reason_code: EVALUATION_DECISION.deny.reasons.blocked_by_global_policy,
  },
] as const;

export const SEED_USERS = [
  { id: 'user-01', region: Region.US },
  { id: 'user-02', region: Region.US },
  { id: 'user-03', region: Region.US },
  { id: 'user-04', region: Region.RU },
  { id: 'user-05', region: Region.EU },
  { id: 'user-06', region: Region.US },
  { id: 'user-07', region: Region.EU },
  { id: 'user-08', region: Region.US },
  { id: 'user-09', region: Region.GLOBAL },
  { id: 'user-10', region: Region.RU },
  { id: 'user-11', region: Region.US },
  { id: 'user-12', region: Region.GLOBAL },
] as const;

export const SEED_USER_OVERRIDES = [
  { user_id: 'user-02', notification_type: NotificationType.marketing, channel: Channel.email, enabled: true },
  { user_id: 'user-03', notification_type: NotificationType.marketing, channel: Channel.email, enabled: false },
  { user_id: 'user-05', notification_type: NotificationType.marketing, channel: Channel.push, enabled: true },
  { user_id: 'user-08', notification_type: NotificationType.transactional, channel: Channel.push, enabled: false },
  { user_id: 'user-10', notification_type: NotificationType.marketing, channel: Channel.email, enabled: true },
  { user_id: 'user-10', notification_type: NotificationType.marketing, channel: Channel.push, enabled: true },
] as const;

export const SEED_USER_QUIET_HOURS = [
  { user_id: 'user-04', start_time: '22:00', end_time: '08:00', timezone: 'Europe/Moscow', enabled: true },
  { user_id: 'user-05', start_time: '23:00', end_time: '07:00', timezone: 'Europe/Berlin', enabled: true },
  { user_id: 'user-08', start_time: '22:00', end_time: '08:00', timezone: 'America/New_York', enabled: true },
  { user_id: 'user-10', start_time: '21:00', end_time: '09:00', timezone: 'Asia/Tokyo', enabled: true },
] as const;

const ALL_SEED_DEFAULTS = SEED_DEFAULT_PREFERENCES.map((d) => ({
  notification_type: d.notification_type,
  channel: d.channel,
  region: d.region,
  enabled: d.enabled,
}));

export function resolveDefaultsForUserRegion(region: Region) {
  const resolved = DefaultPreferenceResolver.resolveForRegion(region, ALL_SEED_DEFAULTS);
  if (!resolved) {
   throw new Error(`Incomplete defaults for region ${region}`);
  }
  return resolved;
}

export function buildSeedUserPreferences() {
  const overrideMap = new Map(
   SEED_USER_OVERRIDES.map((o) => [`${o.user_id}:${o.notification_type}:${o.channel}`, o]),
  );

  return SEED_USERS.flatMap((user) => {
   const defaults = resolveDefaultsForUserRegion(user.region);

   return defaults.map(({ notification_type, channel, enabled: defaultEnabled }) => {
     const key = `${user.id}:${notification_type}:${channel}`;
     const override = overrideMap.get(key);
     if (override) {
       return {
         user_id: user.id,
         notification_type,
         channel,
         enabled: override.enabled,
         source: PreferenceSource.user,
       };
     }
     return {
       user_id: user.id,
       notification_type,
       channel,
       enabled: defaultEnabled,
       source: PreferenceSource.default,
     };
   });
  });
}

export const SEED_USER_PREFERENCES = buildSeedUserPreferences();

export { PREFERENCE_CATALOG };

