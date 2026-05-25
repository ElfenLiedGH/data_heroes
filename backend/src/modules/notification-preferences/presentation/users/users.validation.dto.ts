import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  ValidateNested,
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

export class PreferenceChangeBodyDto {
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

export class QuietHoursBodyDto {
  @ApiProperty({ type: String, example: '22:00' })
  @IsString()
  @Matches(/^(?:[01]\d|2[0-3]):[0-5]\d$/)
  public start_time!: string;

  @ApiProperty({ type: String, example: '08:00' })
  @IsString()
  @Matches(/^(?:[01]\d|2[0-3]):[0-5]\d$/)
  public end_time!: string;

  @ApiProperty({ type: String, example: 'Europe/Moscow' })
  @IsString()
  @IsNotEmpty()
  public timezone!: string;

  @ApiProperty({ type: Boolean })
  @IsBoolean()
  public enabled!: boolean;
}

export class UpdateUserPreferencesBodyDto {
  @ApiProperty({ type: () => PreferenceChangeBodyDto, isArray: true })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PreferenceChangeBodyDto)
  public changes!: PreferenceChangeBodyDto[];

  @ApiProperty({ type: () => QuietHoursBodyDto, required: false, nullable: true })
  @IsOptional()
  @ValidateNested()
  @Type(() => QuietHoursBodyDto)
  public quiet_hours?: QuietHoursBodyDto | null;

  @ApiProperty({ enum: REGION_VALUES, required: false })
  @IsOptional()
  @IsEnum(Region)
  public region?: Region;
}

export class CreateUserBodyDto {
  @ApiProperty({ type: String, example: 'user-13' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  public user_id!: string;

  @ApiProperty({ enum: REGION_VALUES })
  @IsEnum(Region)
  public region!: Region;
}
