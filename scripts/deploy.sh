#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

: "${DEPLOY_HOST:?DEPLOY_HOST is required}"
: "${DEPLOY_USER:?DEPLOY_USER is required}"
: "${DEPLOY_PASSWORD:?DEPLOY_PASSWORD is required}"
: "${DEPLOY_PATH:?DEPLOY_PATH is required}"

DEPLOY_PORT="${DEPLOY_PORT:-22}"
SSH_OPTS="-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o ServerAliveInterval=15 -o ServerAliveCountMax=20 -p ${DEPLOY_PORT}"

ssh_cmd() {
  sshpass -p "$DEPLOY_PASSWORD" ssh $SSH_OPTS "$DEPLOY_USER@$DEPLOY_HOST" "$@"
}

sshpass -p "$DEPLOY_PASSWORD" ssh $SSH_OPTS "$DEPLOY_USER@$DEPLOY_HOST" "mkdir -p '$DEPLOY_PATH'"

echo "Syncing files to ${DEPLOY_HOST}:${DEPLOY_PATH}..."
sshpass -p "$DEPLOY_PASSWORD" rsync -avz --delete \
  -e "ssh $SSH_OPTS" \
  --exclude '.git/' \
  --exclude 'node_modules/' \
  --exclude 'dist/' \
  --exclude 'coverage/' \
  --exclude '.env' \
  --exclude '*.log' \
  "$PROJECT_DIR/" "$DEPLOY_USER@$DEPLOY_HOST:$DEPLOY_PATH/"

ssh_cmd "cd '$DEPLOY_PATH' && stdbuf -oL -eL bash -s" <<'REMOTE'
set -euxo pipefail

export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1
export BUILDKIT_PROGRESS=plain

if [ ! -f .env.example ]; then
  echo ".env.example not found in $PWD" >&2
  exit 1
fi

cp -f .env.example .env
sed -i '/^COMPOSE_PROFILES=/d' .env 2>/dev/null || true
if grep -q '^OTEL_SDK_DISABLED=' .env 2>/dev/null; then
  sed -i 's/^OTEL_SDK_DISABLED=.*/OTEL_SDK_DISABLED=true/' .env
else
  echo 'OTEL_SDK_DISABLED=true' >> .env
fi

if docker compose version >/dev/null 2>&1; then
  COMPOSE=(docker compose --env-file .env)
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE=(docker-compose --env-file .env)
else
  echo "docker compose is not installed" >&2
  exit 1
fi

show_diagnostics() {
  echo "=== docker compose ps -a ==="
  "${COMPOSE[@]}" --profile observability ps -a || true
  echo "=== docker images (project) ==="
  docker images --format '{{.Repository}}:{{.Tag}} {{.Size}}' | head -30 || true
  echo "=== backend logs ==="
  "${COMPOSE[@]}" logs backend --tail 200 || true
  echo "=== frontend logs ==="
  "${COMPOSE[@]}" logs frontend --tail 100 || true
  echo "=== postgres logs ==="
  "${COMPOSE[@]}" logs postgres --tail 50 || true
  echo "=== gateway logs ==="
  "${COMPOSE[@]}" logs gateway --tail 50 || true
}

service_status() {
  local service=$1
  local container_id
  container_id=$("${COMPOSE[@]}" ps -q "$service" 2>/dev/null || true)
  if [ -z "$container_id" ]; then
    echo "missing"
    return
  fi
  docker inspect --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$container_id" 2>/dev/null || echo "unknown"
}

service_responds() {
  local service=$1
  local url=$2
  "${COMPOSE[@]}" exec -T "$service" wget -qO- "$url" >/dev/null 2>&1
}

require_service_started() {
  local service=$1
  local status
  status=$(service_status "$service")
  echo "check ${service} started: ${status}"
  case "$status" in
    running|healthy|starting)
      return 0
      ;;
    *)
      echo "service ${service} failed to start (status=${status})" >&2
      return 1
      ;;
  esac
}

require_service_ready() {
  local service=$1
  local status
  status=$(service_status "$service")
  echo "check ${service} ready: ${status}"
  case "$status" in
    running|healthy)
      return 0
      ;;
    *)
      echo "service ${service} is not ready (status=${status})" >&2
      return 1
      ;;
  esac
}

wait_for_service() {
  local service=$1
  local timeout=${2:-240}
  local unhealthy_after=${3:-180}
  local health_url=${4:-}
  local started=$SECONDS
  local deadline=$((started + timeout))
  local attempt=0

  while [ "$SECONDS" -lt "$deadline" ]; do
    attempt=$((attempt + 1))
    local status
    local elapsed=$((SECONDS - started))
    status=$(service_status "$service")
    echo "[${attempt}] ${service} status: ${status} (${elapsed}s elapsed)"
    if [ "$status" = "healthy" ]; then
      echo "${service} is healthy"
      return 0
    fi
    if [ -n "$health_url" ] && service_responds "$service" "$health_url"; then
      echo "${service} responds on ${health_url}"
      return 0
    fi
    if [ "$status" = "exited" ] || [ "$status" = "dead" ]; then
      echo "${service} container is not running" >&2
      return 1
    fi
    if [ "$status" = "unhealthy" ] && [ "$elapsed" -gt "$unhealthy_after" ]; then
      if [ -n "$health_url" ] && service_responds "$service" "$health_url"; then
        echo "${service} is unhealthy in docker but responds on ${health_url}"
        return 0
      fi
      echo "${service} healthcheck failed" >&2
      return 1
    fi
    sleep 5
  done

  if [ -n "$health_url" ] && service_responds "$service" "$health_url"; then
    echo "${service} timed out in docker but responds on ${health_url}"
    return 0
  fi

  echo "Timed out waiting for ${service}" >&2
  return 1
}

