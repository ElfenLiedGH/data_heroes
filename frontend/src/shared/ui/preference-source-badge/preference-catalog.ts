import type { PreferenceItemDto } from '../../api/api';

export const PREFERENCE_COLUMNS = [
  { notification_type: 'transactional', channel: 'email', label: 'trx email' },
  { notification_type: 'marketing', channel: 'email', label: 'mkt email' },
  { notification_type: 'transactional', channel: 'sms', label: 'trx sms' },
  { notification_type: 'marketing', channel: 'sms', label: 'mkt sms' },
  { notification_type: 'transactional', channel: 'push', label: 'trx push' },
  { notification_type: 'marketing', channel: 'push', label: 'mkt push' },
] as const;

export function findPreference(
  preferences: PreferenceItemDto[],
  notificationType: string,
  channel: string,
) {
  return preferences.find(
    (p) => p.notification_type === notificationType && p.channel === channel,
  );
}
