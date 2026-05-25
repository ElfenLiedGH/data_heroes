import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from './pagination.dto';

export class UsersListQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Partial match filter by user id' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  public search?: string;
}

export function resolveUserSearch(search?: string) {
  const trimmed = search?.trim();
  return trimmed || undefined;
}
