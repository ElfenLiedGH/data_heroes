# Notification Preferences Service

[![CI](https://github.com/ElfenLiedGH/data_heroes/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/ElfenLiedGH/data_heroes/actions/workflows/ci.yml)
[![backend](https://img.shields.io/github/check-runs/ElfenLiedGH/data_heroes/main?nameFilter=backend&label=backend)](https://github.com/ElfenLiedGH/data_heroes/actions/workflows/ci.yml)
[![frontend](https://img.shields.io/github/check-runs/ElfenLiedGH/data_heroes/main?nameFilter=frontend&label=frontend)](https://github.com/ElfenLiedGH/data_heroes/actions/workflows/ci.yml)
[![docker-build](https://img.shields.io/github/check-runs/ElfenLiedGH/data_heroes/main?nameFilter=Docker%20build%20%28smoke%29&label=docker%20build)](https://github.com/ElfenLiedGH/data_heroes/actions/workflows/ci.yml)
[![deploy](https://img.shields.io/github/check-runs/ElfenLiedGH/data_heroes/main?nameFilter=Deploy&label=deploy)](https://github.com/ElfenLiedGH/data_heroes/actions/workflows/ci.yml)

[![Live demo](https://img.shields.io/badge/live-85.192.29.222-success)](http://85.192.29.222/)
[![Node](https://img.shields.io/badge/node-24-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-11-E0234E?logo=nestjs&logoColor=white)](https://nestjs.com/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D?logo=redis&logoColor=white)](https://redis.io/)
[![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![OpenTelemetry](https://img.shields.io/badge/OpenTelemetry-instrumented-425CC7?logo=opentelemetry&logoColor=white)](https://opentelemetry.io/)
[![Docker Compose](https://img.shields.io/badge/Docker_Compose-v2-2496ED?logo=docker&logoColor=white)](https://docs.docker.com/compose/)

> [!TIP]
> **Готовый сервис доступен по адресу http://85.192.29.222/**
>
> Backend API: `http://85.192.29.222/api/v1`, Swagger: `http://85.192.29.222/api/docs`, Grafana: `http://85.192.29.222/grafana/` (admin/admin).

Сервис управления предпочтениями уведомлений и проверки возможности отправки (allow/deny). Monorepo: NestJS + Prisma ORM 7 + PostgreSQL (backend, DDD), React + Vite + @smwb/summer-ui (frontend, FSD), Docker Compose.

> [!CAUTION]
> В ТЗ явно нет, но добавил регион пользователю, т.к. это скорее всего его атрибут. Evaluate проверяет произвольную комбинацию пар «пользователь–регион», что не совсем корректно, но для тестового задания достаточно.

## Содержание

- [Быстрый старт](#быстрый-старт)
- [Локальная разработка](#локальная-разработка)
- [Тесты](#тесты)
- [API](#api)
- [Архитектура](#архитектура)
- [Observability](#observability)
- [Production deploy](#production-deploy)
- [TLS / HTTPS](#tls--https)
- [Scaling](#scaling)
- [Troubleshooting](#troubleshooting)

## Требования

- Docker и Docker Compose
- Опционально: Node.js 20+ для локальной разработки без Docker

## Быстрый старт

```bash
cp .env.example .env
docker compose up --build
```

- Приложение (frontend + API + Grafana): http://localhost/
- Backend API: http://localhost/api/v1
- Healthcheck: `GET http://localhost/api/v1/health`
- Swagger UI: http://localhost/api/docs
- Grafana: http://localhost/grafana/ (admin / `GRAFANA_ADMIN_PASSWORD`, по умолчанию `admin`)
- Metrics/traces/logs: OpenTelemetry OTLP → Collector (внутри Docker-сети)
- Кеш глобал-полиси: Redis (in-memory + pub/sub инвалидация между инстансами backend)

Миграции применяются при каждом старте backend. Seed запускается на пустую таблицу `default_preferences` и пропускается если данные уже есть.

**Demo users:** `user-07` (EU) — evaluate deny для `marketing` + `sms` + нельзя включить marketing sms в UI.

## Локальная разработка

```bash
docker compose up postgres -d

cd backend
npm install
cp ../.env.example .env
npx prisma migrate deploy
npm run prisma:seed
npm run start:dev

cd ../frontend
npm install
npm run api:generate   # backend должен быть запущен
npm run dev
```

`api:generate` загружает spec с `GET /api/openapi.json` (переменная `OPENAPI_URL`, по умолчанию `http://127.0.0.1:3000/api/openapi.json`). Промежуточный `openapi.json` в репозитории не используется.

### Сборка frontend в Docker

Backend должен быть доступен на хосте во время сборки frontend:

```bash
docker compose up backend -d
docker compose build frontend
docker compose up
```

## Тесты

```bash
cd backend && npm run test
cd backend && npm run test:integration
cd frontend && npm run test
```

CI: GitHub Actions workflow `.github/workflows/ci.yml` запускает lint, typecheck, unit/integration тесты backend/frontend и smoke-сборку обоих Docker-образов перед деплоем.

## API

| Метод | Endpoint | Описание |
|-------|----------|----------|
| GET | `/api/v1/health` | Healthcheck + статус БД (без API key) |
| GET | `/api/v1/users` | Список пользователей |
| GET | `/api/v1/users/count` | Количество пользователей |
| POST | `/api/v1/users` | Создание пользователя с defaults |
| GET | `/api/v1/users/:user_id/preferences` | Effective-предпочтения |
| POST | `/api/v1/users/:user_id/preferences` | Изменение предпочтений |
| POST | `/api/v1/evaluate` | Проверка отправки |
| DELETE | `/api/v1/users/:user_id` | Удаление пользователя |
| CRUD | `/api/v1/global-policies/*` | Глобальные политики |
| CRUD | `/api/v1/default-preferences/*` | Дефолтные настройки |

```bash
curl -H "X-API-Key: dev-notification-prefs-key-7f3e9a2b" \
  http://localhost/api/v1/users/user-07/preferences
```

Аутентификация: статический `X-API-Key` для внутреннего admin UI. В production обязательно задайте `API_KEY` / `VITE_API_KEY` — без env fallback отключён.

## Архитектура

```
                    ┌──────────────┐
        (port 80) ──┤   gateway    │── nginx + cache + gzip + security headers
                    │   (nginx)    │
                    └──────┬───────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
         frontend       backend     grafana (sub-path /grafana/)
         (nginx 8080)   (Nest 3000)
                          │ │
                          │ └─► redis (pub/sub: global-policies:invalidate)
                          ▼
                       ┌────────┐
                       │postgres│
                       │(internal net)
                       └────────┘
                           │
                           └─► postgres_exporter ──► prometheus
                           └─► backend OTLP ──► otel-collector ─► loki/tempo/prometheus
```

- **Backend:** DDD — domain (чистые правила), application (use cases + ports), infrastructure (Prisma repos), presentation (REST + OpenAPI). Транзакции для multi-step апсертов prefs+quiet_hours. Common query service `UserPreferenceContextService` для загрузки контекста.
- **Кеш-примитив:** `shared/cache/InMemoryCache<T>` — переиспользуемый класс (не Injectable), параметризуется `{ name, loader, ttlMs, invalidationChannel? }` + DI-зависимостями `{ pubsub, logger }`. Внутри: координация конкурентных читателей через общий `loadingPromise`, TTL + stale-while-revalidate, фильтрация pub/sub сообщений по `senderId`, общий шаблон спанов `cache.{name}.refresh`. Доменные сервисы держат `new InMemoryCache(...)` и добавляют свои методы поверх.
- **Кеш глобал-полиси:** `GlobalPolicyCacheService` — тонкая обёртка над `InMemoryCache<GlobalPolicyRecord[]>`. Снэпшот всех политик в памяти каждого backend-инстанса, TTL 10 минут. При запросе: свежий — отдаём мгновенно; устаревший — отдаём stale и параллельно запускаем фоновый refresh; первая загрузка — все читатели ждут общий промис. На create/update/delete политики локально обновляем + публикуем `global-policies:invalidate` через Redis pub/sub. Сообщения от себя самого игнорируются; остальные инстансы делают `refresh()` асинхронно.
- **Frontend:** FSD-lite — app (router + layout + ErrorBoundary), pages (lazy chunks), widgets, features (формы), shared (UI/api/hooks).
- **Networks:** `internal` (postgres + redis + backend + postgres_exporter, isolated from internet via `internal: true`) и `app` (всё остальное, наружу торчит только gateway:80). backend и postgres_exporter в обеих сетях.
- **Non-root:** backend бежит под `node`, frontend — `nginxinc/nginx-unprivileged` (uid 101 на порту 8080), gateway — стандартный nginx:alpine (root, чтобы биндить 80).

## Структура репозитория

```
Data_heroes/
├── backend/          # NestJS + Prisma 7
├── frontend/         # React + Vite + Summer UI
├── nginx/            # gateway.conf
├── observability/    # Prometheus + Grafana provisioning, Loki/Tempo/OTel configs
├── scripts/          # deploy.sh (outer) + deploy-remote.sh (inner)
├── .github/workflows/ci.yml
├── docker-compose.yml
├── .env.example
└── README.md
```

## Observability

Стек на базе **OpenTelemetry** — backend шлёт traces, metrics и logs через OTLP gRPC в Collector, дальше они попадают в Tempo, Loki и Prometheus.

```
backend ──OTLP(4317)──► otel-collector ──┬──► Tempo (traces)
                                         ├──► Loki (logs)
                                         └──► Prometheus (metrics, :8889)
                                                  │
                                             Grafana (:3001)
```

| Компонент | Назначение |
|-----------|------------|
| **OpenTelemetry SDK** | auto-instrumentation HTTP/Express + custom spans + business metrics + NestJS logs |
| **otel-collector** | OTLP receiver, маршрутизация в Tempo/Loki/Prometheus |
| **Prometheus** `:9090` | Метрики OTel + postgres_exporter, **alert rules** в `observability/prometheus/rules/` |
| **Grafana** `:3001` | Provisioned dashboards (`Notification Preferences` folder) + Explore |
| **Tempo** `:3200` | Distributed tracing |
| **Loki** `:3100` | Централизованные логи |
| **postgres_exporter** | Метрики PostgreSQL |

Business-метрики: `notification_evaluations_total`, `preference_updates_total`. Custom spans: `evaluate.notification`, `evaluate.load_context`, `evaluate.apply_rules`, `preferences.update`, `preferences.apply_changes`.

Локально (без Docker) задайте `OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317` или `OTEL_SDK_DISABLED=true`.

Только observability-стек:

```bash
docker compose --profile observability up otel-collector loki tempo prometheus grafana postgres_exporter -d
```

В Grafana: **Explore → Loki** `{service_name="notification-preferences-backend"}`, **Explore → Tempo** по service name. Алерты Prometheus — `http://localhost:9090/alerts`.

## Production deploy

### Обязательные переменные окружения

| Переменная | Назначение | Дефолт |
|------------|------------|--------|
| `API_KEY` | секретный ключ для admin UI / API | dev-fallback (НЕ для prod) |
| `VITE_API_KEY` | тот же ключ, встраивается в frontend bundle при сборке | dev-fallback |
| `GRAFANA_ADMIN_USER` / `GRAFANA_ADMIN_PASSWORD` | admin Grafana | admin / admin |
| `REDIS_URL` | подключение к Redis для pubsub-инвалидации кеша | redis://redis:6379 |
| `GLOBAL_POLICY_CACHE_TTL_MS` | TTL in-memory кеша глобал-полиси на инстансе backend | 600000 (10мин) |
| `GLOBAL_POLICY_INVALIDATION_CHANNEL` | имя redis pub/sub канала для инвалидации кеша | global-policies:invalidate |
| `OTEL_SDK_DISABLED` | отключить OTEL экспорт | false |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | куда слать OTLP | http://otel-collector:4317 |

### Деплой через GitHub Actions

Workflow `.github/workflows/ci.yml` собирает tests + docker images + при push в `main` запускает `scripts/deploy.sh`. Требуемые secrets:

- `DEPLOY_HOST` — IP сервера
- `DEPLOY_USER` — root или sudo-юзер
- `DEPLOY_PASSWORD` — пароль (TODO: перейти на SSH-key, см. ниже)
- `DEPLOY_PATH` — куда rsync кладёт проект (например `/opt/notif-prefs`)
- `DEPLOY_PORT` — SSH порт (по умолчанию 22)

`scripts/deploy.sh` (outer): запускается на GHA runner — rsync проекта + ssh с вызовом `scripts/deploy-remote.sh` на сервере.

`scripts/deploy-remote.sh` (inner): на сервере — down --volumes (полный wipe), build, postgres → migrate → seed → observability backbone → backend → frontend → gateway → остальная observability → public health + post-deploy stability check.

### Минимальные требования к серверу

- 2 CPU, 4 GB RAM (или 2 GB RAM + 2 GB swap, см. [Troubleshooting](#troubleshooting))
- 20 GB disk
- Docker 24+ с Compose v2 plugin
- Открытые порты: 80 (http)
- Linux ядро 5.x+ (нужен journalctl для OOM-диагностики деплоя)

### Ротация секретов

```bash
# 1. сгенерировать новый API key (32 байта hex)
openssl rand -hex 32

# 2. обновить secrets в GHA: API_KEY и VITE_API_KEY (значения должны совпадать)

# 3. trigger redeploy
gh workflow run ci.yml -f deploy=true
```

`VITE_API_KEY` встраивается в bundle на этапе сборки frontend, поэтому смена требует пересборки образа — повторный деплой это делает (`--no-cache --pull`).

## TLS / HTTPS

Текущая конфигурация слушает только HTTP на порту 80. Для prod добавить TLS-терминацию через **Caddy** (proxy перед gateway) — проще всего:

```yaml
# Дополнительный сервис в docker-compose.yml
services:
  caddy:
    image: caddy:2-alpine
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    networks: [app]
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy_data:/data
      - caddy_config:/config
    depends_on:
      gateway:
        condition: service_healthy

volumes:
  caddy_data:
  caddy_config:
```

`Caddyfile`:

```caddyfile
notif-prefs.example.com {
  reverse_proxy gateway:80
}
```

И убрать `ports: ['80:80']` у gateway (он становится internal).

Альтернативы: Traefik (метки на сервисах), nginx-proxy + acme-companion, terminating LB у облака.

## Scaling

Backend **stateless per-request**, но **не stateless в чистом виде** — каждый инстанс держит in-memory кеш глобал-политик. Это безопасно для горизонтального масштабирования благодаря следующему:

- Auth: статический API key, проверяется в `ApiKeyGuard` каждый раз без сессии — состояние не нужно.
- Контекст пользователя — каждый раз заново загружается из БД (см. `UserPreferenceContextService`); per-user state не кешируется.
- **In-memory cache (`shared/cache/InMemoryCache`):** хранит производные данные (сейчас — только глобал-политики), не source of truth. Источник правды — БД. Кеш — это оптимизация read-path. Консистентность между репликами:
  - При локальной мутации (`Create/Update/DeleteGlobalPolicyUseCase`) — `cache.invalidateAndPublish(reason)`: локально обновляем + публикуем в Redis pub/sub канал `global-policies:invalidate`.
  - Получатели по `senderId != instanceId` асинхронно делают `refresh()` → у других реплик кеш обновляется в пределах сетевой задержки.
  - Если Redis недоступен или сообщение потерялось (Redis pub/sub fire-and-forget без persistence), max staleness = TTL (10 минут) — гарантирована корректность через периодический refresh.
- Telemetry — экспорт через OTLP, асинхронный.

→ Можно запускать **несколько реплик backend** за gateway без sticky sessions. Узкое место — postgres. Шаги для горизонтального масштабирования:

1. Поднять реплики backend (`docker compose up -d --scale backend=3`) — gateway round-robin.
2. БД: подключить connection pooler (pgbouncer) если open connections > pool_size.
3. Кеш глобал-полиси: уже описан выше — work-as-is, реплики координируются через Redis pub/sub + TTL fallback.
4. Если появятся другие производные кеши (default-preferences, lookup-таблицы) — переиспользовать `InMemoryCache<T>` со своим channel: ровно тот же контракт корректности.
5. Observability: Tempo/Loki из локальной ФС переключить на S3-совместимое хранилище.

Gateway nginx без состояния → можно держать N реплик за внешним LB, но при использовании Caddy для TLS он сам становится точкой контакта.

## Troubleshooting

### Деплой проходит, но контейнеры дохнут после старта

Чаще всего — **OOM на хосте**. 2 GB RAM без swap не хватает на полный observability-стек.

**Диагностика:**

```bash
ssh root@server "free -h; journalctl -k --since '30 min ago' | grep -i oom"
```

В CI логах после деплоя видна секция `=== dmesg tail ===` и `=== journalctl OOM lookup ===` — они покажут что было убито.

**Фикс №1 — добавить swap:**

```bash
fallocate -l 2G /swapfile && chmod 600 /swapfile
mkswap /swapfile && swapon /swapfile
echo "/swapfile none swap sw 0 0" >> /etc/fstab
```

**Фикс №2 — ужать observability** (если RAM упорно мало): убрать `--profile observability` из deploy-remote.sh (тогда поднимутся только postgres/redis/backend/frontend/gateway), либо снизить `mem_limit` у loki/tempo/prometheus/grafana до 128m.

### Grafana redirect loop

Если `/grafana/` крутит редиректы в `/grafana/login` бесконечно — это значит nginx срезал префикс `/grafana/` перед проксированием. В `nginx/gateway.conf` должно быть `proxy_pass http://$grafana_upstream$request_uri;` (с `$request_uri`), а не `proxy_pass http://$grafana_upstream/grafana/;` (без — переменная в `proxy_pass` ломает мапинг URI).

### Seed падает с MODULE_NOT_FOUND

В prod-образе нет `src/` (только `dist/`), а `prisma/seed.ts` импортирует `../src/shared/fixtures/seed-data.fixture`. Использовать **скомпилированную** версию: `npm run prisma:seed:prod` (= `node dist/prisma/seed.js`). Это уже сделано в `scripts/deploy-remote.sh`, локально для dev — `npm run prisma:seed` (tsx + src/).

### Healthcheck падает после --force-recreate

`docker compose up --force-recreate` иногда оставляет контейнер в состоянии `starting` слишком долго. В `deploy-remote.sh` есть `wait_for_running` с retry до 60s — если упало здесь, посмотрите `docker logs <service>` (полный лог в `/tmp/deploy.log` на сервере после деплоя).

### docker compose run "съедает" stdin

Если `docker compose run` без `-T` запускается из скрипта который читает из stdin (heredoc, pipe), container может **сожрать остаток stdin родителя**. Симптом: CI рапортует success, но после migrate ничего не выполнилось. Решение — `-T --rm ... < /dev/null` для всех `run` вызовов (уже сделано в `deploy-remote.sh`).

### Чтение лога деплоя на сервере

```bash
ssh root@server "tail -200 /tmp/deploy.log"
```

`/tmp/deploy.log` накапливается каждым деплоем (последний перезаписывает).

## Production next steps

- Перейти на SSH-key auth вместо `sshpass + password` в деплое
- Ротация API keys через secret manager (не env)
- Audit log UI для evaluation logs
- Rate limiting (`@nestjs/throttler`)
- `helmet` для security headers на backend (сейчас только на gateway)
- Outbox/events для интеграций с реальными каналами доставки
- node_exporter в observability для host-level метрик и алертов
- Tempo/Loki: миграция с local FS на S3-совместимое хранилище
