import request from 'supertest';
import { SEED_USER_PREFERENCES } from '../../src/shared/fixtures/seed-data.fixture';
import {
  findPreferenceByKey,
  getSeedQuietHours,
  getSeedUserRegion,
  parsePreferenceKey,
  resolveSeedEffectivePreferences,
  SEED_PREFERENCE_SCENARIOS,
} from '../../src/shared/fixtures/seed-preferences.helper';
import { PREFERENCE_SOURCE } from '../../src/shared/constants';
import {
  closeIntegrationTestContext,
  createIntegrationTestContext,
  INTEGRATION_API_KEY,
  type IntegrationTestContext,
} from './support/integration-test-context';

describe('User preferences (integration)', () => {
  let ctx: IntegrationTestContext;

  beforeEach(async () => {
    ctx = await createIntegrationTestContext();
  });

  afterEach(async () => {
    await closeIntegrationTestContext(ctx);
  });

  describe('GET /users/:user_id/preferences seed scenarios', () => {
    describe.each(SEED_PREFERENCE_SCENARIOS)(
      '$user_id ($description)',
      ({ user_id, expect_no_source, expect_blocked, expect_user }) => {
        it('returns effective preferences matching seed resolver', async () => {
          const res = await request(ctx.app.getHttpServer())
            .get(`/api/v1/users/${user_id}/preferences`)
            .set('X-API-Key', INTEGRATION_API_KEY)
            .expect(200);

          const expected = resolveSeedEffectivePreferences(user_id);
          expect(res.body.user_id).toBe(user_id);
          expect(res.body.region).toBe(getSeedUserRegion(user_id));
          expect(res.body.preferences).toEqual(expected);
        });

        it('returns correct source distribution', async () => {
          const res = await request(ctx.app.getHttpServer())
            .get(`/api/v1/users/${user_id}/preferences`)
            .set('X-API-Key', INTEGRATION_API_KEY)
            .expect(200);

          const prefs = res.body.preferences as Array<{
            notification_type: string;
            channel: string;
            source: string;
            enabled: boolean;
            blocked_by_global: boolean;
          }>;

          if (expect_no_source) {
            expect(
              prefs.every((p: { source: string | null }) => p.source === null),
            ).toBe(true);
          }

          for (const key of expect_blocked) {
            const pref = findPreferenceByKey(prefs, key);
            expect(pref?.enabled).toBe(false);
            expect(pref?.blocked_by_global).toBe(true);
            expect(pref?.source).toBe(PREFERENCE_SOURCE.GLOBAL);
          }

          for (const key of expect_user) {
            const pref = findPreferenceByKey(prefs, key);
            expect(pref?.source).toBe(PREFERENCE_SOURCE.USER);
            const { notification_type, channel } = parsePreferenceKey(key);
            const override = SEED_USER_PREFERENCES.find(
              (o) =>
                o.user_id === user_id &&
                o.notification_type === notification_type &&
                o.channel === channel,
            );
            expect(pref?.enabled).toBe(override?.enabled);
          }
        });

        it('returns quiet hours from seed or null', async () => {
          const res = await request(ctx.app.getHttpServer())
            .get(`/api/v1/users/${user_id}/preferences`)
            .set('X-API-Key', INTEGRATION_API_KEY)
            .expect(200);

          expect(res.body.quiet_hours).toEqual(getSeedQuietHours(user_id));
        });
      },
    );

    it('returns 404 for unknown user', () => {
      return request(ctx.app.getHttpServer())
        .get('/api/v1/users/unknown-user/preferences')
        .set('X-API-Key', INTEGRATION_API_KEY)
        .expect(404);
    });
  });

  it('POST user-07 enable marketing sms returns 403', () => {
    return request(ctx.app.getHttpServer())
      .post('/api/v1/users/user-07/preferences')
      .set('X-API-Key', INTEGRATION_API_KEY)
      .send({
        changes: [
          { notification_type: 'marketing', channel: 'sms', enabled: true },
        ],
      })
      .expect(403);
  });

  it('POST user-02 enable marketing sms returns 200', async () => {
    await request(ctx.app.getHttpServer())
      .post('/api/v1/users/user-02/preferences')
      .set('X-API-Key', INTEGRATION_API_KEY)
      .send({
        changes: [
          { notification_type: 'marketing', channel: 'sms', enabled: true },
        ],
      })
      .expect(200);
  });

  it('POST quiet_hours null deletes quiet hours for user-04', async () => {
    const before = await request(ctx.app.getHttpServer())
      .get('/api/v1/users/user-04/preferences')
      .set('X-API-Key', INTEGRATION_API_KEY)
      .expect(200);

    expect(before.body.quiet_hours).not.toBeNull();

    await request(ctx.app.getHttpServer())
      .post('/api/v1/users/user-04/preferences')
      .set('X-API-Key', INTEGRATION_API_KEY)
      .send({ changes: [], quiet_hours: null })
      .expect(200);

    const after = await request(ctx.app.getHttpServer())
      .get('/api/v1/users/user-04/preferences')
      .set('X-API-Key', INTEGRATION_API_KEY)
      .expect(200);

    expect(after.body.quiet_hours).toBeNull();
  });
});
