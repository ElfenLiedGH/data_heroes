import { ApiProperty } from '@nestjs/swagger';
import {
  Channel,
  NotificationType,
  Region,
} from '../../../../../generated/client';
import {
  CHANNEL_VALUES,
  NOTIFICATION_TYPE_VALUES,
  PREFERENCE_SOURCE_VALUES,
  REGION_VALUES,
} from '../../../../shared/constants';

export class PreferenceItemDto {
  @ApiProperty({ enum: NOTIFICATION_TYPE_VALUES })
  public readonly notification_type!: NotificationType;

  @ApiProperty({ enum: CHANNEL_VALUES })
  public readonly channel!: Channel;

  @ApiProperty({ type: Boolean })
  public readonly enabled!: boolean;

  @ApiProperty({ enum: PREFERENCE_SOURCE_VALUES, nullable: true })
  public readonly source!: string | null;

  @ApiProperty({ type: Boolean })
  public readonly blocked_by_global!: boolean;
}

export class QuietHoursDto {
  @ApiProperty({ type: String, example: '22:00' })
  public readonly start_time!: string;

  @ApiProperty({ type: String, example: '08:00' })
  public readonly end_time!: string;

  @ApiProperty({ type: String, example: 'Europe/Moscow' })
  public readonly timezone!: string;

  @ApiProperty({ type: Boolean })
  public readonly enabled!: boolean;
}

export class UserPreferencesResponseDto {
  @ApiProperty({ type: String, example: 'user-01' })
  public readonly user_id!: string;

  @ApiProperty({ enum: REGION_VALUES })
  public readonly region!: Region;

  @ApiProperty({ type: () => PreferenceItemDto, isArray: true })
  public readonly preferences!: PreferenceItemDto[];

  @ApiProperty({ type: () => QuietHoursDto, nullable: true })
  public readonly quiet_hours!: QuietHoursDto | null;
}

export class UserListItemDto {
  @ApiProperty({ type: String, example: 'user-01' })
  public readonly user_id!: string;

  @ApiProperty({ enum: REGION_VALUES })
  public readonly region!: Region;

  @ApiProperty({ type: String, example: '2026-05-25T10:00:00.000Z' })
  public readonly created_at!: string;

  @ApiProperty({ type: () => PreferenceItemDto, isArray: true })
  public readonly preferences!: PreferenceItemDto[];
}

export class UsersListResponseDto {
  @ApiProperty({ type: () => UserListItemDto, isArray: true })
  public readonly users!: UserListItemDto[];
}

export class CreateUserResponseDto {
  @ApiProperty({ type: String, example: 'user-13' })
  public readonly user_id!: string;

  @ApiProperty({ enum: REGION_VALUES })
  public readonly region!: Region;
}
