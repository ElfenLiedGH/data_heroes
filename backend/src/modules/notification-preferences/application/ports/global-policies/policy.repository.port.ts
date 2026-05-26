import {
  Channel,
  DecisionReason,
  NotificationType,
  PolicyAction,
  Region,
} from '../../../../../../generated/client';

export type GlobalPolicyRecord = {
  readonly id: string;
  readonly notification_type: NotificationType;
  readonly channel: Channel;
  readonly region: Region;
  readonly action: PolicyAction;
  readonly reason_code: DecisionReason;
  readonly created_at: Date;
};

export interface PolicyRepositoryPort {
  findAll(): Promise<GlobalPolicyRecord[]>;
  findByRegions(regions: readonly Region[]): Promise<GlobalPolicyRecord[]>;
  findPage(offset: number, limit: number): Promise<GlobalPolicyRecord[]>;
  count(): Promise<number>;
  findById(id: string): Promise<GlobalPolicyRecord | null>;
  create(data: Readonly<{
   notification_type: NotificationType;
   channel: Channel;
   region: Region;
   action: PolicyAction;
   reason_code: DecisionReason;
  }>): Promise<GlobalPolicyRecord>;
  update(
   id: string,
   data: Readonly<{
     notification_type: NotificationType;
     channel: Channel;
     region: Region;
     action: PolicyAction;
     reason_code: DecisionReason;
   }>,
  ): Promise<GlobalPolicyRecord>;
  deleteById(id: string): Promise<void>;
}
