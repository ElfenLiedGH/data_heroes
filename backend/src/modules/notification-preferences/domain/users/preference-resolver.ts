import { Channel, NotificationType, PreferenceSource, Region } from '../../../../../generated/client';
import { PREFERENCE_CATALOG, PREFERENCE_SOURCE, DisplayPreferenceSource } from '../../../../shared/constants';

export type UserPreferenceRow = {
  readonly notification_type: NotificationType;
  readonly channel: Channel;
  readonly enabled: boolean;
  readonly source: PreferenceSource;
};

export type GlobalPolicyRow = {
  readonly id: string;
  readonly notification_type: NotificationType;
  readonly channel: Channel;
  readonly region: Region;
  readonly action: string;
};

export type EffectivePreference = {
  readonly notification_type: NotificationType;
  readonly channel: Channel;
  readonly enabled: boolean;
  readonly source: DisplayPreferenceSource | null;
  readonly blocked_by_global: boolean;
};

export class PreferenceResolver {
  public static resolveEffectivePreferences(
    userRegion: Region,
    userPreferences: UserPreferenceRow[],
    globalPolicies: GlobalPolicyRow[],
  ): EffectivePreference[] {
   const userMap = new Map(
     userPreferences.map((u) => [`${u.notification_type}:${u.channel}`, u]),
   );

   return PREFERENCE_CATALOG.map(({ notification_type, channel }) => {
     const key = `${notification_type}:${channel}`;
     const userPref = userMap.get(key);
     const blockedByGlobal = globalPolicies.some(
       (p) =>
         p.notification_type === notification_type &&
         p.channel === channel &&
         p.region === userRegion &&
         p.action === 'deny',
     );

     let source: DisplayPreferenceSource | null = null;
     if (blockedByGlobal) {
       source = PREFERENCE_SOURCE.GLOBAL;
     } else if (userPref?.source === PreferenceSource.user) {
       source = PREFERENCE_SOURCE.USER;
     }

     return {
       notification_type,
       channel,
        enabled: blockedByGlobal ? false : (userPref?.enabled ?? false),
       source,
        blocked_by_global: blockedByGlobal,
     };
   });
  }
}

export { PREFERENCE_SOURCE };
