<p style="color: red;">В тз явно нет, но добавил регион пользователю, т.к. это скорее всего его атрибут, но тогда evalute несовсем коректно проверять в произвольной комбинации пар пользователь-регион, оставил как есть, считаю для тестового задания будет достаточно т.к. пару пользователь-его регион тоже проверить можно</p>

# Notification Preferences Service

Сервис управления предпочтениями уведомлений и проверки возможности отправки (allow/deny). Monorepo: NestJS + Prisma ORM 7 + PostgreSQL (backend, DDD), React + Vite + @smwb/summer-ui (frontend, FSD), Docker Compose.

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
- Portainer: http://localhost:9000 (admin / admin)
- Metrics/traces/logs: OpenTelemetry OTLP → Collector (внутри Docker-сети)

Миграции применяются при каждом старте backend. Seed выполняется только при первом запуске (пустая таблица `default_preferences`).

**Demo users:** `user-07` (EU) — evaluate deny для `marketing` + `sms` + нельзя включить marketing sms в UI.

## Локальная разработка

```bash
docker compose up postgres -d

cd backend
npm install
cp ../.env.example .env
npx prisma migrate deploy
npx prisma db seed
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

CI: GitHub Actions workflow `.github/workflows/ci.yml` запускает lint, typecheck и тесты backend/frontend.

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
  http://localhost:3000/api/v1/users/user-07/preferences
```

Аутентификация: статический `X-API-Key` для внутреннего admin UI. В production обязательно задайте `API_KEY` / `VITE_API_KEY` — без env fallback отключён.

## Архитектура

- **Backend:** DDD — domain, application (use cases + ports), infrastructure (Prisma repos), presentation (REST + OpenAPI)
- **Frontend:** FSD-lite — app, pages, widgets, features, shared
- **UI:** sidebar (5 пунктов), Sheet для prefs, Modal для evaluate, confirm на delete

## Структура репозитория

```
Data_heroes/
├── backend/          # NestJS + Prisma 7
├── frontend/         # React + Vite + Summer UI
├── observability/    # Prometheus + Grafana provisioning
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
| **OpenTelemetry SDK** | auto-instrumentation HTTP/Express + business metrics + NestJS logs |
| **otel-collector** | OTLP receiver, маршрутизация в Tempo/Loki/Prometheus |
| **Prometheus** `:9090` | Метрики OTel + postgres_exporter |
| **Grafana** `:3001` | Дашборды, Explore (Logs/Traces/Metrics) |
| **Tempo** `:3200` | Distributed tracing |
| **Loki** `:3100` | Централизованные логи |
| **postgres_exporter** | Метрики PostgreSQL |

Business-метрики: `notification_evaluations_total`, `preference_updates_total`.  
HTTP-метрики — автоматически через `@opentelemetry/instrumentation-http` / `express`.

Локально (без Docker) задайте `OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317` или `OTEL_SDK_DISABLED=true`.

Только observability-стек:

```bash
docker compose up otel-collector loki tempo prometheus grafana postgres_exporter -d
```

В Grafana: **Explore → Loki** `{service_name="notification-preferences-backend"}`, **Explore → Tempo** по service name.

## Production next steps

- Ротация API keys
- Audit log UI для evaluation logs
- Rate limiting
- Outbox/events для интеграций
