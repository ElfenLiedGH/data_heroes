import { Channel, NotificationType, Region } from '../../../../../generated/client';
import { GlobalPolicyRow } from '../users/preference-resolver';

export class GlobalPolicyGuard {
  public static canEnablePreference(
    userRegion: Region,
    notificationType: NotificationType,
    channel: Channel,
    globalPolicies: GlobalPolicyRow[],
  ): boolean {
   const blocked = globalPolicies.some(
     (p) =>
       p.notification_type === notificationType &&
       p.channel === channel &&
       p.region === userRegion &&
       p.action === 'deny',
   );
   return !blocked;
  }
}
