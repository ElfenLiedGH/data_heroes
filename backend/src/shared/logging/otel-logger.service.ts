import { Injectable, LoggerService } from '@nestjs/common';
import { logs, SeverityNumber } from '@opentelemetry/api-logs';
import { isTelemetryEnabled, serviceName } from '../../telemetry';

type EventSeverity = 'TRACE' | 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
type LogAttributes = Record<string, string | number | boolean | undefined | null>;

const SEVERITY_NUMBER: Record<EventSeverity, SeverityNumber> = {
  TRACE: SeverityNumber.TRACE,
  DEBUG: SeverityNumber.DEBUG,
  INFO: SeverityNumber.INFO,
  WARN: SeverityNumber.WARN,
  ERROR: SeverityNumber.ERROR,
};

@Injectable()
export class OtelLoggerService implements LoggerService {
  private readonly logger = logs.getLogger(serviceName);

  public log(message: unknown, context?: string) {
   this.write(SeverityNumber.INFO, 'INFO', message, context);
  }

  public error(message: unknown, trace?: string, context?: string) {
   this.write(SeverityNumber.ERROR, 'ERROR', message, context, trace);
  }

  public warn(message: unknown, context?: string) {
   this.write(SeverityNumber.WARN, 'WARN', message, context);
  }

  public debug?(message: unknown, context?: string) {
   this.write(SeverityNumber.DEBUG, 'DEBUG', message, context);
  }

  public verbose?(message: unknown, context?: string) {
   this.write(SeverityNumber.TRACE, 'TRACE', message, context);
  }

  public event(severity: EventSeverity, eventName: string, attributes?: LogAttributes) {
   const severityNumber = SEVERITY_NUMBER[severity];
   const cleanedAttrs = this.cleanAttributes(attributes);

   if (!isTelemetryEnabled()) {
     const fallback = { event: eventName, ...cleanedAttrs };
     const line = JSON.stringify(fallback);
     if (severityNumber >= SeverityNumber.ERROR) {
       console.error(line);
     } else if (severityNumber >= SeverityNumber.WARN) {
       console.warn(line);
     } else {
       console.log(line);
     }
     return;
   }

   this.logger.emit({
     severityNumber,
     severityText: severity,
      body: eventName,
      attributes: { 'event.name': eventName, ...cleanedAttrs },
   });
  }

  private write(
   severityNumber: SeverityNumber,
   severityText: string,
   message: unknown,
   context?: string,
   trace?: string,
  ) {
   const body = this.formatMessage(message, trace);

   if (!isTelemetryEnabled()) {
     const prefix = context ? `[${context}] ` : '';
     const line = `${prefix}${body}`;
     if (severityNumber >= SeverityNumber.ERROR) {
       console.error(line);
     } else if (severityNumber >= SeverityNumber.WARN) {
       console.warn(line);
     } else {
       console.log(line);
     }
     return;
   }

   this.logger.emit({
     severityNumber,
     severityText,
     body,
      attributes: {
       ...(context ? { 'log.context': context } : {}),
       ...(trace ? { 'exception.stacktrace': trace } : {}),
     },
   });
  }

  private cleanAttributes(attrs?: LogAttributes): Record<string, string | number | boolean> {
   if (!attrs) return {};
   const out: Record<string, string | number | boolean> = {};
   for (const [key, value] of Object.entries(attrs)) {
     if (value === undefined || value === null) continue;
     out[key] = value;
   }
   return out;
  }

  private formatMessage(message: unknown, trace?: string) {
   const base =
     typeof message === 'string'
       ? message
       : message instanceof Error
         ? message.message
         : JSON.stringify(message);
   return trace ? `${base}\n${trace}` : base;
  }
}
