import { Region } from '../../../../../../generated/client';
import { ResolvedDefaultPreference } from '../../../domain/default-preferences/default-preference-resolver';

export type UserRecord = {
  readonly id: string;
  readonly region: Region;
  readonly created_at: Date;
};

export interface UserRepositoryPort {
  findPage(offset: number, limit: number, search?: string): Promise<UserRecord[]>;
  count(search?: string): Promise<number>;
  findById(userId: string): Promise<UserRecord | null>;
  updateRegion(userId: string, region: Region): Promise<UserRecord>;
  delete(userId: string): Promise<boolean>;
  createWithDefaults(userId: string, region: Region, defaults: ResolvedDefaultPreference[]): Promise<UserRecord>;
}
