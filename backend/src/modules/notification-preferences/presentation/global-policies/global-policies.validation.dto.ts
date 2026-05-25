import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsIn,
} from 'class-validator';
import {
  Channel,
  DecisionReason,
  NotificationType,
  PolicyAction,
  Region,
} from '../../../../../generated/client';
import {
  CHANNEL_VALUES,
  EVALUATION_DECISION,
  NOTIFICATION_TYPE_VALUES,
  POLICY_ACTION_VALUES,
  REGION_VALUES,
} from '../../../../shared/constants';

export class GlobalPolicyBodyDto {
  @ApiProperty({ enum: NOTIFICATION_TYPE_VALUES })
  @IsEnum(NotificationType)
  public notification_type!: NotificationType;

  @ApiProperty({ enum: CHANNEL_VALUES })
  @IsEnum(Channel)
  public channel!: Channel;

  @ApiProperty({ enum: REGION_VALUES })
  @IsEnum(Region)
  public region!: Region;

  @ApiProperty({ enum: POLICY_ACTION_VALUES })
  @IsEnum(PolicyAction)
  public action!: PolicyAction;

  @ApiProperty({ enum: Object.values(EVALUATION_DECISION.deny.reasons) })
  @IsIn([EVALUATION_DECISION.deny.reasons.blocked_by_global_policy])
  public reason_code!: DecisionReason;
}
