import {
  Channel,
  NotificationType,
  PreferenceSource,
  Region,
} from '../../../../../../generated/client';

export type QuietHoursRecord = {
  readonly user_id: string;
  readonly start_time: string;
  readonly end_time: string;
  readonly timezone: string;
  readonly enabled: boolean;
};

export type UserPreferenceRecord = {
  readonly user_id: string;
  readonly notification_type: NotificationType;
  readonly channel: Channel;
  readonly enabled: boolean;
  readonly source: PreferenceSource;
};

export type PreferenceChangeRecord = {
  readonly notification_type: NotificationType;
  readonly channel: Channel;
  readonly enabled: boolean;
};

export type ApplyPreferenceChangesInput = {
  readonly changes: readonly PreferenceChangeRecord[];
  readonly quietHours?: Omit<QuietHoursRecord, 'user_id'> | null;
};

export interface UserPreferenceRepositoryPort {
  reapplyDefaultsForRegion(userId: string, region: Region): Promise<boolean>;
  findUserPreferences(userId: string): Promise<UserPreferenceRecord[]>;
  findUserPreferencesForUsers(userIds: string[]): Promise<Map<string, UserPreferenceRecord[]>>;
  upsertUserPreference(
   userId: string,
   notificationType: NotificationType,
   channel: Channel,
   enabled: boolean,
  ): Promise<void>;
  applyUserChangesAtomically(
   userId: string,
   input: ApplyPreferenceChangesInput,
  ): Promise<void>;
  findQuietHours(userId: string): Promise<QuietHoursRecord | null>;
  upsertQuietHours(userId: string, quietHours: Omit<QuietHoursRecord, 'user_id'>): Promise<void>;
  deleteQuietHours(userId: string): Promise<void>;
}
