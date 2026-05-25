import { Channel, NotificationType, Region } from '../../../../../generated/client';
import { PREFERENCE_SOURCE } from '../../../../shared/constants';
import {
  resolveSeedEffectivePreferences,
  SEED_PREFERENCE_SCENARIOS,
  findPreferenceByKey,
  parsePreferenceKey,
  getSeedUserPreferenceRows,
} from '../../../../shared/fixtures/seed-preferences.helper';
import { SEED_GLOBAL_POLICIES, SEED_USER_PREFERENCES } from '../../../../shared/fixtures/seed-data.fixture';
import { PreferenceResolver } from './preference-resolver';

function findPref(
  prefs: ReturnType<typeof resolveSeedEffectivePreferences>,
  type: NotificationType,
  channel: Channel,
) {
  return prefs.find(
    (p) => p.notification_type === type && p.channel === channel,
  );
}

describe('PreferenceResolver', () => {
  const globalPolicies = SEED_GLOBAL_POLICIES.map((p) => ({ ...p, id: 'policy-seed' }));

  it('should return 6 rows without source badges for US without overrides', () => {
    const userPrefs = getSeedUserPreferenceRows('user-01');
    const result = PreferenceResolver.resolveEffectivePreferences(
      Region.US,
      userPrefs,
      [],
    );
    expect(result).toHaveLength(6);
    expect(result.every((r) => r.source === null)).toBe(true);
    expect(result.every((r) => r.blocked_by_global === false)).toBe(true);
  });

  it('should block EU marketing sms with global source', () => {
    const userPrefs = getSeedUserPreferenceRows('user-07');
    const result = PreferenceResolver.resolveEffectivePreferences(
      Region.EU,
      userPrefs,
      globalPolicies,
    );
    const sms = findPref(result, NotificationType.marketing, Channel.sms);
    expect(sms?.enabled).toBe(false);
    expect(sms?.source).toBe(PREFERENCE_SOURCE.GLOBAL);
    expect(sms?.blocked_by_global).toBe(true);
  });

  it('should not apply EU global policy to US region', () => {
    const result = resolveSeedEffectivePreferences('user-01');
    const sms = findPref(result, NotificationType.marketing, Channel.sms);
    expect(sms?.source).toBe(null);
    expect(sms?.enabled).toBe(false);
    expect(sms?.blocked_by_global).toBe(false);
  });

  it('should not apply EU global policy to GLOBAL region', () => {
    const result = resolveSeedEffectivePreferences('user-09');
    const sms = findPref(result, NotificationType.marketing, Channel.sms);
    expect(sms?.source).toBe(null);
    expect(sms?.blocked_by_global).toBe(false);
  });

  describe.each(SEED_PREFERENCE_SCENARIOS)(
    'seed user $user_id ($description)',
    ({ user_id, expect_no_source, expect_blocked, expect_user }) => {
      it('should return 6 preference rows', () => {
        expect(resolveSeedEffectivePreferences(user_id)).toHaveLength(6);
      });

      it('should match expected source distribution', () => {
        const prefs = resolveSeedEffectivePreferences(user_id);

        if (expect_no_source) {
          expect(prefs.every((p) => p.source === null)).toBe(true);
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

        const globalCount = prefs.filter(
          (p) => p.source === PREFERENCE_SOURCE.GLOBAL,
        ).length;
        const userCount = prefs.filter((p) => p.source === PREFERENCE_SOURCE.USER).length;
        const nullCount = prefs.filter((p) => p.source === null).length;

        expect(globalCount + userCount + nullCount).toBe(6);
      });
    },
  );

  it('user-02 marketing email should override default false to enabled', () => {
    const result = resolveSeedEffectivePreferences('user-02');
    const email = findPref(result, NotificationType.marketing, Channel.email);
    expect(email).toEqual({
      notification_type: NotificationType.marketing,
      channel: Channel.email,
      enabled: true,
      source: PREFERENCE_SOURCE.USER,
      blocked_by_global: false,
    });
  });

  it('user-03 marketing email should keep user disabled override', () => {
    const result = resolveSeedEffectivePreferences('user-03');
    const email = findPref(result, NotificationType.marketing, Channel.email);
    expect(email?.enabled).toBe(false);
    expect(email?.source).toBe(PREFERENCE_SOURCE.USER);
  });

  it('user-05 EU should combine blocked marketing sms and user marketing push', () => {
    const result = resolveSeedEffectivePreferences('user-05');
    const sms = findPref(result, NotificationType.marketing, Channel.sms);
    expect(sms?.source).toBe(PREFERENCE_SOURCE.GLOBAL);
    expect(sms?.blocked_by_global).toBe(true);
    expect(findPref(result, NotificationType.marketing, Channel.push)?.source).toBe(
      PREFERENCE_SOURCE.USER,
    );
    expect(findPref(result, NotificationType.marketing, Channel.push)?.enabled).toBe(
      true,
    );
  });

  it('user-07 EU global blocks marketing sms with global source', () => {
    const result = resolveSeedEffectivePreferences('user-07');
    const sms = findPref(result, NotificationType.marketing, Channel.sms);
    expect(sms?.source).toBe(PREFERENCE_SOURCE.GLOBAL);
    expect(sms?.blocked_by_global).toBe(true);
    expect(sms?.enabled).toBe(false);
  });

  it('user-08 transactional push disabled by user override', () => {
    const result = resolveSeedEffectivePreferences('user-08');
    const push = findPref(result, NotificationType.transactional, Channel.push);
    expect(push?.enabled).toBe(false);
    expect(push?.source).toBe(PREFERENCE_SOURCE.USER);
  });

  it('user-10 should have two user overrides', () => {
    const result = resolveSeedEffectivePreferences('user-10');
    const userRows = result.filter((p) => p.source === PREFERENCE_SOURCE.USER);
    expect(userRows).toHaveLength(2);
  });
});
