import {
  Channel,
  Decision,
  DecisionReason,
  NotificationType,
  Region,
} from '../../../../../generated/client';
import { GlobalPolicyRow, UserPreferenceRow } from '../users/preference-resolver';
import { QuietHoursChecker, QuietHoursConfig } from '../users/quiet-hours-checker';
import { EVALUATION_DECISION } from '../../../../shared/constants';

export type EvaluationInput = {
  readonly notification_type: NotificationType;
  readonly channel: Channel;
  readonly region: Region;
  readonly datetime: string;
};

export type EvaluationResult = {
  readonly decision: Decision;
  readonly reason: DecisionReason;
  readonly global_policy_id: string | null;
};

export class NotificationEvaluationService {
  public static evaluate(
    input: EvaluationInput,
    userPreferences: UserPreferenceRow[],
    globalPolicies: GlobalPolicyRow[],
    quietHours: QuietHoursConfig | null,
  ): EvaluationResult {
   const matchingPolicy = globalPolicies.find(
     (p) =>
       p.notification_type === input.notification_type &&
       p.channel === input.channel &&
       p.region === input.region &&
       p.action === 'deny',
   );

   if (matchingPolicy) {
     return {
        decision: EVALUATION_DECISION.deny.value,
        reason: EVALUATION_DECISION.deny.reasons.blocked_by_global_policy,
        global_policy_id: matchingPolicy.id,
     };
   }

   const userPref = userPreferences.find(
     (u) =>
       u.notification_type === input.notification_type &&
       u.channel === input.channel,
   );

   const enabled = userPref?.enabled ?? false;

   if (!enabled) {
     return {
        decision: EVALUATION_DECISION.deny.value,
        reason: userPref
         ? EVALUATION_DECISION.deny.reasons.disabled_by_user_preference
         : EVALUATION_DECISION.deny.reasons.disabled_by_default,
        global_policy_id: null,
     };
   }

   if (
     input.notification_type === NotificationType.marketing &&
     quietHours &&
     QuietHoursChecker.isInQuietHours(quietHours, input.datetime)
   ) {
     return {
        decision: EVALUATION_DECISION.deny.value,
        reason: EVALUATION_DECISION.deny.reasons.blocked_by_quiet_hours,
        global_policy_id: null,
     };
   }

   return {
      decision: EVALUATION_DECISION.allow.value,
      reason: EVALUATION_DECISION.allow.reasons.allowed,
      global_policy_id: null,
   };
  }
}
