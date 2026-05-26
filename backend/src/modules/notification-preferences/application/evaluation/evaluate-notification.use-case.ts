import { Inject, Injectable } from '@nestjs/common';
import {
  Channel,
  NotificationType,
  Region,
} from '../../../../../generated/client';
import { API_ERROR } from '../../../../shared/constants';
import { ApiNotFoundException } from '../../../../shared/exceptions/api-exceptions';
import { OtelLoggerService } from '../../../../shared/logging/otel-logger.service';
import { MetricsService } from '../../../../shared/metrics/metrics.service';
import { setSpanAttributes, withSpan } from '../../../../shared/telemetry/tracing';
import { EVALUATION_REPOSITORY } from '../../../../shared/tokens/repository.tokens';
import { NotificationEvaluationService } from '../../domain/evaluation/notification-evaluation.service';
import { EvaluationRepositoryPort } from '../ports/evaluation/evaluation.repository.port';
import { UserPreferenceContextService } from '../users/user-preference-context.service';

export type EvaluateInput = {
  readonly user_id: string;
  readonly notification_type: NotificationType;
  readonly channel: Channel;
  readonly region: Region;
  readonly datetime: string;
};

@Injectable()
export class EvaluateNotificationUseCase {
  constructor(
    private readonly contextService: UserPreferenceContextService,
    @Inject(EVALUATION_REPOSITORY)
    private readonly evaluationRepository: EvaluationRepositoryPort,
    private readonly metricsService: MetricsService,
    private readonly logger: OtelLoggerService,
  ) {}

  public async execute(input: EvaluateInput) {
   return withSpan(
     'evaluate.notification',
     {
        'user.id': input.user_id,
        'notification.type': input.notification_type,
        'notification.channel': input.channel,
        'notification.region': input.region,
     },
     () => this.run(input),
   );
  }

  private async run(input: EvaluateInput) {
   const context = await withSpan(
     'evaluate.load_context',
     { 'user.id': input.user_id },
     () => this.contextService.load(input.user_id),
   );
   if (!context) {
     throw new ApiNotFoundException(API_ERROR.USER_NOT_FOUND);
   }

   const result = await withSpan(
     'evaluate.apply_rules',
     {
        'preferences.count': context.userPreferences.length,
        'policies.count': context.globalPolicies.length,
        'has_quiet_hours': context.quietHours !== null,
     },
     async () =>
       NotificationEvaluationService.evaluate(
         {
            notification_type: input.notification_type,
            channel: input.channel,
            region: input.region,
            datetime: input.datetime,
         },
         [...context.userPreferences],
         [...context.globalPolicies],
         context.quietHours
           ? {
                start_time: context.quietHours.start_time,
                end_time: context.quietHours.end_time,
                timezone: context.quietHours.timezone,
                enabled: context.quietHours.enabled,
             }
           : null,
       ),
   );

   setSpanAttributes({
      'evaluation.decision': result.decision,
      'evaluation.reason': result.reason,
   });

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

   this.logger.event('INFO', 'notification.evaluated', {
      'user.id': input.user_id,
      'notification.type': input.notification_type,
      'notification.channel': input.channel,
      'notification.region': input.region,
      'evaluation.decision': result.decision,
      'evaluation.reason': result.reason,
      'evaluation.global_policy_id': result.global_policy_id ?? undefined,
   });

   return {
      decision: result.decision,
      reason: result.reason,
   };
  }
}
