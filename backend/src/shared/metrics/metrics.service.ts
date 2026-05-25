import { Injectable } from '@nestjs/common';
import { metrics } from '@opentelemetry/api';

@Injectable()
export class MetricsService {
  private readonly meter = metrics.getMeter('notification-preferences-backend');

  private readonly notificationEvaluationsTotal = this.meter.createCounter(
   'notification_evaluations_total',
   { description: 'Total notification evaluate calls' },
  );

  private readonly preferenceUpdatesTotal = this.meter.createCounter(
   'preference_updates_total',
   { description: 'Total preference update operations' },
  );

  public recordEvaluation(input: Readonly<{
    decision: string;
    reason: string;
    notification_type: string;
    channel: string;
    region: string;
  }>) {
   this.notificationEvaluationsTotal.add(1, input);
  }

  public recordPreferenceUpdate(result: 'success' | 'blocked' | 'error') {
   this.preferenceUpdatesTotal.add(1, { result });
  }
}
