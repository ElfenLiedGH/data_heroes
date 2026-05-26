import 'dotenv/config';
import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ApiKeyGuard } from './shared/auth/api-key.guard';
import { HttpExceptionFilter } from './shared/filters/http-exception.filter';
import { MetricsModule } from './shared/metrics/metrics.module';
import { PrismaModule } from './shared/prisma/prisma.module';
import { RedisModule } from './shared/redis/redis.module';
import { NotificationPreferencesModule } from './modules/notification-preferences/notification-preferences.module';

@Module({
  imports: [MetricsModule, PrismaModule, RedisModule, NotificationPreferencesModule],
  providers: [
   { provide: APP_GUARD, useClass: ApiKeyGuard },
   { provide: APP_FILTER, useClass: HttpExceptionFilter },
  ],
})
export class AppModule {}
