#!/usr/bin/env bash
set -euxo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_DIR"

export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1
export BUILDKIT_PROGRESS=plain

if [ ! -f .env.example ]; then
  echo ".env.example not found in $PWD" >&2
  exit 1
fi

cp -f .env.example .env
sed -i '/^COMPOSE_PROFILES=/d' .env 2>/dev/null || true

if docker compose version >/dev/null 2>&1; then
  COMPOSE=(docker compose --env-file .env --profile observability)
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE=(docker-compose --env-file .env --profile observability)
else
  echo "docker compose is not installed" >&2
  exit 1
fi

echo "=== Host resources (pre-deploy) ==="
free -h 2>/dev/null || true
df -h / 2>/dev/null || true
nproc 2>/dev/null || true
docker info --format 'Containers: {{.Containers}} Running: {{.ContainersRunning}}' 2>/dev/null || true

CORE_SERVICES=(postgres redis backend frontend gateway)
OBS_SERVICES=(loki tempo otel-collector postgres_exporter prometheus grafana)
ALL_SERVICES=("${CORE_SERVICES[@]}" "${OBS_SERVICES[@]}")

log_step() {
  echo ""
  echo "========== $1 =========="
}

show_diagnostics() {
  echo "=== docker compose ps -a ==="
  "${COMPOSE[@]}" ps -a || true
  echo "=== docker images (project) ==="
  docker images --format '{{.Repository}}:{{.Tag}} {{.Size}}' | head -30 || true
  for svc in "${ALL_SERVICES[@]}"; do
    echo "=== ${svc} logs (tail 100) ==="
    "${COMPOSE[@]}" logs "$svc" --tail 100 || true
  done
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

verify_public_health() {
  if command -v curl >/dev/null 2>&1 && curl -sf http://127.0.0.1/api/v1/health >/dev/null 2>&1; then
    return 0
  fi
  if docker run --rm --network host curlimages/curl:8.12.1 -sf http://127.0.0.1/api/v1/health >/dev/null 2>&1; then
    return 0
  fi
  return 1
}

wait_for_gateway() {
  local deadline=$((SECONDS + 180))
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

wait_for_running() {
  local service=$1
  local deadline=$((SECONDS + 60))
  while [ "$SECONDS" -lt "$deadline" ]; do
    local status
    status=$(service_status "$service")
    case "$status" in
      running|healthy)
        return 0
        ;;
      starting|restarting|created)
        sleep 2
        ;;
      *)
        echo "service ${service} not running (status=${status})" >&2
        return 1
        ;;
    esac
  done
  echo "service ${service} did not reach running state in time" >&2
  return 1
}

log_step "Stopping stack and removing volumes"
if [ -f docker-compose.yml ] || [ -f docker-compose.yaml ]; then
  "${COMPOSE[@]}" down --volumes --remove-orphans || true
fi
"${COMPOSE[@]}" ps -a || true

log_step "Building backend image (no cache)"
if ! "${COMPOSE[@]}" build --no-cache --pull backend; then
  echo "backend build failed" >&2
  show_diagnostics
  exit 1
fi

log_step "Building frontend image (no cache)"
if ! "${COMPOSE[@]}" build --no-cache --pull frontend; then
  echo "frontend build failed" >&2
  show_diagnostics
  exit 1
fi

log_step "Pulling runtime images"
"${COMPOSE[@]}" pull postgres redis gateway "${OBS_SERVICES[@]}" || true

log_step "Starting postgres"
if ! "${COMPOSE[@]}" up -d --force-recreate postgres; then
  echo "failed to start postgres" >&2
  show_diagnostics
  exit 1
fi
if ! wait_for_service postgres 120 90; then
  show_diagnostics
  exit 1
fi

log_step "Starting redis"
if ! "${COMPOSE[@]}" up -d --force-recreate redis; then
  echo "failed to start redis" >&2
  show_diagnostics
  exit 1
fi
if ! wait_for_service redis 60 40; then
  show_diagnostics
  exit 1
fi

