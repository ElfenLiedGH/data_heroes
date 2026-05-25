import {
  Injectable,
  Logger,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import {
  Channel,
  NotificationType,
  Region,
} from '../../../../../generated/client';
import { API_ERROR } from '../../../../shared/constants';
import {
  EVALUATION_REPOSITORY,
  POLICY_REPOSITORY,
  USER_PREFERENCE_REPOSITORY,
  USER_REPOSITORY,
} from '../../../../shared/tokens/repository.tokens';
import { NotificationEvaluationService } from '../../domain/evaluation/notification-evaluation.service';
import { EvaluationRepositoryPort } from '../ports/evaluation/evaluation.repository.port';
import { PolicyRepositoryPort } from '../ports/global-policies/policy.repository.port';
import { UserPreferenceRepositoryPort } from '../ports/users/user-preference.repository.port';
import { UserRepositoryPort } from '../ports/users/user.repository.port';
import { MetricsService } from '../../../../shared/metrics/metrics.service';

export type EvaluateInput = {
  readonly user_id: string;
  readonly notification_type: NotificationType;
  readonly channel: Channel;
  readonly region: Region;
  readonly datetime: string;
};

@Injectable()
export class EvaluateNotificationUseCase {
  private readonly logger = new Logger(EvaluateNotificationUseCase.name);

  constructor(
   @Inject(USER_REPOSITORY) private readonly userRepository: UserRepositoryPort,
   @Inject(USER_PREFERENCE_REPOSITORY) private readonly preferenceRepository: UserPreferenceRepositoryPort,
   @Inject(POLICY_REPOSITORY) private readonly policyRepository: PolicyRepositoryPort,
   @Inject(EVALUATION_REPOSITORY) private readonly evaluationRepository: EvaluationRepositoryPort,
   private readonly metricsService: MetricsService,
  ) {}

  public async execute(input: EvaluateInput) {
   const user = await this.userRepository.findById(input.user_id);
   if (!user) {
     throw new NotFoundException({
        status_code: 404,
        message: API_ERROR.USER_NOT_FOUND,
        error: 'Not Found',
     });
   }

   const [userPreferences, globalPolicies, quietHours] = await Promise.all([
     this.preferenceRepository.findUserPreferences(input.user_id),
     this.policyRepository.findAll(),
     this.preferenceRepository.findQuietHours(input.user_id),
   ]);

   const result = NotificationEvaluationService.evaluate(
     {
        notification_type: input.notification_type,
        channel: input.channel,
        region: input.region,
        datetime: input.datetime,
     },
     userPreferences,
     globalPolicies,
     quietHours
       ? {
            start_time: quietHours.start_time,
            end_time: quietHours.end_time,
            timezone: quietHours.timezone,
            enabled: quietHours.enabled,
         }
       : null,
   );

   await this.evaluationRepository.create({
      user_id: input.user_id,
      notification_type: input.notification_type,
      channel: input.channel,
      region: input.region,
      evaluated_at: new Date(input.datetime),
      decision: result.decision,
      reason: result.reason,
      global_policy_id: result.global_policy_id,
   });

   this.metricsService.recordEvaluation({
      decision: result.decision,
      reason: result.reason,
      notification_type: input.notification_type,
      channel: input.channel,
      region: input.region,
   });

   this.logger.log(
     JSON.stringify({
        event: 'notification.evaluated',
        user_id: input.user_id,
        notification_type: input.notification_type,
        channel: input.channel,
        region: input.region,
        decision: result.decision,
        reason: result.reason,
        global_policy_id: result.global_policy_id,
     }),
   );

   return {
      decision: result.decision,
      reason: result.reason,
   };
  }
}
