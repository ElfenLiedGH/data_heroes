import {
  Inject,
  Injectable,
  OnApplicationShutdown,
  OnModuleInit,
} from '@nestjs/common';
import { Region } from '../../../../../generated/client';
import { InMemoryCache } from '../../../../shared/cache/in-memory-cache';
import { OtelLoggerService } from '../../../../shared/logging/otel-logger.service';
import { RedisPubSubService } from '../../../../shared/pubsub/redis-pubsub.service';
import {
  GLOBAL_POLICY_CACHE_TTL_MS,
  GLOBAL_POLICY_INVALIDATION_CHANNEL,
} from '../../../../shared/redis/redis.config';
import { POLICY_REPOSITORY } from '../../../../shared/tokens/repository.tokens';
import {
  GlobalPolicyRecord,
  PolicyRepositoryPort,
} from '../ports/global-policies/policy.repository.port';

/**
 * Доменная обёртка над универсальным InMemoryCache. Хранит снимок всех
 * глобал-полиси в памяти. Сам кеш-механизм (TTL, stale-while-revalidate,
 * pub/sub инвалидация) живёт в shared/cache/InMemoryCache — здесь только
 * привязка к репозиторию + фильтр по регионам.
 */
@Injectable()
export class GlobalPolicyCacheService implements OnModuleInit, OnApplicationShutdown {
  private readonly cache: InMemoryCache<GlobalPolicyRecord[]>;

  constructor(
    @Inject(POLICY_REPOSITORY)
    private readonly repository: PolicyRepositoryPort,
    pubsub: RedisPubSubService,
    logger: OtelLoggerService,
  ) {
    this.cache = new InMemoryCache<GlobalPolicyRecord[]>(
      {
        name: 'global-policies',
        loader: () => this.repository.findAll(),
        ttlMs: GLOBAL_POLICY_CACHE_TTL_MS,
        invalidationChannel: GLOBAL_POLICY_INVALIDATION_CHANNEL,
      },
      { pubsub, logger },
    );
  }

  async onModuleInit(): Promise<void> {
    await this.cache.init();
  }

  onApplicationShutdown(): void {
    this.cache.dispose();
  }

  public getAll(): Promise<GlobalPolicyRecord[]> {
    return this.cache.get();
  }

  public async getByRegions(regions: readonly Region[]): Promise<GlobalPolicyRecord[]> {
    if (regions.length === 0) {
      return [];
    }
    const all = await this.cache.get();
    const targetSet = new Set(regions);
    return all.filter((p) => targetSet.has(p.region));
  }

  public invalidateAndPublish(reason: string): Promise<void> {
    return this.cache.invalidateAndPublish(reason);
  }
}
