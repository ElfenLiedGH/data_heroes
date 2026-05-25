import {
  Channel,
  Decision,
  DecisionReason,
  NotificationType,
  Region,
} from '../../../../../../generated/client';

export interface EvaluationRepositoryPort {
  create(data: Readonly<{
   user_id: string;
   notification_type: NotificationType;
   channel: Channel;
   region: Region;
   evaluated_at: Date;
   decision: Decision;
   reason: DecisionReason;
   global_policy_id: string | null;
  }>): Promise<void>;
}
