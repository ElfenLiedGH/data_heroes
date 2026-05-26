import {
  Inject,
  Injectable,
  OnApplicationShutdown,
  OnModuleInit,
} from '@nestjs/common';
import type Redis from 'ioredis';
import { OtelLoggerService } from '../logging/otel-logger.service';
import {
  INSTANCE_ID,
  REDIS_PUBLISHER,
  REDIS_SUBSCRIBER,
} from '../redis/redis.tokens';

type Envelope<T> = {
  readonly senderId: string;
  readonly payload: T;
};

type Handler<T> = (payload: T) => void | Promise<void>;

@Injectable()
export class RedisPubSubService implements OnModuleInit, OnApplicationShutdown {
  private readonly channels = new Map<string, Set<Handler<unknown>>>();
  private listenerAttached = false;

  constructor(
    @Inject(REDIS_PUBLISHER) private readonly publisher: Redis,
    @Inject(REDIS_SUBSCRIBER) private readonly subscriber: Redis,
    @Inject(INSTANCE_ID) private readonly instanceId: string,
    private readonly logger: OtelLoggerService,
  ) {}

  public get id(): string {
    return this.instanceId;
  }

  onModuleInit() {
    this.subscriber.on('message', (channel: string, raw: string) => {
      void this.dispatch(channel, raw);
    });
    this.listenerAttached = true;
  }

  async onApplicationShutdown() {
    try {
      this.subscriber.removeAllListeners('message');
      await this.subscriber.quit();
    } catch {
      /* noop */
    }
    try {
      await this.publisher.quit();
    } catch {
      /* noop */
    }
  }

  public async publish<T>(channel: string, payload: T): Promise<void> {
    const envelope: Envelope<T> = { senderId: this.instanceId, payload };
    await this.publisher.publish(channel, JSON.stringify(envelope));
  }

  public async subscribe<T>(
    channel: string,
    handler: (payload: T, meta: { fromSelf: boolean }) => void | Promise<void>,
  ): Promise<void> {
    let listeners = this.channels.get(channel);
    if (!listeners) {
      listeners = new Set();
      this.channels.set(channel, listeners);
      await this.subscriber.subscribe(channel);
    }
    listeners.add((envelope: unknown) => {
      const e = envelope as Envelope<T>;
      return handler(e.payload, { fromSelf: e.senderId === this.instanceId });
    });
  }

  private async dispatch(channel: string, raw: string) {
    if (!this.listenerAttached) return;
    const handlers = this.channels.get(channel);
    if (!handlers || handlers.size === 0) return;

    let envelope: Envelope<unknown>;
    try {
      envelope = JSON.parse(raw) as Envelope<unknown>;
    } catch (err) {
      this.logger.event('WARN', 'pubsub.invalid_message', {
        'pubsub.channel': channel,
        'error.message': err instanceof Error ? err.message : String(err),
      });
      return;
    }

    for (const handler of handlers) {
      try {
        await handler(envelope);
      } catch (err) {
        this.logger.event('ERROR', 'pubsub.handler_error', {
          'pubsub.channel': channel,
          'error.message': err instanceof Error ? err.message : String(err),
        });
      }
    }
  }
}
