import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../../src/app.module';
import { PrismaService } from '../../../src/shared/prisma/prisma.service';
import { createMockDb } from '../mocks/mock-db';
import type { MockDb } from '../mocks/mock-db.types';
import { buildMockPrisma } from '../mocks/mock-prisma';

export const INTEGRATION_API_KEY =
  process.env.API_KEY ?? 'dev-notification-prefs-key-7f3e9a2b';

export type IntegrationTestContext = {
  app: INestApplication;
  db: MockDb;
};

export async function createIntegrationTestContext(): Promise<IntegrationTestContext> {
  const db = createMockDb();
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(PrismaService)
    .useValue(buildMockPrisma(db))
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
