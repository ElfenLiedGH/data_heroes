import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
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

export class DefaultPreferenceBodyDto {
  @ApiProperty({ enum: REGION_VALUES, required: false, nullable: true })
  @IsOptional()
  @IsEnum(Region)
  public region?: Region | null;

  @ApiProperty({ enum: NOTIFICATION_TYPE_VALUES })
  @IsEnum(NotificationType)
  public notification_type!: NotificationType;

  @ApiProperty({ enum: CHANNEL_VALUES })
  @IsEnum(Channel)
  public channel!: Channel;

  @ApiProperty({ type: Boolean })
  @IsBoolean()
  public enabled!: boolean;
}

export class UpdateDefaultPreferenceBodyDto {
  @ApiProperty({ enum: NOTIFICATION_TYPE_VALUES })
  @IsEnum(NotificationType)
  public notification_type!: NotificationType;

  @ApiProperty({ enum: CHANNEL_VALUES })
  @IsEnum(Channel)
  public channel!: Channel;

  @ApiProperty({ type: Boolean })
  @IsBoolean()
  public enabled!: boolean;
}
