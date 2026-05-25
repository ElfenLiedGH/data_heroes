import request from 'supertest';
import {
  closeIntegrationTestContext,
  createIntegrationTestContext,
  INTEGRATION_API_KEY,
  type IntegrationTestContext,
} from './support/integration-test-context';

describe('Health (integration)', () => {
  let ctx: IntegrationTestContext;

  beforeEach(async () => {
    ctx = await createIntegrationTestContext();
  });

  afterEach(async () => {
    await closeIntegrationTestContext(ctx);
  });

  it('GET /health without api key returns 200', () => {
    return request(ctx.app.getHttpServer()).get('/api/v1/health').expect(200);
  });

  it('GET /users without api key returns 401', () => {
    return request(ctx.app.getHttpServer()).get('/api/v1/users').expect(401);
  });

  it('GET /users with api key returns 200', () => {
    return request(ctx.app.getHttpServer())
      .get('/api/v1/users')
      .set('X-API-Key', INTEGRATION_API_KEY)
      .expect(200);
  });
});
