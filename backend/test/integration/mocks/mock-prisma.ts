import {
  Channel,
  NotificationType,
  PreferenceSource,
  Region,
} from '../../../generated/client';
import {
  SEED_USER_QUIET_HOURS,
} from '../../../src/shared/fixtures/seed-data.fixture';
import type { MockDb, UserWhere } from './mock-db.types';
import {
  filterUsersByWhere,
  prismaNotFoundError,
  prismaRestrictError,
  prismaUniqueError,
  SEED_TIMESTAMP,
  sortDefaultPreferences,
} from './mock-prisma.helpers';

export function buildMockPrisma(db: MockDb) {
  return {
    user: {
      findMany: async ({
        skip,
        take,
        where,
      }: { skip?: number; take?: number; where?: UserWhere } = {}) => {
        const sorted = filterUsersByWhere(
          Array.from(db.users.values()).sort((a, b) => a.id.localeCompare(b.id)),
          where,
        );
        const start = skip ?? 0;
        const end = take === undefined ? undefined : start + take;
        return sorted.slice(start, end);
      },
      count: async ({ where }: { where?: UserWhere } = {}) =>
        filterUsersByWhere(Array.from(db.users.values()), where).length,
      findUnique: async ({ where }: { where: { id: string } }) => db.users.get(where.id) ?? null,
      create: async ({ data }: { data: { id: string; region: Region } }) => {
        if (db.users.has(data.id)) {
          throw prismaUniqueError();
        }
        const user = { id: data.id, region: data.region, created_at: new Date() };
        db.users.set(data.id, user);
        return user;
      },
      update: async ({
        where,
        data,
      }: {
        where: { id: string };
        data: { region: Region };
      }) => {
        const existing = db.users.get(where.id);
        if (!existing) {
          throw prismaNotFoundError();
        }
        existing.region = data.region;
        return existing;
      },
      delete: async ({ where }: { where: { id: string } }) => {
        if (!db.users.has(where.id)) throw new Error('not found');
        db.users.delete(where.id);
        db.userPreferences = db.userPreferences.filter((p) => p.user_id !== where.id);
        db.userQuietHours = db.userQuietHours.filter((q) => q.user_id !== where.id);
        return { id: where.id };
      },
    },
    defaultPreference: {
      findMany: async ({
        skip,
        take,
      }: { skip?: number; take?: number; orderBy?: unknown } = {}) => {
        const sorted = sortDefaultPreferences(db.defaultPreferences);
        const start = skip ?? 0;
        const end = take === undefined ? undefined : start + take;
        return sorted.slice(start, end);
      },
      findUnique: async ({ where }: { where: { id: string } }) =>
        db.defaultPreferences.find((p) => p.id === where.id) ?? null,
      count: async () => db.defaultPreferences.length,
      create: async ({
        data,
      }: {
        data: {
          region?: Region | null;
          notification_type: NotificationType;
          channel: Channel;
          enabled: boolean;
        };
      }) => {
        const region = data.region ?? null;
        const duplicate = db.defaultPreferences.find(
          (p) =>
            p.notification_type === data.notification_type &&
            p.channel === data.channel &&
            p.region === region,
        );
        if (duplicate) {
          throw prismaUniqueError();
        }
        const row = {
          region,
          notification_type: data.notification_type,
          channel: data.channel,
          enabled: data.enabled,
          id: `dp-${db.defaultPreferences.length}`,
          created_at: SEED_TIMESTAMP,
          updated_at: SEED_TIMESTAMP,
        };
        db.defaultPreferences.push(row);
        return row;
      },
      update: async ({
        where,
        data,
      }: {
        where: { id: string };
        data: {
          notification_type: NotificationType;
          channel: Channel;
          enabled: boolean;
        };
      }) => {
        const idx = db.defaultPreferences.findIndex((p) => p.id === where.id);
        if (idx < 0) {
          throw prismaNotFoundError();
        }
        const existingRegion = db.defaultPreferences[idx].region;
        const duplicate = db.defaultPreferences.find(
          (p, i) =>
            i !== idx &&
            p.notification_type === data.notification_type &&
            p.channel === data.channel &&
            p.region === existingRegion,
        );
        if (duplicate) {
          throw prismaUniqueError();
        }
        db.defaultPreferences[idx] = {
          ...db.defaultPreferences[idx],
          ...data,
          updated_at: new Date(),
        };
        return db.defaultPreferences[idx];
      },
      delete: async ({ where }: { where: { id: string } }) => {
        const idx = db.defaultPreferences.findIndex((p) => p.id === where.id);
        if (idx < 0) {
          throw prismaNotFoundError();
        }
        db.defaultPreferences.splice(idx, 1);
        return { id: where.id };
      },
    },
    userPreference: {
      findMany: async ({
        where,
      }: {
        where:
          | { user_id: string }
          | { user_id: { in: string[] } }
          | { user_id: string; source?: PreferenceSource };
      }) => {
        const userIdFilter = where.user_id;
        if (typeof userIdFilter === 'object') {
          return db.userPreferences.filter((p) => userIdFilter.in.includes(p.user_id));
        }
        return db.userPreferences.filter(
          (p) =>
            p.user_id === userIdFilter &&
            (!('source' in where) || !where.source || p.source === where.source),
        );
      },
      deleteMany: async ({
        where,
      }: {
        where: { user_id: string; source?: PreferenceSource };
      }) => {
        const before = db.userPreferences.length;
        db.userPreferences = db.userPreferences.filter((p) => {
          if (p.user_id !== where.user_id) return true;
          if (where.source && p.source !== where.source) return true;
          return false;
        });
        return { count: before - db.userPreferences.length };
      },
      createMany: async ({
        data,
      }: {
        data: Array<{
          user_id: string;
          notification_type: NotificationType;
          channel: Channel;
          enabled: boolean;
          source: PreferenceSource;
        }>;
      }) => {
        for (const row of data) {
          db.userPreferences.push({
            ...row,
            id: `up-${db.userPreferences.length}`,
          });
        }
        return { count: data.length };
      },
      upsert: async ({
        where,
        create,
        update,
      }: {
        where: {
          user_id_notification_type_channel: {
            user_id: string;
            notification_type: NotificationType;
            channel: Channel;
          };
        };
        create: {
          user_id: string;
          notification_type: NotificationType;
          channel: Channel;
          enabled: boolean;
          source?: PreferenceSource;
        };
        update: { enabled: boolean; source?: PreferenceSource };
      }) => {
        const key = where.user_id_notification_type_channel;
        const idx = db.userPreferences.findIndex(
          (p) =>
            p.user_id === key.user_id &&
            p.notification_type === key.notification_type &&
            p.channel === key.channel,
        );
        if (idx >= 0) {
          db.userPreferences[idx].enabled = update.enabled;
          db.userPreferences[idx].source = update.source ?? PreferenceSource.user;
          return db.userPreferences[idx];
        }
        const row = {
          ...create,
          source: create.source ?? PreferenceSource.user,
          id: `up-${db.userPreferences.length}`,
        };
        db.userPreferences.push(row);
        return row;
      },
    },
    userQuietHours: {
      findUnique: async ({ where }: { where: { user_id: string } }) =>
        db.userQuietHours.find((q) => q.user_id === where.user_id) ?? null,
      upsert: async ({
        where,
        create,
        update,
      }: {
        where: { user_id: string };
        create: (typeof SEED_USER_QUIET_HOURS)[number];
        update: Omit<(typeof SEED_USER_QUIET_HOURS)[number], 'user_id'>;
      }) => {
        const idx = db.userQuietHours.findIndex((q) => q.user_id === where.user_id);
        if (idx >= 0) {
          db.userQuietHours[idx] = { user_id: where.user_id, ...update };
          return db.userQuietHours[idx];
        }
        db.userQuietHours.push(create);
        return create;
      },
      delete: async ({ where }: { where: { user_id: string } }) => {
        const idx = db.userQuietHours.findIndex((q) => q.user_id === where.user_id);
        if (idx < 0) {
          throw prismaNotFoundError();
        }
        db.userQuietHours.splice(idx, 1);
        return { user_id: where.user_id };
      },
    },
    globalPolicy: {
      findMany: async ({ skip, take }: { skip?: number; take?: number } = {}) => {
        const sorted = [...db.globalPolicies].sort(
          (a, b) =>
            new Date(a.created_at ?? 0).getTime() - new Date(b.created_at ?? 0).getTime(),
        );
        const start = skip ?? 0;
        const end = take === undefined ? undefined : start + take;
        return sorted.slice(start, end);
      },
      count: async () => db.globalPolicies.length,
      findUnique: async ({ where }: { where: { id: string } }) =>
        db.globalPolicies.find((p) => p.id === where.id) ?? null,
      create: async ({
        data,
      }: {
        data: Omit<(typeof db.globalPolicies)[number], 'id' | 'created_at'>;
      }) => {
        const duplicate = db.globalPolicies.find(
          (p) =>
            p.notification_type === data.notification_type &&
            p.channel === data.channel &&
            p.region === data.region,
        );
        if (duplicate) {
          throw prismaUniqueError();
        }
        const row = {
          ...data,
          id: `gp-${db.globalPolicies.length}`,
          created_at: new Date('2026-05-25T10:00:00Z'),
        };
        db.globalPolicies.push(row);
        return row;
      },
      update: async ({
        where,
        data,
      }: {
        where: { id: string };
        data: Omit<(typeof db.globalPolicies)[number], 'id' | 'created_at'>;
      }) => {
        const idx = db.globalPolicies.findIndex((p) => p.id === where.id);
        if (idx < 0) {
          throw prismaNotFoundError();
        }
        const duplicate = db.globalPolicies.find(
          (p, i) =>
            i !== idx &&
            p.notification_type === data.notification_type &&
            p.channel === data.channel &&
            p.region === data.region,
        );
        if (duplicate) {
          throw prismaUniqueError();
        }
        db.globalPolicies[idx] = { ...db.globalPolicies[idx], ...data };
        return db.globalPolicies[idx];
      },
      delete: async ({ where }: { where: { id: string } }) => {
        if (!db.globalPolicies.some((p) => p.id === where.id)) {
          throw prismaNotFoundError();
        }
        if (db.evaluationLogs.some((l) => l.global_policy_id === where.id)) {
          throw prismaRestrictError();
        }
        db.globalPolicies = db.globalPolicies.filter((p) => p.id !== where.id);
        return { id: where.id };
      },
    },
    evaluationLog: {
      create: async ({ data }: { data: Record<string, unknown> }) => {
        db.evaluationLogs.push(data);
        return data;
      },
    },
    $transaction: async <T>(fn: (tx: unknown) => Promise<T>) => fn(buildMockPrisma(db)),
    $queryRaw: async () => [{ '?column?': 1 }],
    $connect: async () => {},
    $disconnect: async () => {},
  };
}
