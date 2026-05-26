import { OtelLoggerService } from '../logging/otel-logger.service';
import { RedisPubSubService } from '../pubsub/redis-pubsub.service';
import { withSpan } from '../telemetry/tracing';

export type InMemoryCacheConfig<T> = {
  /** Имя кеша — используется в логах, спанах и атрибутах. */
  readonly name: string;
  /** Функция загрузки актуальных данных (обычно — запрос в БД). */
  readonly loader: () => Promise<T>;
  /** TTL в миллисекундах. После этого срока get() возвращает stale + триггерит фоновый refresh. */
  readonly ttlMs: number;
  /**
   * Опциональный redis pub/sub канал для инвалидации между инстансами.
   * Если не указан — кеш работает изолированно (только локальный TTL).
   */
  readonly invalidationChannel?: string;
};

export type InMemoryCacheDeps = {
  readonly pubsub: RedisPubSubService;
  readonly logger: OtelLoggerService;
};

type Snapshot<T> = {
  value: T;
  loadedAt: number;
};

type InvalidationMessage = {
  reason?: string;
};

/**
 * Универсальный in-memory кеш с TTL, stale-while-revalidate, координацией
 * конкурентных читателей через общий loadingPromise и опциональной
 * pub/sub инвалидацией между инстансами.
 *
 * НЕ NestJS-провайдер. Создаётся доменными сервисами (`new InMemoryCache(...)`)
 * — это позволяет владельцу решать, как привязать loader к репозиторию
 * без громоздких generic-провайдеров в DI.
 *
 * Контракт:
 * - get(): если идёт начальная загрузка — ждём её; если данных ещё нет —
 *   грузим и ждём; если снимок свежий — возвращаем мгновенно; если stale —
 *   запускаем фоновый refresh (без await) и возвращаем stale-снимок.
 * - refresh(): принудительная перезагрузка; конкурентные вызовы шарят один
 *   loadingPromise (loader дёргается ОДИН раз).
 * - invalidateAndPublish(reason): локально refresh() + publish в pub/sub
 *   канал. Если publish упал — локальный кеш всё равно обновился.
 * - Pubsub-сообщения от себя самого (senderId == instanceId) игнорируются —
 *   мы уже обновили локальный снимок в invalidateAndPublish.
 */
export class InMemoryCache<T> {
  private state: Snapshot<T> | null = null;
  private loadingPromise: Promise<T> | null = null;
  private disposed = false;

  constructor(
    private readonly config: InMemoryCacheConfig<T>,
    private readonly deps: InMemoryCacheDeps,
  ) {}

  /**
   * Подписывается на pub/sub канал инвалидации (если задан) и выполняет
   * первую загрузку. Ошибка первой загрузки логируется, но не пробрасывается —
   * чтобы старт приложения не падал из-за временной недоступности БД.
   * Следующий вызов get() сделает retry.
   */
  public async init(): Promise<void> {
    if (this.config.invalidationChannel) {
      try {
        await this.deps.pubsub.subscribe<InvalidationMessage>(
          this.config.invalidationChannel,
          (_payload, { fromSelf }) => {
            if (fromSelf || this.disposed) return;
            this.deps.logger.event('INFO', 'cache.invalidated_remote', {
              'cache.name': this.config.name,
            });
            void this.refresh().catch((err) =>
              this.deps.logger.event('ERROR', 'cache.refresh_after_invalidation_failed', {
                'cache.name': this.config.name,
                'error.message': err instanceof Error ? err.message : String(err),
              }),
            );
          },
        );
      } catch (err) {
        // Если Redis недоступен — продолжаем без cross-instance инвалидации,
        // полагаясь на TTL. Это позволяет интеграционным тестам и dev-сетапу
        // без Redis загрузить приложение.
        this.deps.logger.event('WARN', 'cache.subscribe_failed', {
          'cache.name': this.config.name,
          'error.message': err instanceof Error ? err.message : String(err),
        });
      }
    }

    try {
      await this.refresh();
    } catch (err) {
      this.deps.logger.event('ERROR', 'cache.initial_load_failed', {
        'cache.name': this.config.name,
        'error.message': err instanceof Error ? err.message : String(err),
      });
    }
  }

  /**
   * Помечает кеш как уничтоженный — фоновые рефреши перестают пытаться
   * обновлять state. Pubsub-листенеры на subscriber-клиенте чистятся
   * глобально при shutdown через RedisPubSubService.
   */
  public dispose(): void {
    this.disposed = true;
  }

  public async get(): Promise<T> {
    if (this.loadingPromise) {
      return this.loadingPromise;
    }
    if (!this.state) {
      return this.refresh();
    }

    const age = Date.now() - this.state.loadedAt;
    if (age >= this.config.ttlMs) {
      // Stale-while-revalidate.
      void this.refresh().catch((err) =>
        this.deps.logger.event('ERROR', 'cache.background_refresh_failed', {
          'cache.name': this.config.name,
          'error.message': err instanceof Error ? err.message : String(err),
        }),
      );
    }
    return this.state.value;
  }

  /**
   * Принудительный refresh. Конкурентные вызовы получают общий promise.
   * Возвращает свежие данные.
   */
  public refresh(): Promise<T> {
    if (this.disposed) {
      // Если есть снимок — отдаём его; иначе пускай ошибка идёт наверх.
      return this.state
        ? Promise.resolve(this.state.value)
        : Promise.reject(new Error(`cache ${this.config.name} is disposed`));
    }
    if (this.loadingPromise) {
      return this.loadingPromise;
    }

    this.loadingPromise = withSpan(
      `cache.${this.config.name}.refresh`,
      { 'cache.name': this.config.name },
      async () => {
        const value = await this.config.loader();
        this.state = { value, loadedAt: Date.now() };
        this.deps.logger.event('INFO', 'cache.refreshed', {
          'cache.name': this.config.name,
        });
        return value;
      },
    ).finally(() => {
      this.loadingPromise = null;
    });

    return this.loadingPromise;
  }

  /**
   * Локальная инвалидация: перезагружает + публикует в pub/sub канал
   * (если канал настроен).
   */
  public async invalidateAndPublish(reason: string): Promise<void> {
    await this.refresh();

    if (!this.config.invalidationChannel) {
      return;
    }
    try {
      await this.deps.pubsub.publish<InvalidationMessage>(
        this.config.invalidationChannel,
        { reason },
      );
    } catch (err) {
      this.deps.logger.event('WARN', 'cache.publish_failed', {
        'cache.name': this.config.name,
        'invalidation.reason': reason,
        'error.message': err instanceof Error ? err.message : String(err),
      });
    }
  }
}
