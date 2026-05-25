import { Channel, NotificationType, Region } from '../../../../../generated/client';
import { PREFERENCE_CATALOG } from '../../../../shared/constants';

export type DefaultPreferenceRecord = {
  readonly notification_type: NotificationType;
  readonly channel: Channel;
  readonly region: Region | null;
  readonly enabled: boolean;
};

export type ResolvedDefaultPreference = {
  readonly notification_type: NotificationType;
  readonly channel: Channel;
  readonly enabled: boolean;
};

export class DefaultPreferenceResolver {
  public static resolveForRegion(
    region: Region,
    defaults: DefaultPreferenceRecord[],
  ): ResolvedDefaultPreference[] | null {
   const globalMap = new Map(
     defaults
       .filter((d) => d.region === null)
       .map((d) => [`${d.notification_type}:${d.channel}`, d]),
   );
   const regionalMap = new Map(
     defaults
       .filter((d) => d.region === region)
       .map((d) => [`${d.notification_type}:${d.channel}`, d]),
   );

   const resolved: ResolvedDefaultPreference[] = [];

   for (const { notification_type, channel } of PREFERENCE_CATALOG) {
     const key = `${notification_type}:${channel}`;
     const match = regionalMap.get(key) ?? globalMap.get(key);
     if (!match) {
       return null;
     }
     resolved.push({
       notification_type,
       channel,
        enabled: match.enabled,
     });
   }

   return resolved;
  }
}
