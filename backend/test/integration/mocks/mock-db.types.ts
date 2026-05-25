import {
  Channel,
  NotificationType,
  PreferenceSource,
  Region,
} from '../../../generated/client';

export type UserWhere = { id?: { contains?: string; mode?: string } };

export type MockDb = {
  users: Map<string, { id: string; region: Region; created_at: Date }>;
  defaultPreferences: Array<{
    id: string;
    region: Region | null;
    notification_type: NotificationType;
    channel: Channel;
    enabled: boolean;
    created_at: Date;
    updated_at: Date;
  }>;
  userPreferences: Array<{
    id: string;
    user_id: string;
    notification_type: NotificationType;
    channel: Channel;
    enabled: boolean;
    source: PreferenceSource;
  }>;
  userQuietHours: Array<{
    user_id: string;
    start_time: string;
    end_time: string;
    timezone: string;
    enabled: boolean;
  }>;
  globalPolicies: Array<{
    id: string;
    notification_type: NotificationType;
    channel: Channel;
    region: Region;
    action: string;
    reason_code?: string;
    created_at?: Date;
  }>;
  evaluationLogs: Array<Record<string, unknown>>;
};
