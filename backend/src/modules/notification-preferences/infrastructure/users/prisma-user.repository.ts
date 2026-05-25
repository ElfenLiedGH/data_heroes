import { Injectable } from '@nestjs/common';
import { PreferenceSource, Region } from '../../../../../generated/client';
import { PrismaService } from '../../../../shared/prisma/prisma.service';
import { isPrismaNotFound } from '../../../../shared/utils/prisma-errors';
import { ResolvedDefaultPreference } from '../../domain/default-preferences/default-preference-resolver';
import { UserRepositoryPort } from '../../application/ports/users/user.repository.port';

@Injectable()
export class PrismaUserRepository implements UserRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  public async findPage(offset: number, limit: number, search?: string) {
    const where = search
      ? { id: { contains: search, mode: 'insensitive' as const } }
      : undefined;

    return this.prisma.user.findMany({
      where,
      orderBy: { id: 'asc' },
      skip: offset,
      take: limit,
    });
  }

  public async count(search?: string) {
    const where = search
      ? { id: { contains: search, mode: 'insensitive' as const } }
      : undefined;

    return this.prisma.user.count({ where });
  }

  public async findById(userId: string) {
    return this.prisma.user.findUnique({ where: { id: userId } });
  }

  public async createWithDefaults(
    userId: string,
    region: Region,
    defaults: ResolvedDefaultPreference[],
  ) {
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { id: userId, region },
      });
      await tx.userPreference.createMany({
        data: defaults.map((d) => ({
          user_id: userId,
          notification_type: d.notification_type,
          channel: d.channel,
          enabled: d.enabled,
          source: PreferenceSource.default,
        })),
      });
      return user;
    });
  }

  public async updateRegion(userId: string, region: Region) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { region },
    });
  }

  public async delete(userId: string) {
    try {
      await this.prisma.user.delete({ where: { id: userId } });
      return true;
    } catch (error) {
      if (isPrismaNotFound(error)) {
        return false;
      }
      throw error;
    }
  }
}
