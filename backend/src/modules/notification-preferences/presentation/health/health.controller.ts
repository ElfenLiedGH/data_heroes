import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../../../../shared/auth/public.decorator';
import { PrismaService } from '../../../../shared/prisma/prisma.service';
import { HealthResponseDto } from './health.dto';

@ApiTags('health')
@Controller()
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get('health')
  @ApiOperation({ summary: 'Health check', operationId: 'getHealth' })
  @ApiResponse({ status: 200, type: HealthResponseDto })
  public async health(): Promise<HealthResponseDto> {
   try {
     await this.prisma.$queryRaw`SELECT 1`;
     return { status: 'ok', db: 'ok' };
   } catch {
     return { status: 'degraded', db: 'error' };
   }
  }
}
