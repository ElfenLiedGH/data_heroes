import { Inject, Injectable } from '@nestjs/common';
import { PreferenceResolver } from '../../domain/users/preference-resolver';
import {
  POLICY_REPOSITORY,
  USER_PREFERENCE_REPOSITORY,
  USER_REPOSITORY,
} from '../../../../shared/tokens/repository.tokens';
import { PolicyRepositoryPort } from '../ports/global-policies/policy.repository.port';
import { UserPreferenceRepositoryPort } from '../ports/users/user-preference.repository.port';
import { UserRepositoryPort } from '../ports/users/user.repository.port';

@Injectable()
export class GetUserPreferencesUseCase {
  constructor(
   @Inject(USER_REPOSITORY) private readonly userRepository: UserRepositoryPort,
   @Inject(USER_PREFERENCE_REPOSITORY) private readonly preferenceRepository: UserPreferenceRepositoryPort,
   @Inject(POLICY_REPOSITORY) private readonly policyRepository: PolicyRepositoryPort,
  ) {}

  public async execute(userId: string) {
   const user = await this.userRepository.findById(userId);
   if (!user) {
     return null;
   }

   const [userPreferences, globalPolicies, quietHours] = await Promise.all([
     this.preferenceRepository.findUserPreferences(userId),
     this.policyRepository.findAll(),
     this.preferenceRepository.findQuietHours(userId),
   ]);

   const preferences = PreferenceResolver.resolveEffectivePreferences(
     user.region,
     userPreferences,
     globalPolicies,
   );

   return {
      user_id: user.id,
      region: user.region,
     preferences,
      quiet_hours: quietHours
       ? {
            start_time: quietHours.start_time,
            end_time: quietHours.end_time,
            timezone: quietHours.timezone,
            enabled: quietHours.enabled,
         }
       : null,
   };
  }
}
