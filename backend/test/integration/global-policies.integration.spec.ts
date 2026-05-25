import request from 'supertest';
import {
  closeIntegrationTestContext,
  createIntegrationTestContext,
  INTEGRATION_API_KEY,
  type IntegrationTestContext,
} from './support/integration-test-context';

describe('Global policies (integration)', () => {
  let ctx: IntegrationTestContext;

  beforeEach(async () => {
    ctx = await createIntegrationTestContext();
  });

  afterEach(async () => {
    await closeIntegrationTestContext(ctx);
  });

  it('GET /global-policies/count returns total policies', async () => {
    const res = await request(ctx.app.getHttpServer())
      .get('/api/v1/global-policies/count')
      .set('X-API-Key', INTEGRATION_API_KEY)
      .expect(200);

    expect(res.body.count).toBe(1);
  });

  it('GET /global-policies returns seed policy', async () => {
    const res = await request(ctx.app.getHttpServer())
      .get('/api/v1/global-policies')
      .query({ limit: 100 })
      .set('X-API-Key', INTEGRATION_API_KEY)
      .expect(200);

    expect(res.body.policies).toHaveLength(1);
    expect(res.body.policies[0].notification_type).toBe('marketing');
    expect(res.body.policies[0].channel).toBe('sms');
    expect(res.body.policies[0].region).toBe('EU');
  });

  it('GET /global-policies supports offset and limit', async () => {
    await request(ctx.app.getHttpServer())
      .post('/api/v1/global-policies')
      .set('X-API-Key', INTEGRATION_API_KEY)
      .send({
        notification_type: 'marketing',
        channel: 'email',
        region: 'US',
        action: 'deny',
        reason_code: 'blocked_by_global_policy',
      })
      .expect(201);

    const page = await request(ctx.app.getHttpServer())
      .get('/api/v1/global-policies')
      .query({ offset: 1, limit: 1 })
      .set('X-API-Key', INTEGRATION_API_KEY)
      .expect(200);

    expect(page.body.policies).toHaveLength(1);
  });

  it('POST /global-policies creates policy', async () => {
    const res = await request(ctx.app.getHttpServer())
      .post('/api/v1/global-policies')
      .set('X-API-Key', INTEGRATION_API_KEY)
      .send({
        notification_type: 'marketing',
        channel: 'email',
        region: 'US',
        action: 'deny',
        reason_code: 'blocked_by_global_policy',
      })
      .expect(201);

    expect(res.body.notification_type).toBe('marketing');
    expect(res.body.channel).toBe('email');
    expect(res.body.region).toBe('US');

    const list = await request(ctx.app.getHttpServer())
      .get('/api/v1/global-policies')
      .query({ limit: 100 })
      .set('X-API-Key', INTEGRATION_API_KEY)
      .expect(200);

    expect(list.body.policies).toHaveLength(2);
  });

  it('POST duplicate policy returns 409', () => {
    return request(ctx.app.getHttpServer())
      .post('/api/v1/global-policies')
      .set('X-API-Key', INTEGRATION_API_KEY)
      .send({
        notification_type: 'marketing',
        channel: 'sms',
        region: 'EU',
        action: 'deny',
        reason_code: 'blocked_by_global_policy',
      })
      .expect(409);
  });

  it('PATCH /global-policies/:id updates policy', async () => {
    const res = await request(ctx.app.getHttpServer())
      .patch('/api/v1/global-policies/gp-0')
      .set('X-API-Key', INTEGRATION_API_KEY)
      .send({
        notification_type: 'marketing',
        channel: 'sms',
        region: 'EU',
        action: 'deny',
        reason_code: 'blocked_by_global_policy',
      })
      .expect(200);

    expect(res.body.id).toBe('gp-0');
  });

  it('DELETE /global-policies/:id removes policy', async () => {
    const created = await request(ctx.app.getHttpServer())
      .post('/api/v1/global-policies')
      .set('X-API-Key', INTEGRATION_API_KEY)
      .send({
        notification_type: 'marketing',
        channel: 'push',
        region: 'GLOBAL',
        action: 'deny',
        reason_code: 'blocked_by_global_policy',
      })
      .expect(201);

    await request(ctx.app.getHttpServer())
      .delete(`/api/v1/global-policies/${created.body.id}`)
      .set('X-API-Key', INTEGRATION_API_KEY)
      .expect(204);

    const list = await request(ctx.app.getHttpServer())
      .get('/api/v1/global-policies')
      .query({ limit: 100 })
      .set('X-API-Key', INTEGRATION_API_KEY)
      .expect(200);

    expect(list.body.policies.some((p: { id: string }) => p.id === created.body.id)).toBe(
      false,
    );
  });

  it('DELETE unknown policy returns 404', () => {
    return request(ctx.app.getHttpServer())
      .delete('/api/v1/global-policies/unknown')
      .set('X-API-Key', INTEGRATION_API_KEY)
      .expect(404);
  });
});
