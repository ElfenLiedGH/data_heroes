import { Inject, Injectable } from '@nestjs/common';
import {
  Channel,
  NotificationType,
  Region,
} from '../../../../../generated/client';
import { API_ERROR } from '../../../../shared/constants';
import {
  ApiBadRequestException,
  ApiForbiddenException,
} from '../../../../shared/exceptions/api-exceptions';
import { OtelLoggerService } from '../../../../shared/logging/otel-logger.service';
import { MetricsService } from '../../../../shared/metrics/metrics.service';
import { setSpanAttributes, withSpan } from '../../../../shared/telemetry/tracing';
import {
  USER_PREFERENCE_REPOSITORY,
  USER_REPOSITORY,
} from '../../../../shared/tokens/repository.tokens';
import { GlobalPolicyGuard } from '../../domain/global-policies/global-policy-guard';
import { QuietHoursChecker } from '../../domain/users/quiet-hours-checker';
import { GlobalPolicyCacheService } from '../global-policies/global-policy-cache.service';
import { UserPreferenceRepositoryPort } from '../ports/users/user-preference.repository.port';
import { UserRepositoryPort } from '../ports/users/user.repository.port';
import { GetUserPreferencesUseCase } from './get-user-preferences.use-case';

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
  constructor(
   @Inject(USER_REPOSITORY) private readonly userRepository: UserRepositoryPort,
   @Inject(USER_PREFERENCE_REPOSITORY) private readonly preferenceRepository: UserPreferenceRepositoryPort,
   private readonly policyCache: GlobalPolicyCacheService,
   private readonly getUserPreferencesUseCase: GetUserPreferencesUseCase,
   private readonly metricsService: MetricsService,
   private readonly logger: OtelLoggerService,
  ) {}

  public async execute(
    userId: string,
    changes: PreferenceChange[],
    quietHours?: QuietHoursInput | null,
    region?: Region,
  ) {
   return withSpan(
     'preferences.update',
     {
        'user.id': userId,
        'preference.change_count': changes.length,
        'preference.has_quiet_hours_change': quietHours !== undefined,
     },
     () => this.run(userId, changes, quietHours, region),
   );
  }

  private async run(
    userId: string,
    changes: PreferenceChange[],
    quietHours: QuietHoursInput | null | undefined,
    region: Region | undefined,
  ) {
   const user = await this.userRepository.findById(userId);
   if (!user) {
     return null;
   }

   if (region && region !== user.region) {
     await this.userRepository.updateRegion(userId, region);
     await this.preferenceRepository.reapplyDefaultsForRegion(userId, region);
   }

   const userRegion = region ?? user.region;
   const globalPolicies = await this.policyCache.getByRegions([userRegion]);

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
       setSpanAttributes({ 'preference.outcome': 'blocked' });
       this.logger.event('WARN', 'preference.blocked_by_global_policy', {
          'user.id': userId,
          'notification.type': change.notification_type,
          'notification.channel': change.channel,
          'notification.region': userRegion,
       });
       this.metricsService.recordPreferenceUpdate('blocked');
       throw new ApiForbiddenException(API_ERROR.BLOCKED_BY_GLOBAL_POLICY);
     }
   }

   if (quietHours && !QuietHoursChecker.isValidTimezone(quietHours.timezone)) {
     throw new ApiBadRequestException(API_ERROR.VALIDATION_FAILED);
   }

   await withSpan(
     'preferences.apply_changes',
     { 'preference.change_count': changes.length },
     () =>
       this.preferenceRepository.applyUserChangesAtomically(userId, {
          changes,
          quietHours: quietHours === undefined ? undefined : quietHours,
       }),
   );

   setSpanAttributes({ 'preference.outcome': 'success' });
   this.metricsService.recordPreferenceUpdate('success');

   this.logger.event('INFO', 'preference.updated', {
      'user.id': userId,
      'preference.change_count': changes.length,
      'preference.has_quiet_hours_change': quietHours !== undefined,
   });

   return this.getUserPreferencesUseCase.execute(userId);
  }
}
