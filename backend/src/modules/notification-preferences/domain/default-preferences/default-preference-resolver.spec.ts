import { Channel, NotificationType, Region } from '../../../../../generated/client';
import { DefaultPreferenceResolver } from './default-preference-resolver';

describe('DefaultPreferenceResolver', () => {
  const globalDefaults = [
    { region: null, notification_type: NotificationType.transactional, channel: Channel.email, enabled: true },
    { region: null, notification_type: NotificationType.marketing, channel: Channel.email, enabled: false },
    { region: null, notification_type: NotificationType.transactional, channel: Channel.sms, enabled: true },
    { region: null, notification_type: NotificationType.marketing, channel: Channel.sms, enabled: false },
    { region: null, notification_type: NotificationType.transactional, channel: Channel.push, enabled: true },
    { region: null, notification_type: NotificationType.marketing, channel: Channel.push, enabled: false },
  ];

  it('should resolve global defaults for US when no regional overrides exist', () => {
    const result = DefaultPreferenceResolver.resolveForRegion(Region.US, globalDefaults);
    expect(result).toHaveLength(6);
    expect(result?.find((p) => p.notification_type === NotificationType.marketing && p.channel === Channel.email)?.enabled).toBe(false);
  });

  it('should prefer regional defaults over global defaults', () => {
    const result = DefaultPreferenceResolver.resolveForRegion(Region.EU, [
      ...globalDefaults,
      {
        region: Region.EU,
        notification_type: NotificationType.marketing,
        channel: Channel.email,
        enabled: true,
      },
    ]);

    expect(result?.find((p) => p.notification_type === NotificationType.marketing && p.channel === Channel.email)?.enabled).toBe(true);
    expect(result?.find((p) => p.notification_type === NotificationType.marketing && p.channel === Channel.sms)?.enabled).toBe(false);
  });

  it('should return null when catalog item cannot be resolved', () => {
    const result = DefaultPreferenceResolver.resolveForRegion(Region.US, [
      { region: null, notification_type: NotificationType.transactional, channel: Channel.email, enabled: true },
    ]);
    expect(result).toBeNull();
  });
});
