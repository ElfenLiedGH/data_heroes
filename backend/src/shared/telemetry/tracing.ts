import { SpanStatusCode, trace } from '@opentelemetry/api';
import { serviceName } from '../../telemetry';

const tracer = trace.getTracer(serviceName);

type SpanAttributes = Record<string, string | number | boolean | undefined | null>;

function cleanAttributes(attrs?: SpanAttributes): Record<string, string | number | boolean> {
  if (!attrs) return {};
  const out: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(attrs)) {
    if (value === undefined || value === null) continue;
    out[key] = value;
  }
  return out;
}

export async function withSpan<T>(
  name: string,
  attributes: SpanAttributes,
  fn: () => Promise<T>,
): Promise<T> {
  return tracer.startActiveSpan(name, { attributes: cleanAttributes(attributes) }, async (span) => {
    try {
      const result = await fn();
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (err) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: err instanceof Error ? err.message : String(err),
      });
      if (err instanceof Error) {
        span.recordException(err);
      }
      throw err;
    } finally {
      span.end();
    }
  });
}

export function setSpanAttributes(attrs: SpanAttributes) {
  const span = trace.getActiveSpan();
  if (!span) return;
  for (const [key, value] of Object.entries(cleanAttributes(attrs))) {
    span.setAttribute(key, value);
  }
}
