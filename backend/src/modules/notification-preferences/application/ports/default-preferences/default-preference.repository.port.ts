import {
  Channel,
  NotificationType,
  Region,
} from '../../../../../../generated/client';
import { ResolvedDefaultPreference } from '../../../domain/default-preferences/default-preference-resolver';

export type DefaultPreferenceRecord = {
  readonly id: string;
  readonly region: Region | null;
  readonly notification_type: NotificationType;
  readonly channel: Channel;
  readonly enabled: boolean;
  readonly created_at: Date;
  readonly updated_at: Date;
};

export interface DefaultPreferenceRepositoryPort {
  findDefaultById(id: string): Promise<DefaultPreferenceRecord | null>;
  createDefault(data: Readonly<{
   region: Region | null;
   notification_type: NotificationType;
   channel: Channel;
   enabled: boolean;
  }>): Promise<DefaultPreferenceRecord>;
  updateDefault(
   id: string,
   data: Readonly<{
     notification_type: NotificationType;
     channel: Channel;
     enabled: boolean;
   }>,
  ): Promise<DefaultPreferenceRecord>;
  deleteDefault(id: string): Promise<void>;
  countDefaults(): Promise<number>;
  findDefaultsPage(offset: number, limit: number): Promise<DefaultPreferenceRecord[]>;
  resolveDefaultsForRegion(region: Region): Promise<ResolvedDefaultPreference[] | null>;
}
