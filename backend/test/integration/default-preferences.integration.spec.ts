import request from 'supertest';
import { SEED_DEFAULT_PREFERENCES } from '../../src/shared/fixtures/seed-data.fixture';
import {
  closeIntegrationTestContext,
  createIntegrationTestContext,
  INTEGRATION_API_KEY,
  type IntegrationTestContext,
} from './support/integration-test-context';

describe('Default preferences (integration)', () => {
  let ctx: IntegrationTestContext;

  beforeEach(async () => {
    ctx = await createIntegrationTestContext();
  });

  afterEach(async () => {
    await closeIntegrationTestContext(ctx);
  });

  it('GET /default-preferences/count returns total defaults', async () => {
    const res = await request(ctx.app.getHttpServer())
      .get('/api/v1/default-preferences/count')
      .set('X-API-Key', INTEGRATION_API_KEY)
      .expect(200);

    expect(res.body.count).toBe(SEED_DEFAULT_PREFERENCES.length);
  });

  it('GET /default-preferences returns seed defaults', async () => {
    const res = await request(ctx.app.getHttpServer())
      .get('/api/v1/default-preferences')
      .query({ limit: 100 })
      .set('X-API-Key', INTEGRATION_API_KEY)
      .expect(200);

    expect(res.body.preferences).toHaveLength(SEED_DEFAULT_PREFERENCES.length);
  });

  it('POST duplicate default preference returns 409', () => {
    return request(ctx.app.getHttpServer())
      .post('/api/v1/default-preferences')
      .set('X-API-Key', INTEGRATION_API_KEY)
      .send({
        region: null,
        notification_type: 'marketing',
        channel: 'email',
        enabled: false,
      })
      .expect(409);
  });

  it('POST regional default preference for same type and channel in another region returns 201', async () => {
    const res = await request(ctx.app.getHttpServer())
      .post('/api/v1/default-preferences')
      .set('X-API-Key', INTEGRATION_API_KEY)
      .send({
        region: 'RU',
        notification_type: 'marketing',
        channel: 'email',
        enabled: true,
      })
      .expect(201);

    expect(res.body.region).toBe('RU');
    expect(res.body.enabled).toBe(true);
  });

  it('PATCH /default-preferences/:id updates preference', async () => {
    const res = await request(ctx.app.getHttpServer())
      .patch('/api/v1/default-preferences/dp-1')
      .set('X-API-Key', INTEGRATION_API_KEY)
      .send({
        notification_type: 'marketing',
        channel: 'email',
        enabled: true,
      })
      .expect(200);

    expect(res.body.id).toBe('dp-1');
    expect(res.body.enabled).toBe(true);
  });

  it('DELETE /default-preferences/:id removes preference', async () => {
    await request(ctx.app.getHttpServer())
      .delete('/api/v1/default-preferences/dp-5')
      .set('X-API-Key', INTEGRATION_API_KEY)
      .expect(204);

    const count = await request(ctx.app.getHttpServer())
      .get('/api/v1/default-preferences/count')
      .set('X-API-Key', INTEGRATION_API_KEY)
      .expect(200);

    expect(count.body.count).toBe(SEED_DEFAULT_PREFERENCES.length - 1);
  });

  it('DELETE unknown default preference returns 404', () => {
    return request(ctx.app.getHttpServer())
      .delete('/api/v1/default-preferences/unknown')
      .set('X-API-Key', INTEGRATION_API_KEY)
      .expect(404);
  });
});
