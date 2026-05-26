import { InMemoryCache, InMemoryCacheConfig } from './in-memory-cache';
import { RedisPubSubService } from '../pubsub/redis-pubsub.service';
import { OtelLoggerService } from '../logging/otel-logger.service';

type Sub = (payload: unknown, meta: { fromSelf: boolean }) => void | Promise<void>;

function makeDeps() {
  let subscriberHandler: Sub | null = null;
  const pubsub = {
    subscribe: jest.fn().mockImplementation((_channel: string, handler: Sub) => {
      subscriberHandler = handler;
      return Promise.resolve();
    }),
    publish: jest.fn().mockResolvedValue(undefined),
  };
  const logger = { event: jest.fn() };
  return {
    pubsub: pubsub as unknown as RedisPubSubService,
    logger: logger as unknown as OtelLoggerService,
    fireRemoteMessage: async (payload: unknown, fromSelf: boolean) => {
      if (!subscriberHandler) throw new Error('subscribe was not called');
      await subscriberHandler(payload, { fromSelf });
    },
    pubsubMock: pubsub,
    loggerMock: logger,
  };
}

function makeConfig<T>(overrides: Partial<InMemoryCacheConfig<T>> = {}): InMemoryCacheConfig<T> {
  return {
    name: 'test',
    loader: overrides.loader ?? (jest.fn().mockResolvedValue([] as unknown as T) as () => Promise<T>),
    ttlMs: 60_000,
    invalidationChannel: 'test:invalidate',
    ...overrides,
  };
}

describe('InMemoryCache', () => {
  it('loads on init and serves from memory', async () => {
    const loader = jest.fn().mockResolvedValue(['a', 'b']);
    const deps = makeDeps();
    const cache = new InMemoryCache(makeConfig<string[]>({ loader }), deps);

    await cache.init();

    expect(loader).toHaveBeenCalledTimes(1);
    expect(await cache.get()).toEqual(['a', 'b']);
    expect(await cache.get()).toEqual(['a', 'b']);
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it('concurrent get during initial load awaits the same loader call', async () => {
    let resolveLoad!: (v: string[]) => void;
    const loader = jest.fn().mockReturnValue(
      new Promise<string[]>((resolve) => {
        resolveLoad = resolve;
      }),
    );
    const deps = makeDeps();
    const cache = new InMemoryCache(makeConfig<string[]>({ loader }), deps);

    const initPromise = cache.init();
    const a = cache.get();
    const b = cache.get();
    resolveLoad(['x']);

    await initPromise;
    await expect(a).resolves.toEqual(['x']);
    await expect(b).resolves.toEqual(['x']);
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it('stale-while-revalidate: возвращает старый снимок, в фоне обновляет', async () => {
    const loader = jest.fn();
    loader.mockResolvedValueOnce(['old']);

    const deps = makeDeps();
    const cache = new InMemoryCache(makeConfig<string[]>({ loader }), deps);
    await cache.init();

    // Эмулируем "просрочку" — переписываем loadedAt в прошлое.
    const internal = cache as unknown as { state: { loadedAt: number } };
    internal.state.loadedAt = Date.now() - 10 * 60 * 1000;

    let resolveBg!: (v: string[]) => void;
    loader.mockReturnValueOnce(
      new Promise<string[]>((resolve) => {
        resolveBg = resolve;
      }),
    );

    const result = await cache.get();
    expect(result).toEqual(['old']);
    expect(loader).toHaveBeenCalledTimes(2);

    resolveBg(['fresh']);
    await new Promise((r) => setImmediate(r));

    expect(await cache.get()).toEqual(['fresh']);
    expect(loader).toHaveBeenCalledTimes(2);
  });

  it('invalidateAndPublish refreshes locally and publishes to channel', async () => {
    const loader = jest.fn().mockResolvedValueOnce(['v1']).mockResolvedValueOnce(['v2']);
    const deps = makeDeps();
    const cache = new InMemoryCache(makeConfig<string[]>({ loader }), deps);
    await cache.init();

    await cache.invalidateAndPublish('test.changed');

    expect(loader).toHaveBeenCalledTimes(2);
    expect(await cache.get()).toEqual(['v2']);
    expect(deps.pubsubMock.publish).toHaveBeenCalledWith('test:invalidate', {
      reason: 'test.changed',
    });
  });

  it('remote pub/sub triggers refresh, self is ignored', async () => {
    const loader = jest.fn().mockResolvedValueOnce(['v1']);
    const deps = makeDeps();
    const cache = new InMemoryCache(makeConfig<string[]>({ loader }), deps);
    await cache.init();

    // self → skip
    await deps.fireRemoteMessage({}, true);
    await new Promise((r) => setImmediate(r));
    expect(loader).toHaveBeenCalledTimes(1);

    // remote → background refresh
    loader.mockResolvedValueOnce(['v2']);
    await deps.fireRemoteMessage({}, false);
    await new Promise((r) => setImmediate(r));
    expect(loader).toHaveBeenCalledTimes(2);
    expect(await cache.get()).toEqual(['v2']);
  });

  it('initial load failure is logged, next get retries', async () => {
    const loader = jest.fn().mockRejectedValueOnce(new Error('db down'));
    const deps = makeDeps();
    const cache = new InMemoryCache(makeConfig<string[]>({ loader }), deps);

    await cache.init();

    expect(deps.loggerMock.event).toHaveBeenCalledWith(
      'ERROR',
      'cache.initial_load_failed',
      expect.objectContaining({
        'cache.name': 'test',
        'error.message': 'db down',
      }),
    );

    loader.mockResolvedValueOnce(['ok']);
    await expect(cache.get()).resolves.toEqual(['ok']);
  });

  it('without invalidationChannel skips subscribe and publish', async () => {
    const loader = jest.fn().mockResolvedValue(['v1']);
    const deps = makeDeps();
    const cache = new InMemoryCache(
      makeConfig<string[]>({ loader, invalidationChannel: undefined }),
      deps,
    );

    await cache.init();
    expect(deps.pubsubMock.subscribe).not.toHaveBeenCalled();

    await cache.invalidateAndPublish('whatever');
    expect(deps.pubsubMock.publish).not.toHaveBeenCalled();
  });

  it('dispose stops further refreshes', async () => {
    const loader = jest.fn().mockResolvedValueOnce(['v1']);
    const deps = makeDeps();
    const cache = new InMemoryCache(makeConfig<string[]>({ loader }), deps);
    await cache.init();

    cache.dispose();

    // refresh после dispose не дёргает loader, отдаёт последний снимок
    expect(await cache.refresh()).toEqual(['v1']);
    expect(loader).toHaveBeenCalledTimes(1);
  });
});
