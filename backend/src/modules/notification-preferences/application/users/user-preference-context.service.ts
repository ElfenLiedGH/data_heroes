import { Inject, Injectable } from '@nestjs/common';
import { Region } from '../../../../../generated/client';
import {
  USER_PREFERENCE_REPOSITORY,
  USER_REPOSITORY,
} from '../../../../shared/tokens/repository.tokens';
import { GlobalPolicyCacheService } from '../global-policies/global-policy-cache.service';
import { GlobalPolicyRecord } from '../ports/global-policies/policy.repository.port';
import {
  QuietHoursRecord,
  UserPreferenceRecord,
  UserPreferenceRepositoryPort,
} from '../ports/users/user-preference.repository.port';
import { UserRepositoryPort } from '../ports/users/user.repository.port';

export type UserPreferenceContext = {
  readonly user: { readonly id: string; readonly region: Region };
  readonly userPreferences: readonly UserPreferenceRecord[];
  readonly globalPolicies: readonly GlobalPolicyRecord[];
  readonly quietHours: QuietHoursRecord | null;
};

@Injectable()
export class UserPreferenceContextService {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepositoryPort,
    @Inject(USER_PREFERENCE_REPOSITORY)
    private readonly preferenceRepository: UserPreferenceRepositoryPort,
    private readonly policyCache: GlobalPolicyCacheService,
  ) {}

  public async load(userId: string): Promise<UserPreferenceContext | null> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      return null;
    }

    const [userPreferences, globalPolicies, quietHours] = await Promise.all([
      this.preferenceRepository.findUserPreferences(userId),
      this.policyCache.getByRegions([user.region]),
      this.preferenceRepository.findQuietHours(userId),
    ]);

    return {
      user: { id: user.id, region: user.region },
      userPreferences,
      globalPolicies,
      quietHours,
    };
  }
}
