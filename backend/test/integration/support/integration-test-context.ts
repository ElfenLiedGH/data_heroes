import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../../src/app.module';
import { PrismaService } from '../../../src/shared/prisma/prisma.service';
import {
  INSTANCE_ID,
  REDIS_PUBLISHER,
  REDIS_SUBSCRIBER,
} from '../../../src/shared/redis/redis.tokens';
import { createMockDb } from '../mocks/mock-db';
import type { MockDb } from '../mocks/mock-db.types';
import { buildMockPrisma } from '../mocks/mock-prisma';

export const INTEGRATION_API_KEY =
  process.env.API_KEY ?? 'dev-notification-prefs-key-7f3e9a2b';

export type IntegrationTestContext = {
  app: INestApplication;
  db: MockDb;
};

function buildMockRedisClient() {
  return {
    publish: jest.fn().mockResolvedValue(0),
    subscribe: jest.fn().mockResolvedValue(undefined),
    on: jest.fn(),
    removeAllListeners: jest.fn(),
    quit: jest.fn().mockResolvedValue('OK'),
  };
}

export async function createIntegrationTestContext(): Promise<IntegrationTestContext> {
  const db = createMockDb();
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(PrismaService)
    .useValue(buildMockPrisma(db))
    // Redis в интеграционных тестах не нужен — кеш загружается из mock БД,
    // pubsub-инвалидация не тестируется здесь. Подменяем ioredis-клиенты
    // и INSTANCE_ID на моки, чтобы AppModule.init() не зависел от живого
    // Redis-инстанса. Поведение pubsub-инвалидации покрыто unit-тестами
    // shared/cache/in-memory-cache.spec.ts.
    .overrideProvider(REDIS_PUBLISHER)
    .useValue(buildMockRedisClient())
    .overrideProvider(REDIS_SUBSCRIBER)
    .useValue(buildMockRedisClient())
    .overrideProvider(INSTANCE_ID)
    .useValue('integration-test-instance')
    .compile();

  const app = moduleFixture.createNestApplication();
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );
  await app.init();

  return { app, db };
}

export async function closeIntegrationTestContext(ctx: IntegrationTestContext) {
  await ctx.app.close();
}