wait_for_gateway() {
  local deadline=$((SECONDS + 120))
  local attempt=0
  while [ "$SECONDS" -lt "$deadline" ]; do
    attempt=$((attempt + 1))
    if verify_public_health; then
      echo "Gateway health check passed (attempt ${attempt})"
      return 0
    fi
    echo "[${attempt}] waiting for gateway health..."
    sleep 3
  done
  echo "Gateway health check failed" >&2
  return 1
}

verify_public_health() {
  if command -v curl >/dev/null 2>&1 && curl -sf http://127.0.0.1/api/v1/health >/dev/null 2>&1; then
    return 0
  fi
  if docker run --rm --network host curlimages/curl:8.12.1 -sf http://127.0.0.1/api/v1/health >/dev/null 2>&1; then
    return 0
  fi
  return 1
}

log_step() {
  echo ""
  echo "========== $1 =========="
}

log_step "Stopping stack and removing volumes"
if [ -f docker-compose.yml ] || [ -f docker-compose.yaml ]; then
  "${COMPOSE[@]}" --profile observability down --volumes --remove-orphans || true
fi
"${COMPOSE[@]}" --profile observability ps -a || true

log_step "Building backend image (no cache)"
if ! "${COMPOSE[@]}" build --no-cache --pull backend; then
  echo "backend build failed" >&2
  show_diagnostics
  exit 1
fi
"${COMPOSE[@]}" images backend || true

log_step "Building frontend image (no cache)"
if ! "${COMPOSE[@]}" build --no-cache --pull frontend; then
  echo "frontend build failed" >&2
  show_diagnostics
  exit 1
fi
"${COMPOSE[@]}" images frontend || true

log_step "Pulling runtime images"
"${COMPOSE[@]}" pull postgres gateway portainer || true

log_step "Starting postgres"
if ! "${COMPOSE[@]}" up -d --force-recreate --remove-orphans postgres; then
  echo "failed to start postgres" >&2
  show_diagnostics
  exit 1
fi
require_service_started postgres
"${COMPOSE[@]}" ps -a || true

if ! wait_for_service postgres 120 90; then
  show_diagnostics
  exit 1
fi

log_step "Running database migrations"
if ! "${COMPOSE[@]}" run --rm --no-deps --entrypoint sh backend -c 'npx prisma migrate deploy'; then
  echo "database migration failed" >&2
  show_diagnostics
  exit 1
fi

log_step "Seeding database"
if ! "${COMPOSE[@]}" run --rm --no-deps --entrypoint sh backend -c 'npx --yes tsx prisma/seed.ts'; then
  echo "database seed failed" >&2
  show_diagnostics
  exit 1
fi

log_step "Starting backend"
if ! "${COMPOSE[@]}" up -d --force-recreate --remove-orphans backend; then
  echo "failed to start backend" >&2
  show_diagnostics
  exit 1
fi
require_service_started backend
"${COMPOSE[@]}" ps -a || true

if ! wait_for_service backend 300 240 "http://127.0.0.1:3000/api/v1/health"; then
  show_diagnostics
  exit 1
fi

log_step "Starting frontend"
if ! "${COMPOSE[@]}" up -d --force-recreate --remove-orphans frontend; then
  echo "failed to start frontend" >&2
  show_diagnostics
  exit 1
fi
require_service_started frontend
"${COMPOSE[@]}" ps -a || true

log_step "Starting gateway and portainer"
if ! "${COMPOSE[@]}" up -d --force-recreate --remove-orphans gateway portainer; then
  echo "failed to start gateway/portainer" >&2
  show_diagnostics
  exit 1
fi
require_service_started gateway
require_service_started portainer
"${COMPOSE[@]}" ps -a || true

if ! wait_for_gateway; then
  show_diagnostics
  exit 1
fi

log_step "Starting observability stack"
if ! "${COMPOSE[@]}" --profile observability up -d --force-recreate --remove-orphans loki tempo otel-collector postgres_exporter prometheus grafana; then
  echo "WARN: observability stack failed to start" >&2
  show_diagnostics
else
  echo "Observability stack started"
  if grep -q '^OTEL_SDK_DISABLED=true' .env 2>/dev/null; then
    sed -i 's/^OTEL_SDK_DISABLED=.*/OTEL_SDK_DISABLED=false/' .env
    "${COMPOSE[@]}" up -d --force-recreate backend
    wait_for_service backend 180 120 "http://127.0.0.1:3000/api/v1/health" || true
  fi
fi
"${COMPOSE[@]}" --profile observability ps -a || true

log_step "Verifying core services are ready"
require_service_ready postgres
require_service_ready backend
require_service_ready frontend
require_service_ready gateway

log_step "Final health check"
if ! verify_public_health; then
  show_diagnostics
  exit 1
fi

log_step "Deploy finished successfully"
"${COMPOSE[@]}" --profile observability ps || true
REMOTE
