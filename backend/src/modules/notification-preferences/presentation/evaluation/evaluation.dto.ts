import { ApiProperty } from '@nestjs/swagger';
import {
  Decision,
  DecisionReason,
} from '../../../../../generated/client';
import {
  DECISION_REASON_VALUES,
  DECISION_VALUES,
} from '../../../../shared/constants';

export class EvaluateResponseDto {
  @ApiProperty({ enum: DECISION_VALUES })
  public readonly decision!: Decision;

  @ApiProperty({ enum: DECISION_REASON_VALUES })
  public readonly reason!: DecisionReason;
}
