import { ApiProperty } from '@nestjs/swagger';

export class HealthResponseDto {
  @ApiProperty({ type: String, example: 'ok' })
  public readonly status!: string;

  @ApiProperty({ type: String, example: 'ok', required: false })
  public readonly db?: string;
}
