import request from 'supertest';
import { SEED_USERS } from '../../src/shared/fixtures/seed-data.fixture';
import {
  closeIntegrationTestContext,
  createIntegrationTestContext,
  INTEGRATION_API_KEY,
  type IntegrationTestContext,
} from './support/integration-test-context';

describe('Users (integration)', () => {
  let ctx: IntegrationTestContext;

  beforeEach(async () => {
    ctx = await createIntegrationTestContext();
  });

  afterEach(async () => {
    await closeIntegrationTestContext(ctx);
  });

  it('GET /users returns preferences with source badges data', async () => {
    const res = await request(ctx.app.getHttpServer())
      .get('/api/v1/users')
      .query({ limit: 100 })
      .set('X-API-Key', INTEGRATION_API_KEY)
      .expect(200);

    expect(res.body.users.length).toBeGreaterThan(0);
    const user02 = res.body.users.find((u: { user_id: string }) => u.user_id === 'user-02');
    expect(user02.preferences).toHaveLength(6);
    const email = user02.preferences.find(
      (p: { notification_type: string; channel: string }) =>
        p.notification_type === 'marketing' && p.channel === 'email',
    );
    expect(email.enabled).toBe(true);
    expect(email.source).toBe('user');

    const user07 = res.body.users.find((u: { user_id: string }) => u.user_id === 'user-07');
    const sms = user07.preferences.find(
      (p: { notification_type: string; channel: string }) =>
        p.notification_type === 'marketing' && p.channel === 'sms',
    );
    expect(sms.source).toBe('global');
    expect(sms.enabled).toBe(false);
    expect(sms.blocked_by_global).toBe(true);
  });

  it('GET /users/count returns total users', async () => {
    const res = await request(ctx.app.getHttpServer())
      .get('/api/v1/users/count')
      .set('X-API-Key', INTEGRATION_API_KEY)
      .expect(200);

    expect(res.body.count).toBe(SEED_USERS.length);
  });

  it('GET /users supports search by partial user id', async () => {
    const res = await request(ctx.app.getHttpServer())
      .get('/api/v1/users')
      .query({ search: 'user-0', limit: 100 })
      .set('X-API-Key', INTEGRATION_API_KEY)
      .expect(200);

    expect(res.body.users.length).toBeGreaterThan(0);
    expect(res.body.users.every((u: { user_id: string }) => u.user_id.includes('user-0'))).toBe(
      true,
    );
    expect(res.body.users.some((u: { user_id: string }) => u.user_id === 'user-01')).toBe(true);
    expect(res.body.users.some((u: { user_id: string }) => u.user_id === 'user-12')).toBe(false);
  });

  it('GET /users/count supports search filter', async () => {
    const all = await request(ctx.app.getHttpServer())
      .get('/api/v1/users/count')
      .set('X-API-Key', INTEGRATION_API_KEY)
      .expect(200);

    const filtered = await request(ctx.app.getHttpServer())
      .get('/api/v1/users/count')
      .query({ search: 'user-01' })
      .set('X-API-Key', INTEGRATION_API_KEY)
      .expect(200);

    expect(filtered.body.count).toBe(1);
    expect(filtered.body.count).toBeLessThan(all.body.count);
  });

  it('GET /users supports offset and limit', async () => {
    const page1 = await request(ctx.app.getHttpServer())
      .get('/api/v1/users')
      .query({ offset: 0, limit: 2 })
      .set('X-API-Key', INTEGRATION_API_KEY)
      .expect(200);

    const page2 = await request(ctx.app.getHttpServer())
      .get('/api/v1/users')
      .query({ offset: 2, limit: 2 })
      .set('X-API-Key', INTEGRATION_API_KEY)
      .expect(200);

    expect(page1.body.users).toHaveLength(2);
    expect(page2.body.users).toHaveLength(2);
    expect(page1.body.users[0].user_id).not.toBe(page2.body.users[0].user_id);
  });

  describe('POST /users', () => {
    it('creates user with copied default preferences', async () => {
      const res = await request(ctx.app.getHttpServer())
        .post('/api/v1/users')
        .set('X-API-Key', INTEGRATION_API_KEY)
        .send({ user_id: 'user-new', region: 'US' })
        .expect(201);

      expect(res.body.user_id).toBe('user-new');
      expect(res.body.region).toBe('US');

      const prefs = await request(ctx.app.getHttpServer())
        .get('/api/v1/users/user-new/preferences')
        .set('X-API-Key', INTEGRATION_API_KEY)
        .expect(200);

      expect(prefs.body.preferences).toHaveLength(6);
      expect(
        prefs.body.preferences.every((p: { source: string | null }) => p.source === null),
      ).toBe(true);
    });

    it('returns 409 when user already exists', () => {
      return request(ctx.app.getHttpServer())
        .post('/api/v1/users')
        .set('X-API-Key', INTEGRATION_API_KEY)
        .send({ user_id: 'user-01', region: 'US' })
        .expect(409);
    });
  });

  it('DELETE user returns 204 then GET 404', async () => {
    await request(ctx.app.getHttpServer())
      .delete('/api/v1/users/user-01')
      .set('X-API-Key', INTEGRATION_API_KEY)
      .expect(204);

    await request(ctx.app.getHttpServer())
      .get('/api/v1/users/user-01/preferences')
      .set('X-API-Key', INTEGRATION_API_KEY)
      .expect(404);
  });
});
