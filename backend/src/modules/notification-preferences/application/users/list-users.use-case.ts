import { Inject, Injectable } from '@nestjs/common';
import { PreferenceResolver } from '../../domain/users/preference-resolver';
import {
  USER_PREFERENCE_REPOSITORY,
  USER_REPOSITORY,
} from '../../../../shared/tokens/repository.tokens';
import { GlobalPolicyCacheService } from '../global-policies/global-policy-cache.service';
import { UserPreferenceRepositoryPort } from '../ports/users/user-preference.repository.port';
import { UserRepositoryPort } from '../ports/users/user.repository.port';

@Injectable()
export class ListUsersUseCase {
  constructor(
   @Inject(USER_REPOSITORY) private readonly userRepository: UserRepositoryPort,
   @Inject(USER_PREFERENCE_REPOSITORY) private readonly preferenceRepository: UserPreferenceRepositoryPort,
   private readonly policyCache: GlobalPolicyCacheService,
  ) {}

  public async execute(offset: number, limit: number, search?: string) {
   const users = await this.userRepository.findPage(offset, limit, search);
   if (users.length === 0) {
     return { users: [] };
   }

   const userIds = users.map((u) => u.id);
   const pageRegions = [...new Set(users.map((u) => u.region))];

   const [globalPolicies, preferencesByUser] = await Promise.all([
     this.policyCache.getByRegions(pageRegions),
     this.preferenceRepository.findUserPreferencesForUsers(userIds),
   ]);

   const usersWithPreferences = users.map((user) => {
     const userPreferences = preferencesByUser.get(user.id) ?? [];
     const preferences = PreferenceResolver.resolveEffectivePreferences(
       user.region,
       userPreferences,
       globalPolicies,
     );

     return {
        user_id: user.id,
        region: user.region,
        created_at: user.created_at.toISOString(),
       preferences,
     };
   });

   return { users: usersWithPreferences };
  }
}

@Injectable()
export class CountUsersUseCase {
  constructor(@Inject(USER_REPOSITORY) private readonly userRepository: UserRepositoryPort) {}

  public async execute(search?: string) {
   const count = await this.userRepository.count(search);
   return { count };
  }
}
