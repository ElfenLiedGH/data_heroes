import { Module } from '@nestjs/common';
import {
  CountDefaultPreferencesUseCase,
  CreateDefaultPreferenceUseCase,
  DeleteDefaultPreferenceUseCase,
  ListDefaultPreferencesUseCase,
  UpdateDefaultPreferenceUseCase,
} from './application/default-preferences/default-preference.use-cases';
import { EvaluateNotificationUseCase } from './application/evaluation/evaluate-notification.use-case';
import {
  CountGlobalPoliciesUseCase,
  CreateGlobalPolicyUseCase,
  DeleteGlobalPolicyUseCase,
  ListGlobalPoliciesUseCase,
  UpdateGlobalPolicyUseCase,
} from './application/global-policies/global-policy.use-cases';
import { CreateUserUseCase } from './application/users/create-user.use-case';
import { DeleteUserUseCase } from './application/users/delete-user.use-case';
import { GetUserPreferencesUseCase } from './application/users/get-user-preferences.use-case';
import { CountUsersUseCase, ListUsersUseCase } from './application/users/list-users.use-case';
import { UpdateUserPreferencesUseCase } from './application/users/update-user-preferences.use-case';
import { PrismaDefaultPreferenceRepository } from './infrastructure/default-preferences/prisma-default-preference.repository';
import { PrismaEvaluationRepository } from './infrastructure/evaluation/prisma-evaluation.repository';
import { PrismaPolicyRepository } from './infrastructure/global-policies/prisma-policy.repository';
import { PrismaUserPreferenceRepository } from './infrastructure/users/prisma-user-preference.repository';
import { PrismaUserRepository } from './infrastructure/users/prisma-user.repository';
import { DefaultPreferenceController } from './presentation/default-preferences/default-preference.controller';
import { EvaluationController } from './presentation/evaluation/evaluation.controller';
import { GlobalPolicyController } from './presentation/global-policies/global-policy.controller';
import { HealthController } from './presentation/health/health.controller';
import { PreferencesController } from './presentation/users/preferences.controller';
import {
  DEFAULT_PREFERENCE_REPOSITORY,
  EVALUATION_REPOSITORY,
  POLICY_REPOSITORY,
  USER_PREFERENCE_REPOSITORY,
  USER_REPOSITORY,
} from '../../shared/tokens/repository.tokens';

@Module({
  controllers: [
   PreferencesController,
   EvaluationController,
   HealthController,
   GlobalPolicyController,
   DefaultPreferenceController,
  ],
  providers: [
   PrismaUserRepository,
   PrismaDefaultPreferenceRepository,
   PrismaUserPreferenceRepository,
   PrismaPolicyRepository,
   PrismaEvaluationRepository,
   { provide: USER_REPOSITORY, useExisting: PrismaUserRepository },
   { provide: DEFAULT_PREFERENCE_REPOSITORY, useExisting: PrismaDefaultPreferenceRepository },
   { provide: USER_PREFERENCE_REPOSITORY, useExisting: PrismaUserPreferenceRepository },
   { provide: POLICY_REPOSITORY, useExisting: PrismaPolicyRepository },
   { provide: EVALUATION_REPOSITORY, useExisting: PrismaEvaluationRepository },
   ListUsersUseCase,
   CountUsersUseCase,
   CreateUserUseCase,
   GetUserPreferencesUseCase,
   UpdateUserPreferencesUseCase,
   EvaluateNotificationUseCase,
   DeleteUserUseCase,
   ListGlobalPoliciesUseCase,
   CountGlobalPoliciesUseCase,
   CreateGlobalPolicyUseCase,
   UpdateGlobalPolicyUseCase,
   DeleteGlobalPolicyUseCase,
   ListDefaultPreferencesUseCase,
   CountDefaultPreferencesUseCase,
   CreateDefaultPreferenceUseCase,
   UpdateDefaultPreferenceUseCase,
   DeleteDefaultPreferenceUseCase,
  ],
})
export class NotificationPreferencesModule {}
