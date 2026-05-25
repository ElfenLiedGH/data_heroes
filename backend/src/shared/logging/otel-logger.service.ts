import { Injectable, LoggerService } from '@nestjs/common';
import { logs, SeverityNumber } from '@opentelemetry/api-logs';
import { isTelemetryEnabled, serviceName } from '../../telemetry';

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
