import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/prisma/prisma.service';
import { EvaluationRepositoryPort } from '../../application/ports/evaluation/evaluation.repository.port';

@Injectable()
export class PrismaEvaluationRepository implements EvaluationRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  public async create(data: Parameters<EvaluationRepositoryPort['create']>[0]) {
   await this.prisma.evaluationLog.create({ data });
  }
}
