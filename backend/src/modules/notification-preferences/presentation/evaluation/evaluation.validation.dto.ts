import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsISO8601,
  IsNotEmpty,
  IsString,
  MaxLength,
} from 'class-validator';
import {
  Channel,
  NotificationType,
  Region,
} from '../../../../../generated/client';
import {
  CHANNEL_VALUES,
  NOTIFICATION_TYPE_VALUES,
  REGION_VALUES,
} from '../../../../shared/constants';

export class EvaluateBodyDto {
  @ApiProperty({ type: String, example: 'user-01' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  public user_id!: string;

  @ApiProperty({ enum: NOTIFICATION_TYPE_VALUES })
  @IsEnum(NotificationType)
  public notification_type!: NotificationType;

  @ApiProperty({ enum: CHANNEL_VALUES })
  @IsEnum(Channel)
  public channel!: Channel;

  @ApiProperty({ enum: REGION_VALUES })
  @IsEnum(Region)
  public region!: Region;

  @ApiProperty({ type: String, example: '2026-05-21T21:30:00Z' })
  @IsISO8601()
  public datetime!: string;
}
