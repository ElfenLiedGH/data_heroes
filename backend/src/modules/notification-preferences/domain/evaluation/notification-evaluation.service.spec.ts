import {
  Channel,
  NotificationType,
  Region,
} from '../../../../../generated/client';
import { EVALUATION_DECISION } from '../../../../shared/constants';
import { NotificationEvaluationService } from './notification-evaluation.service';
import { SEED_GLOBAL_POLICIES, SEED_USER_PREFERENCES } from '../../../../shared/fixtures/seed-data.fixture';
import { getSeedQuietHours } from '../../../../shared/fixtures/seed-preferences.helper';

const globalPolicies = SEED_GLOBAL_POLICIES.map((p) => ({ ...p, id: 'policy-1' }));

function seedPrefsFor(userId: string) {
  return SEED_USER_PREFERENCES.filter((p) => p.user_id === userId).map((p) => ({
    notification_type: p.notification_type,
    channel: p.channel,
    enabled: p.enabled,
    source: p.source,
  }));
}

describe('NotificationEvaluationService', () => {
  const baseInput = {
    notification_type: NotificationType.transactional,
    channel: Channel.email,
    region: Region.US,
    datetime: '2026-05-21T12:00:00Z',
  };

  it('should allow transactional when enabled by user preference', () => {
    const result = NotificationEvaluationService.evaluate(
      baseInput,
      seedPrefsFor('user-01'),
      [],
      null,
    );
    expect(result.decision).toBe(EVALUATION_DECISION.allow.value);
    expect(result.reason).toBe(EVALUATION_DECISION.allow.reasons.allowed);
  });

  it('should allow transactional on sms channel independently', () => {
    const result = NotificationEvaluationService.evaluate(
      { ...baseInput, channel: Channel.sms },
      seedPrefsFor('user-01'),
      [],
      null,
    );
    expect(result.decision).toBe(EVALUATION_DECISION.allow.value);
    expect(result.reason).toBe(EVALUATION_DECISION.allow.reasons.allowed);
  });

  it('should deny marketing sms for EU by global policy', () => {
    const result = NotificationEvaluationService.evaluate(
      {
        notification_type: NotificationType.marketing,
        channel: Channel.sms,
        region: Region.EU,
        datetime: '2026-05-21T12:00:00Z',
      },
      seedPrefsFor('user-07'),
      globalPolicies,
      null,
    );
    expect(result.decision).toBe(EVALUATION_DECISION.deny.value);
    expect(result.reason).toBe(EVALUATION_DECISION.deny.reasons.blocked_by_global_policy);
  });

  it('should deny when disabled by user preference', () => {
    const result = NotificationEvaluationService.evaluate(
      {
        notification_type: NotificationType.marketing,
        channel: Channel.email,
        region: Region.US,
        datetime: '2026-05-21T12:00:00Z',
      },
      seedPrefsFor('user-03'),
      globalPolicies,
      null,
    );
    expect(result.decision).toBe(EVALUATION_DECISION.deny.value);
    expect(result.reason).toBe(EVALUATION_DECISION.deny.reasons.disabled_by_user_preference);
  });

  it('should deny marketing during quiet hours', () => {
    const user08Prefs = seedPrefsFor('user-08').map((p) =>
      p.notification_type === NotificationType.marketing && p.channel === Channel.push
        ? { ...p, enabled: true }
        : p,
    );

    const result = NotificationEvaluationService.evaluate(
      {
        notification_type: NotificationType.marketing,
        channel: Channel.push,
        region: Region.US,
        datetime: '2026-05-22T02:30:00Z',
      },
      user08Prefs,
      globalPolicies,
      {
        start_time: '22:00',
        end_time: '08:00',
        timezone: 'America/New_York',
        enabled: true,
      },
    );
    expect(result.decision).toBe(EVALUATION_DECISION.deny.value);
    expect(result.reason).toBe(EVALUATION_DECISION.deny.reasons.blocked_by_quiet_hours);
  });

  it('should allow transactional during quiet hours', () => {
    const result = NotificationEvaluationService.evaluate(
      {
        notification_type: NotificationType.transactional,
        channel: Channel.push,
        region: Region.US,
        datetime: '2026-05-21T23:30:00Z',
      },
      seedPrefsFor('user-01'),
      globalPolicies,
      {
        start_time: '22:00',
        end_time: '08:00',
        timezone: 'America/New_York',
        enabled: true,
      },
    );
    expect(result.decision).toBe(EVALUATION_DECISION.allow.value);
  });

  describe('user-10 quiet hours Asia/Tokyo', () => {
    const evaluatedAt = '2026-05-21T14:00:00Z';
    const quietHours = getSeedQuietHours('user-10')!;
    const user10Overrides = seedPrefsFor('user-10');

    it('should allow transactional email during quiet hours', () => {
      const result = NotificationEvaluationService.evaluate(
        {
          notification_type: NotificationType.transactional,
          channel: Channel.email,
          region: Region.RU,
          datetime: evaluatedAt,
        },
        user10Overrides,
        globalPolicies,
        quietHours,
      );
      expect(result.decision).toBe(EVALUATION_DECISION.allow.value);
      expect(result.reason).toBe(EVALUATION_DECISION.allow.reasons.allowed);
    });

    it('should deny marketing email during quiet hours', () => {
      const result = NotificationEvaluationService.evaluate(
        {
          notification_type: NotificationType.marketing,
          channel: Channel.email,
          region: Region.RU,
          datetime: evaluatedAt,
        },
        user10Overrides,
        globalPolicies,
        quietHours,
      );
      expect(result.decision).toBe(EVALUATION_DECISION.deny.value);
      expect(result.reason).toBe(EVALUATION_DECISION.deny.reasons.blocked_by_quiet_hours);
    });
  });
});
