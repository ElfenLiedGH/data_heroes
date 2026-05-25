import {
  Channel,
  Decision,
  DecisionReason,
  NotificationType,
  PolicyAction,
  Region,
} from '../../../generated/client';

export const EVALUATION_DECISION = {
  allow: {
   value: 'allow',
   reasons: {
     allowed: 'allowed',
   },
  },
  deny: {
   value: 'deny',
   reasons: {
     blocked_by_global_policy: 'blocked_by_global_policy',
     disabled_by_user_preference: 'disabled_by_user_preference',
     disabled_by_default: 'disabled_by_default',
     blocked_by_quiet_hours: 'blocked_by_quiet_hours',
   },
  },
} as const satisfies Record<
  Decision,
  { value: Decision; reasons: Record<string, DecisionReason> }
>;

export const DECISION_VALUES = Object.values(EVALUATION_DECISION).map((item) => item.value);
export const DECISION_REASON_VALUES = Object.values(EVALUATION_DECISION).flatMap((item) =>
  Object.values(item.reasons),
);

export const API_ERROR = {
  INVALID_API_KEY: 'invalid_api_key',
  VALIDATION_FAILED: 'validation_failed',
  USER_NOT_FOUND: 'user_not_found',
  USER_ALREADY_EXISTS: 'user_already_exists',
  POLICY_HAS_REFERENCES: 'policy_has_references',
  POLICY_NOT_FOUND: 'policy_not_found',
  POLICY_ALREADY_EXISTS: 'policy_already_exists',
  DEFAULT_PREFERENCE_NOT_FOUND: 'default_preference_not_found',
  DEFAULT_PREFERENCE_ALREADY_EXISTS: 'default_preference_already_exists',
  BLOCKED_BY_GLOBAL_POLICY: 'blocked_by_global_policy',
} as const;

export const PREFERENCE_SOURCE = {
  USER: 'user',
  GLOBAL: 'global',
} as const;

export type DisplayPreferenceSource =
  (typeof PREFERENCE_SOURCE)[keyof typeof PREFERENCE_SOURCE];

export const NOTIFICATION_TYPE_VALUES = Object.values(NotificationType);
export const CHANNEL_VALUES = Object.values(Channel);
export const REGION_VALUES = Object.values(Region);
export const POLICY_ACTION_VALUES = Object.values(PolicyAction);
export const PREFERENCE_SOURCE_VALUES = Object.values(PREFERENCE_SOURCE);

export const PREFERENCE_CATALOG: Array<{
  readonly notification_type: NotificationType;
  readonly channel: Channel;
}> = [
  { notification_type: NotificationType.transactional, channel: Channel.email },
  { notification_type: NotificationType.marketing, channel: Channel.email },
  { notification_type: NotificationType.transactional, channel: Channel.sms },
  { notification_type: NotificationType.marketing, channel: Channel.sms },
  { notification_type: NotificationType.transactional, channel: Channel.push },
  { notification_type: NotificationType.marketing, channel: Channel.push },
];
