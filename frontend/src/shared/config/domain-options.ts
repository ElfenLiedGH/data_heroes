export const NOTIFICATION_TYPES = ['transactional', 'marketing'] as const;
export const CHANNELS = ['email', 'sms', 'push'] as const;
export const REGIONS = ['EU', 'US', 'RU', 'GLOBAL'] as const;
export const ALL_REGIONS_VALUE = '__ALL__';

export type NotificationTypeValue = (typeof NOTIFICATION_TYPES)[number];
export type ChannelValue = (typeof CHANNELS)[number];
export type RegionValue = (typeof REGIONS)[number];

export function toSelectItems(values: readonly string[]) {
  return values.map((v) => ({ text: v, value: v }));
}
