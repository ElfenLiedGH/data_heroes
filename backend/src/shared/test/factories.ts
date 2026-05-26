import {
  Channel,
  Decision,
  DecisionReason,
  NotificationType,
  PolicyAction,
  PreferenceSource,
  Region,
} from '../../../generated/client';
import { GlobalPolicyRecord } from '../../modules/notification-preferences/application/ports/global-policies/policy.repository.port';
import {
  QuietHoursRecord,
  UserPreferenceRecord,
} from '../../modules/notification-preferences/application/ports/users/user-preference.repository.port';

type UserRow = {
  id: string;
  region: Region;
  created_at: Date;
};

export const makeUser = (overrides: Partial<UserRow> = {}): UserRow => ({
  id: 'user-test',
  region: Region.US,
  created_at: new Date('2026-05-26T10:00:00Z'),
  ...overrides,
});

export const makeUserPreference = (
  overrides: Partial<UserPreferenceRecord> = {},
): UserPreferenceRecord => ({
  user_id: 'user-test',
  notification_type: NotificationType.marketing,
  channel: Channel.email,
  enabled: true,
  source: PreferenceSource.user,
  ...overrides,
});

export const makeGlobalPolicy = (
  overrides: Partial<GlobalPolicyRecord> = {},
): GlobalPolicyRecord => ({
  id: 'gp-test',
  notification_type: NotificationType.marketing,
  channel: Channel.sms,
  region: Region.EU,
  action: PolicyAction.deny,
  reason_code: 'blocked_by_global_policy' as DecisionReason,
  created_at: new Date('2026-05-26T10:00:00Z'),
  ...overrides,
});

export const makeQuietHours = (
  overrides: Partial<QuietHoursRecord> = {},
): QuietHoursRecord => ({
  user_id: 'user-test',
  start_time: '22:00',
  end_time: '08:00',
  timezone: 'UTC',
  enabled: true,
  ...overrides,
});

export const makeEvaluationResult = (
  overrides: Partial<{
    decision: Decision;
    reason: DecisionReason;
    global_policy_id: string | null;
  }> = {},
) => ({
  decision: 'allow' as Decision,
  reason: 'allowed' as DecisionReason,
  global_policy_id: null as string | null,
  ...overrides,
});
