import { Region } from '../../../../../generated/client';
import { OtelLoggerService } from '../../../../shared/logging/otel-logger.service';
import { RedisPubSubService } from '../../../../shared/pubsub/redis-pubsub.service';
import { makeGlobalPolicy } from '../../../../shared/test/factories';
import { GlobalPolicyCacheService } from './global-policy-cache.service';
import { PolicyRepositoryPort } from '../ports/global-policies/policy.repository.port';

jest.mock('../../../../shared/redis/redis.config', () => ({
  GLOBAL_POLICY_INVALIDATION_CHANNEL: 'global-policies:invalidate',
  GLOBAL_POLICY_CACHE_TTL_MS: 60_000,
}));

describe('GlobalPolicyCacheService', () => {
  let repo: jest.Mocked<Pick<PolicyRepositoryPort, 'findAll'>>;
  let pubsub: jest.Mocked<Pick<RedisPubSubService, 'subscribe' | 'publish'>>;
  let logger: jest.Mocked<Pick<OtelLoggerService, 'event'>>;
  let service: GlobalPolicyCacheService;

  beforeEach(() => {
    repo = { findAll: jest.fn() };
    pubsub = {
      subscribe: jest.fn().mockResolvedValue(undefined),
      publish: jest.fn().mockResolvedValue(undefined),
    };
    logger = { event: jest.fn() };
    service = new GlobalPolicyCacheService(
      repo as unknown as PolicyRepositoryPort,
      pubsub as unknown as RedisPubSubService,
      logger as unknown as OtelLoggerService,
    );
  });

  it('subscribes к глобал-полиси каналу и заполняет кеш при onModuleInit', async () => {
    repo.findAll.mockResolvedValue([makeGlobalPolicy({ id: 'gp-1' })]);

    await service.onModuleInit();

    expect(pubsub.subscribe).toHaveBeenCalledWith(
      'global-policies:invalidate',
      expect.any(Function),
    );
    expect(repo.findAll).toHaveBeenCalledTimes(1);
    expect(await service.getAll()).toEqual([makeGlobalPolicy({ id: 'gp-1' })]);
  });

  it('getByRegions фильтрует кешированный снимок', async () => {
    repo.findAll.mockResolvedValue([
      makeGlobalPolicy({ id: 'gp-eu', region: Region.EU }),
      makeGlobalPolicy({ id: 'gp-us', region: Region.US }),
    ]);
    await service.onModuleInit();

    expect((await service.getByRegions([Region.EU])).map((p) => p.id)).toEqual(['gp-eu']);
    expect((await service.getByRegions([Region.US, Region.EU])).map((p) => p.id).sort()).toEqual(
      ['gp-eu', 'gp-us'],
    );
    expect(await service.getByRegions([])).toEqual([]);
  });

  it('invalidateAndPublish пробрасывается в общий кеш с правильным каналом', async () => {
    repo.findAll.mockResolvedValueOnce([makeGlobalPolicy({ id: 'v1' })]);
    await service.onModuleInit();
    repo.findAll.mockResolvedValueOnce([makeGlobalPolicy({ id: 'v2' })]);

    await service.invalidateAndPublish('policy.created');

    expect((await service.getAll()).map((p) => p.id)).toEqual(['v2']);
    expect(pubsub.publish).toHaveBeenCalledWith('global-policies:invalidate', {
      reason: 'policy.created',
    });
  });
});
