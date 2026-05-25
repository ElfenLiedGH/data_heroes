import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';
import { logs } from '@opentelemetry/api-logs';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-grpc';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-grpc';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { BatchLogRecordProcessor, LoggerProvider } from '@opentelemetry/sdk-logs';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { NodeSDK } from '@opentelemetry/sdk-node';
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from '@opentelemetry/semantic-conventions';

const serviceName =
  process.env.OTEL_SERVICE_NAME ?? 'notification-preferences-backend';
const serviceVersion = process.env.npm_package_version ?? '1.0.0';
const otlpEndpoint =
  process.env.OTEL_EXPORTER_OTLP_ENDPOINT ?? 'http://localhost:4317';

function isTelemetryEnabled() {
  return process.env.OTEL_SDK_DISABLED !== 'true';
}

export function initTelemetry(): void {
  if (!isTelemetryEnabled()) {
   return;
  }

  if (process.env.OTEL_DEBUG === 'true') {
   diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);
  }

  const resource = resourceFromAttributes({
   [ATTR_SERVICE_NAME]: serviceName,
   [ATTR_SERVICE_VERSION]: serviceVersion,
  });

  const traceExporter = new OTLPTraceExporter({ url: otlpEndpoint });
  const metricExporter = new OTLPMetricExporter({ url: otlpEndpoint });
  const logExporter = new OTLPLogExporter({ url: otlpEndpoint });

  const loggerProvider = new LoggerProvider({
   resource,
   processors: [new BatchLogRecordProcessor(logExporter)],
  });
  logs.setGlobalLoggerProvider(loggerProvider);

  const sdk = new NodeSDK({
   resource,
   traceExporter,
   metricReader: new PeriodicExportingMetricReader({
     exporter: metricExporter,
     exportIntervalMillis: 15_000,
   }),
   instrumentations: [
     getNodeAutoInstrumentations({
       '@opentelemetry/instrumentation-fs': { enabled: false },
       '@opentelemetry/instrumentation-http': {
         ignoreIncomingRequestHook: (request) => {
           const url = request.url ?? '';
           return url === '/metrics' || url.startsWith('/api/docs');
         },
       },
       '@opentelemetry/instrumentation-express': { enabled: true },
     }),
   ],
  });

  sdk.start();

  const shutdown = async () => {
   await Promise.all([sdk.shutdown(), loggerProvider.shutdown()]);
  };

  process.once('SIGTERM', shutdown);
  process.once('SIGINT', shutdown);
}

initTelemetry();

export { isTelemetryEnabled, serviceName };
