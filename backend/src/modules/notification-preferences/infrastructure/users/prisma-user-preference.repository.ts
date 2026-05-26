import { Inject, Injectable } from '@nestjs/common';
import {
  Channel,
  NotificationType,
  PreferenceSource,
  Region,
} from '../../../../../generated/client';
import { DEFAULT_PREFERENCE_REPOSITORY } from '../../../../shared/tokens/repository.tokens';
import { PrismaService } from '../../../../shared/prisma/prisma.service';
import { isPrismaNotFound } from '../../../../shared/utils/prisma-errors';
import { DefaultPreferenceRepositoryPort } from '../../application/ports/default-preferences/default-preference.repository.port';
import {
  ApplyPreferenceChangesInput,
  QuietHoursRecord,
  UserPreferenceRepositoryPort,
} from '../../application/ports/users/user-preference.repository.port';

@Injectable()
export class PrismaUserPreferenceRepository implements UserPreferenceRepositoryPort {
  constructor(
   private readonly prisma: PrismaService,
   @Inject(DEFAULT_PREFERENCE_REPOSITORY)
   private readonly defaultPreferenceRepository: DefaultPreferenceRepositoryPort,
  ) {}

  public async reapplyDefaultsForRegion(userId: string, region: Region) {
   const resolved = await this.defaultPreferenceRepository.resolveDefaultsForRegion(region);
   if (!resolved) {
     return false;
   }

   const existing = await this.findUserPreferences(userId);
   const userOverrides = new Set(
     existing
       .filter((p) => p.source === PreferenceSource.user)
       .map((p) => `${p.notification_type}:${p.channel}`),
   );

   await this.prisma.$transaction(async (tx) => {
     await tx.userPreference.deleteMany({
        where: { user_id: userId, source: PreferenceSource.default },
     });
     const toCreate = resolved.filter(
       (d) => !userOverrides.has(`${d.notification_type}:${d.channel}`),
     );
     if (toCreate.length > 0) {
       await tx.userPreference.createMany({
          data: toCreate.map((d) => ({
            user_id: userId,
            notification_type: d.notification_type,
            channel: d.channel,
            enabled: d.enabled,
            source: PreferenceSource.default,
         })),
       });
     }
   });
   return true;
  }

  public async findUserPreferences(userId: string) {
   return this.prisma.userPreference.findMany({ where: { user_id: userId } });
  }

  public async findUserPreferencesForUsers(userIds: string[]) {
   if (userIds.length === 0) {
     return new Map();
   }
   const rows = await this.prisma.userPreference.findMany({
      where: { user_id: { in: userIds } },
   });
   const map = new Map<string, typeof rows>();
   for (const row of rows) {
     const list = map.get(row.user_id) ?? [];
     list.push(row);
     map.set(row.user_id, list);
   }
   return map;
  }

  public async upsertUserPreference(
    userId: string,
    notificationType: NotificationType,
    channel: Channel,
    enabled: boolean,
  ) {
   await this.prisma.userPreference.upsert({
      where: {
        user_id_notification_type_channel: {
          user_id: userId,
          notification_type: notificationType,
         channel,
       },
     },
      create: {
        user_id: userId,
        notification_type: notificationType,
       channel,
       enabled,
        source: PreferenceSource.user,
     },
      update: { enabled, source: PreferenceSource.user },
   });
  }

  public async applyUserChangesAtomically(
   userId: string,
   input: ApplyPreferenceChangesInput,
  ) {
   await this.prisma.$transaction(async (tx) => {
     for (const change of input.changes) {
       await tx.userPreference.upsert({
         where: {
            user_id_notification_type_channel: {
              user_id: userId,
              notification_type: change.notification_type,
              channel: change.channel,
           },
         },
         create: {
            user_id: userId,
            notification_type: change.notification_type,
            channel: change.channel,
            enabled: change.enabled,
            source: PreferenceSource.user,
         },
         update: { enabled: change.enabled, source: PreferenceSource.user },
       });
     }

     if (input.quietHours === null) {
       await tx.userQuietHours.deleteMany({ where: { user_id: userId } });
     } else if (input.quietHours !== undefined) {
       await tx.userQuietHours.upsert({
          where: { user_id: userId },
          create: { user_id: userId, ...input.quietHours },
          update: input.quietHours,
       });
     }
   });
  }

  public async findQuietHours(userId: string) {
   return this.prisma.userQuietHours.findUnique({ where: { user_id: userId } });
  }

  public async upsertQuietHours(userId: string, quietHours: Omit<QuietHoursRecord, 'user_id'>) {
   await this.prisma.userQuietHours.upsert({
      where: { user_id: userId },
      create: { user_id: userId, ...quietHours },
      update: quietHours,
   });
  }

  public async deleteQuietHours(userId: string) {
   try {
     await this.prisma.userQuietHours.delete({ where: { user_id: userId } });
   } catch (error) {
     if (isPrismaNotFound(error)) {
       return;
     }
     throw error;
   }
  }
}
