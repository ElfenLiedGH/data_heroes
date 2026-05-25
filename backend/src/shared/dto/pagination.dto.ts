import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class PaginationQueryDto {
  @ApiPropertyOptional({ type: Number, default: 0, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  public offset?: number;

  @ApiPropertyOptional({ type: Number, default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  public limit?: number;
}

export class CountResponseDto {
  @ApiProperty({ type: Number, example: 12 })
  public readonly count!: number;
}

export const DEFAULT_PAGINATION = {
  offset: 0,
  limit: 20,
} as const;

export function resolvePagination(query: PaginationQueryDto) {
  return {
    offset: query.offset ?? DEFAULT_PAGINATION.offset,
    limit: query.limit ?? DEFAULT_PAGINATION.limit,
  };
}
