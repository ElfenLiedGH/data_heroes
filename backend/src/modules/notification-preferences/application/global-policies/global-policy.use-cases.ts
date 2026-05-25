import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Channel,
  DecisionReason,
  NotificationType,
  PolicyAction,
  Region,
} from '../../../../../generated/client';
import { API_ERROR } from '../../../../shared/constants';
import {
  isPrismaForeignKeyViolation,
  isPrismaUniqueViolation,
} from '../../../../shared/utils/prisma-errors';
import { POLICY_REPOSITORY } from '../../../../shared/tokens/repository.tokens';
import { PolicyRepositoryPort } from '../ports/global-policies/policy.repository.port';

export type GlobalPolicyInput = {
  readonly notification_type: NotificationType;
  readonly channel: Channel;
  readonly region: Region;
  readonly action: PolicyAction;
  readonly reason_code: DecisionReason;
};

@Injectable()
export class ListGlobalPoliciesUseCase {
  constructor(@Inject(POLICY_REPOSITORY) private readonly policyRepository: PolicyRepositoryPort) {}

  public async execute(offset: number, limit: number) {
   const policies = await this.policyRepository.findPage(offset, limit);
   return {
      policies: policies.map((p) => ({
        id: p.id,
        notification_type: p.notification_type,
        channel: p.channel,
        region: p.region,
        action: p.action,
        reason_code: p.reason_code,
        created_at: p.created_at.toISOString(),
     })),
   };
  }
}

@Injectable()
export class CountGlobalPoliciesUseCase {
  constructor(@Inject(POLICY_REPOSITORY) private readonly policyRepository: PolicyRepositoryPort) {}

  public async execute() {
   const count = await this.policyRepository.count();
   return { count };
  }
}

@Injectable()
export class CreateGlobalPolicyUseCase {
  constructor(@Inject(POLICY_REPOSITORY) private readonly policyRepository: PolicyRepositoryPort) {}

  public async execute(input: GlobalPolicyInput) {
   try {
     const policy = await this.policyRepository.create(input);
     return {
        id: policy.id,
        notification_type: policy.notification_type,
        channel: policy.channel,
        region: policy.region,
        action: policy.action,
        reason_code: policy.reason_code,
        created_at: policy.created_at.toISOString(),
     };
   } catch (error) {
     if (isPrismaUniqueViolation(error)) {
       throw new ConflictException({
          status_code: 409,
          message: API_ERROR.POLICY_ALREADY_EXISTS,
          error: 'Conflict',
       });
     }
     throw error;
   }
  }
}

@Injectable()
export class UpdateGlobalPolicyUseCase {
  constructor(@Inject(POLICY_REPOSITORY) private readonly policyRepository: PolicyRepositoryPort) {}

  public async execute(policyId: string, input: GlobalPolicyInput) {
   const existing = await this.policyRepository.findById(policyId);
   if (!existing) {
     throw new NotFoundException({
        status_code: 404,
        message: API_ERROR.POLICY_NOT_FOUND,
        error: 'Not Found',
     });
   }

   try {
     const policy = await this.policyRepository.update(policyId, input);
     return {
        id: policy.id,
        notification_type: policy.notification_type,
        channel: policy.channel,
        region: policy.region,
        action: policy.action,
        reason_code: policy.reason_code,
        created_at: policy.created_at.toISOString(),
     };
   } catch (error) {
     if (isPrismaUniqueViolation(error)) {
       throw new ConflictException({
          status_code: 409,
          message: API_ERROR.POLICY_ALREADY_EXISTS,
          error: 'Conflict',
       });
     }
     throw error;
   }
  }
}

@Injectable()
export class DeleteGlobalPolicyUseCase {
  constructor(@Inject(POLICY_REPOSITORY) private readonly policyRepository: PolicyRepositoryPort) {}

  public async execute(policyId: string) {
   const existing = await this.policyRepository.findById(policyId);
   if (!existing) {
     throw new NotFoundException({
        status_code: 404,
        message: API_ERROR.POLICY_NOT_FOUND,
        error: 'Not Found',
     });
   }

   try {
     await this.policyRepository.deleteById(policyId);
   } catch (error) {
     if (isPrismaForeignKeyViolation(error)) {
       throw new ConflictException({
          status_code: 409,
          message: API_ERROR.POLICY_HAS_REFERENCES,
          error: 'Conflict',
       });
     }
     throw error;
   }
  }
}