log_step "Running database migrations"
if ! "${COMPOSE[@]}" run -T --rm --no-deps --entrypoint sh backend -c 'npx prisma migrate deploy' < /dev/null; then
  echo "database migration failed" >&2
  show_diagnostics
  exit 1
fi

log_step "Seeding database"
if ! "${COMPOSE[@]}" run -T --rm --no-deps --entrypoint sh backend -c 'npm run prisma:seed:prod' < /dev/null; then
  echo "database seed failed" >&2
  show_diagnostics
  exit 1
fi

log_step "Starting observability backbone (loki, tempo, otel-collector)"
if ! "${COMPOSE[@]}" up -d --force-recreate loki tempo otel-collector; then
  echo "WARN: observability backbone failed to start" >&2
  show_diagnostics
fi

log_step "Starting backend"
if ! "${COMPOSE[@]}" up -d --force-recreate backend; then
  echo "failed to start backend" >&2
  show_diagnostics
  exit 1
fi
if ! wait_for_service backend 300 240 "http://127.0.0.1:3000/api/v1/health"; then
  show_diagnostics
  exit 1
fi

log_step "Starting frontend"
if ! "${COMPOSE[@]}" up -d --force-recreate frontend; then
  echo "failed to start frontend" >&2
  show_diagnostics
  exit 1
fi
if ! wait_for_service frontend 120 90 "http://127.0.0.1/"; then
  show_diagnostics
  exit 1
fi

log_step "Starting gateway"
if ! "${COMPOSE[@]}" up -d --force-recreate gateway; then
  echo "failed to start gateway" >&2
  show_diagnostics
  exit 1
fi
if ! wait_for_gateway; then
  show_diagnostics
  exit 1
fi

log_step "Starting remaining observability (postgres_exporter, prometheus, grafana)"
if ! "${COMPOSE[@]}" up -d --force-recreate postgres_exporter prometheus grafana; then
  echo "WARN: remaining observability failed to start" >&2
  show_diagnostics
fi

log_step "Verifying core services are running"
core_failed=0
for svc in "${CORE_SERVICES[@]}"; do
  if ! wait_for_running "$svc"; then
    core_failed=1
  fi
done
if [ "$core_failed" -ne 0 ]; then
  show_diagnostics
  exit 1
fi

log_step "Checking observability services"
for svc in "${OBS_SERVICES[@]}"; do
  status=$(service_status "$svc")
  echo "${svc}: ${status}"
done

log_step "Final public health check"
if ! verify_public_health; then
  show_diagnostics
  exit 1
fi

log_step "Post-deploy stability check (sleep 30s, then re-verify)"
sleep 30
post_failed=0
for svc in "${CORE_SERVICES[@]}"; do
  status=$(service_status "$svc")
  echo "after 30s ${svc}: ${status}"
  case "$status" in
    running|healthy)
      ;;
    *)
      post_failed=1
      ;;
  esac
done
echo "=== docker compose ps -a (post-stability) ==="
"${COMPOSE[@]}" ps -a || true
echo "=== docker stats snapshot ==="
docker stats --no-stream --format 'table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}' 2>/dev/null || true
echo "=== Host resources (post-deploy) ==="
free -h 2>/dev/null || true
df -h / 2>/dev/null || true
echo "=== dmesg tail (looking for OOM kills) ==="
if dmesg 2>/dev/null | tail -40; then
  :
elif sudo -n dmesg 2>/dev/null | tail -40; then
  :
else
  echo "dmesg not accessible (kernel.dmesg_restrict + no passwordless sudo)"
fi
echo "=== journalctl OOM lookup ==="
if command -v journalctl >/dev/null 2>&1; then
  journalctl -k --since "10 minutes ago" 2>/dev/null | grep -iE 'oom|killed' | tail -20 || true
  sudo -n journalctl -k --since "10 minutes ago" 2>/dev/null | grep -iE 'oom|killed' | tail -20 || true
fi

if [ "$post_failed" -ne 0 ]; then
  echo "One or more core services died within 30s of deploy" >&2
  show_diagnostics
  exit 1
fi

log_step "Deploy finished successfully"
"${COMPOSE[@]}" ps -a || true
