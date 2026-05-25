import { Injectable } from '@nestjs/common';
import {
  Channel,
  DecisionReason,
  NotificationType,
  PolicyAction,
  Region,
} from '../../../../../generated/client';
import { PrismaService } from '../../../../shared/prisma/prisma.service';
import { PolicyRepositoryPort } from '../../application/ports/global-policies/policy.repository.port';

@Injectable()
export class PrismaPolicyRepository implements PolicyRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  public async findAll() {
   return this.prisma.globalPolicy.findMany({ orderBy: { created_at: 'asc' } });
  }

  public async findPage(offset: number, limit: number) {
   return this.prisma.globalPolicy.findMany({
      orderBy: { created_at: 'asc' },
      skip: offset,
      take: limit,
   });
  }

  public async count() {
   return this.prisma.globalPolicy.count();
  }

  public async findById(id: string) {
   return this.prisma.globalPolicy.findUnique({ where: { id } });
  }

  public async create(data: {
    notification_type: NotificationType;
    channel: Channel;
    region: Region;
    action: PolicyAction;
    reason_code: DecisionReason;
  }) {
   return this.prisma.globalPolicy.create({ data });
  }

  public async update(
    id: string,
    data: {
      notification_type: NotificationType;
      channel: Channel;
      region: Region;
      action: PolicyAction;
      reason_code: DecisionReason;
   },
  ) {
   return this.prisma.globalPolicy.update({ where: { id }, data });
  }

  public async deleteById(id: string) {
   await this.prisma.globalPolicy.delete({ where: { id } });
  }
}
