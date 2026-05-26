import { randomUUID } from 'node:crypto';
import { Global, Module, OnApplicationShutdown, Provider } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_URL } from './redis.config';
import { INSTANCE_ID, REDIS_PUBLISHER, REDIS_SUBSCRIBER } from './redis.tokens';

function makeClient(): Redis {
  // lazyConnect=false (default) — Redis connects автоматически.
  // retryStrategy с finite retries — если Redis недоступен (CI без redis
  // service, dev без поднятого Redis), команды отрежектятся через ~10
  // попыток вместо бесконечного зависания. InMemoryCache.init() ловит
  // ошибку subscribe и продолжает работать без cross-instance pubsub —
  // консистентность держится через TTL.
  return new Redis(REDIS_URL, {
    maxRetriesPerRequest: 3,
    enableOfflineQueue: true,
    retryStrategy(times) {
      if (times > 10) {
        return null; // hard-stop reconnect attempts after ~30s
      }
      return Math.min(times * 200, 2000);
    },
  });
}

const publisherProvider: Provider = {
  provide: REDIS_PUBLISHER,
  useFactory: () => makeClient(),
};

const subscriberProvider: Provider = {
  provide: REDIS_SUBSCRIBER,
  useFactory: () => makeClient(),
};

const instanceIdProvider: Provider = {
  provide: INSTANCE_ID,
  useFactory: () => randomUUID(),
};

@Global()
@Module({
  providers: [publisherProvider, subscriberProvider, instanceIdProvider],
  exports: [REDIS_PUBLISHER, REDIS_SUBSCRIBER, INSTANCE_ID],
})
export class RedisModule implements OnApplicationShutdown {
  constructor() {}

  async onApplicationShutdown() {
    // Соединения закроет gc, но явное закрытие даёт чистый shutdown
    // — реализация в наследниках/сервисах через DI, тут оставлен hook
    // на случай добавления централизованной чистки.
  }
}
