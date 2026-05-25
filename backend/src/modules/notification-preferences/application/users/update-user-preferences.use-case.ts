import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import {
  Channel,
  NotificationType,
  Region,
} from '../../../../../generated/client';
import { API_ERROR } from '../../../../shared/constants';
import {
  POLICY_REPOSITORY,
  USER_PREFERENCE_REPOSITORY,
  USER_REPOSITORY,
} from '../../../../shared/tokens/repository.tokens';
import { GlobalPolicyGuard } from '../../domain/global-policies/global-policy-guard';
import { QuietHoursChecker } from '../../domain/users/quiet-hours-checker';
import { PolicyRepositoryPort } from '../ports/global-policies/policy.repository.port';
import { UserPreferenceRepositoryPort } from '../ports/users/user-preference.repository.port';
import { UserRepositoryPort } from '../ports/users/user.repository.port';
import { GetUserPreferencesUseCase } from './get-user-preferences.use-case';
import { MetricsService } from '../../../../shared/metrics/metrics.service';

export type PreferenceChange = {
  readonly notification_type: NotificationType;
  readonly channel: Channel;
  readonly enabled: boolean;
};

export type QuietHoursInput = {
  readonly start_time: string;
  readonly end_time: string;
  readonly timezone: string;
  readonly enabled: boolean;
};

@Injectable()
export class UpdateUserPreferencesUseCase {
  private readonly logger = new Logger(UpdateUserPreferencesUseCase.name);

  constructor(
   @Inject(USER_REPOSITORY) private readonly userRepository: UserRepositoryPort,
   @Inject(USER_PREFERENCE_REPOSITORY) private readonly preferenceRepository: UserPreferenceRepositoryPort,
   @Inject(POLICY_REPOSITORY) private readonly policyRepository: PolicyRepositoryPort,
   private readonly getUserPreferencesUseCase: GetUserPreferencesUseCase,
   private readonly metricsService: MetricsService,
  ) {}

  public async execute(
    userId: string,
    changes: PreferenceChange[],
    quietHours?: QuietHoursInput | null,
    region?: Region,
  ) {
   const user = await this.userRepository.findById(userId);
   if (!user) {
     return null;
   }

   if (region && region !== user.region) {
     await this.userRepository.updateRegion(userId, region);
     await this.preferenceRepository.reapplyDefaultsForRegion(userId, region);
   }

   const globalPolicies = await this.policyRepository.findAll();
   const userRegion = region ?? user.region;

   for (const change of changes) {
     if (
       change.enabled &&
       !GlobalPolicyGuard.canEnablePreference(
         userRegion,
         change.notification_type,
         change.channel,
         globalPolicies,
       )
     ) {
       this.logger.warn(
         JSON.stringify({
            event: 'preference.blocked_by_global_policy',
            user_id: userId,
            notification_type: change.notification_type,
            channel: change.channel,
         }),
       );
       this.metricsService.recordPreferenceUpdate('blocked');
       throw new ForbiddenException({
          status_code: 403,
          message: API_ERROR.BLOCKED_BY_GLOBAL_POLICY,
          error: 'Forbidden',
       });
     }

     await this.preferenceRepository.upsertUserPreference(
       userId,
       change.notification_type,
       change.channel,
       change.enabled,
     );
   }

   if (quietHours === null) {
     await this.preferenceRepository.deleteQuietHours(userId);
   } else if (quietHours !== undefined) {
     if (!QuietHoursChecker.isValidTimezone(quietHours.timezone)) {
       throw new BadRequestException({
          status_code: 400,
          message: API_ERROR.VALIDATION_FAILED,
          error: 'Bad Request',
       });
     }
     await this.preferenceRepository.upsertQuietHours(userId, quietHours);
   }

   this.metricsService.recordPreferenceUpdate('success');

   this.logger.log(
     JSON.stringify({
        event: 'preference.updated',
        user_id: userId,
       changes,
     }),
   );

   return this.getUserPreferencesUseCase.execute(userId);
  }
}
