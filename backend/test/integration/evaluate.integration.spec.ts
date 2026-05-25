import request from 'supertest';
import { Decision, DecisionReason } from '../../generated/client';
import {
  closeIntegrationTestContext,
  createIntegrationTestContext,
  INTEGRATION_API_KEY,
  type IntegrationTestContext,
} from './support/integration-test-context';

describe('Evaluate (integration)', () => {
  let ctx: IntegrationTestContext;

  beforeEach(async () => {
    ctx = await createIntegrationTestContext();
  });

  afterEach(async () => {
    await closeIntegrationTestContext(ctx);
  });

  it('evaluate unknown user returns 404', () => {
    return request(ctx.app.getHttpServer())
      .post('/api/v1/evaluate')
      .set('X-API-Key', INTEGRATION_API_KEY)
      .send({
        user_id: 'unknown-user',
        notification_type: 'marketing',
        channel: 'email',
        region: 'US',
        datetime: '2026-05-21T12:00:00Z',
      })
      .expect(404);
  });

  it('evaluate user-03 marketing email returns disabled_by_user_preference', async () => {
    const res = await request(ctx.app.getHttpServer())
      .post('/api/v1/evaluate')
      .set('X-API-Key', INTEGRATION_API_KEY)
      .send({
        user_id: 'user-03',
        notification_type: 'marketing',
        channel: 'email',
        region: 'US',
        datetime: '2026-05-21T12:00:00Z',
      })
      .expect(200);

    expect(res.body.decision).toBe(Decision.deny);
    expect(res.body.reason).toBe(DecisionReason.disabled_by_user_preference);
  });

  it('evaluate user-10 transactional email during quiet hours returns allow', async () => {
    const res = await request(ctx.app.getHttpServer())
      .post('/api/v1/evaluate')
      .set('X-API-Key', INTEGRATION_API_KEY)
      .send({
        user_id: 'user-10',
        notification_type: 'transactional',
        channel: 'email',
        region: 'RU',
        datetime: '2026-05-21T14:00:00Z',
      })
      .expect(200);

    expect(res.body.decision).toBe(Decision.allow);
    expect(res.body.reason).toBe(DecisionReason.allowed);
  });

  it('evaluate user-10 marketing email during quiet hours returns blocked_by_quiet_hours', async () => {
    const res = await request(ctx.app.getHttpServer())
      .post('/api/v1/evaluate')
      .set('X-API-Key', INTEGRATION_API_KEY)
      .send({
        user_id: 'user-10',
        notification_type: 'marketing',
        channel: 'email',
        region: 'RU',
        datetime: '2026-05-21T14:00:00Z',
      })
      .expect(200);

    expect(res.body.decision).toBe(Decision.deny);
    expect(res.body.reason).toBe(DecisionReason.blocked_by_quiet_hours);
  });
});
