import { ApiProperty } from '@nestjs/swagger';
import {
  Channel,
  DecisionReason,
  NotificationType,
  PolicyAction,
  Region,
} from '../../../../../generated/client';
import {
  CHANNEL_VALUES,
  DECISION_REASON_VALUES,
  NOTIFICATION_TYPE_VALUES,
  POLICY_ACTION_VALUES,
  REGION_VALUES,
} from '../../../../shared/constants';

export class GlobalPolicyItemDto {
  @ApiProperty({ type: String })
  public readonly id!: string;

  @ApiProperty({ enum: NOTIFICATION_TYPE_VALUES })
  public readonly notification_type!: NotificationType;

  @ApiProperty({ enum: CHANNEL_VALUES })
  public readonly channel!: Channel;

  @ApiProperty({ enum: REGION_VALUES })
  public readonly region!: Region;

  @ApiProperty({ enum: POLICY_ACTION_VALUES })
  public readonly action!: PolicyAction;

  @ApiProperty({ enum: DECISION_REASON_VALUES })
  public readonly reason_code!: DecisionReason;

  @ApiProperty({ type: String, example: '2026-05-25T10:00:00.000Z' })
  public readonly created_at!: string;
}

export class GlobalPoliciesListResponseDto {
  @ApiProperty({ type: () => GlobalPolicyItemDto, isArray: true })
  public readonly policies!: GlobalPolicyItemDto[];
}
