import { Injectable } from '@nestjs/common';
import {
  Channel,
  NotificationType,
  Region,
} from '../../../../../generated/client';
import { PrismaService } from '../../../../shared/prisma/prisma.service';
import { DefaultPreferenceResolver } from '../../domain/default-preferences/default-preference-resolver';
import { DefaultPreferenceRepositoryPort } from '../../application/ports/default-preferences/default-preference.repository.port';

@Injectable()
export class PrismaDefaultPreferenceRepository implements DefaultPreferenceRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  private async findAllDefaults() {
   return this.prisma.defaultPreference.findMany({
      orderBy: [{ region: 'asc' }, { notification_type: 'asc' }, { channel: 'asc' }],
   });
  }

  public async findDefaultById(id: string) {
   return this.prisma.defaultPreference.findUnique({ where: { id } });
  }

  public async createDefault(data: {
    region: Region | null;
    notification_type: NotificationType;
    channel: Channel;
    enabled: boolean;
  }) {
   return this.prisma.defaultPreference.create({ data });
  }

  public async updateDefault(
    id: string,
    data: {
      notification_type: NotificationType;
      channel: Channel;
      enabled: boolean;
   },
  ) {
   return this.prisma.defaultPreference.update({ where: { id }, data });
  }

  public async deleteDefault(id: string) {
   await this.prisma.defaultPreference.delete({ where: { id } });
  }

  public async countDefaults() {
   return this.prisma.defaultPreference.count();
  }

  public async findDefaultsPage(offset: number, limit: number) {
   return this.prisma.defaultPreference.findMany({
      orderBy: [{ region: 'asc' }, { notification_type: 'asc' }, { channel: 'asc' }],
      skip: offset,
      take: limit,
   });
  }

  public async resolveDefaultsForRegion(region: Region) {
   const defaults = await this.findAllDefaults();
   return DefaultPreferenceResolver.resolveForRegion(
     region,
     defaults.map((d) => ({
        notification_type: d.notification_type,
        channel: d.channel,
        region: d.region,
        enabled: d.enabled,
     })),
   );
  }
}
