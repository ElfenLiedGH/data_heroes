import { ApiProperty } from '@nestjs/swagger';
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

export class DefaultPreferenceItemDto {
  @ApiProperty({ type: String })
  public readonly id!: string;

  @ApiProperty({ enum: REGION_VALUES, nullable: true })
  public readonly region!: Region | null;

  @ApiProperty({ enum: NOTIFICATION_TYPE_VALUES })
  public readonly notification_type!: NotificationType;

  @ApiProperty({ enum: CHANNEL_VALUES })
  public readonly channel!: Channel;

  @ApiProperty({ type: Boolean })
  public readonly enabled!: boolean;

  @ApiProperty({ type: String, example: '2026-05-25T10:00:00.000Z' })
  public readonly created_at!: string;

  @ApiProperty({ type: String, example: '2026-05-25T10:00:00.000Z' })
  public readonly updated_at!: string;
}

export class DefaultPreferencesListResponseDto {
  @ApiProperty({ type: () => DefaultPreferenceItemDto, isArray: true })
  public readonly preferences!: DefaultPreferenceItemDto[];
}
