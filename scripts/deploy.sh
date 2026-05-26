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

echo "Preparing remote dir..."
ssh_cmd "mkdir -p '$DEPLOY_PATH'"

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

echo "Running remote deploy script (live log streamed below, full log on server at /tmp/deploy.log)..."
# set -o pipefail на удалённой стороне обязателен: без него exit code от
# deploy-remote.sh съедается успешным `tee` и outer ssh видит 0 даже при
# падении деплоя. С pipefail падение скрипта правильно пробрасывается
# наверх и CI становится красным как должно.
ssh_cmd "set -o pipefail && chmod +x '$DEPLOY_PATH/scripts/deploy-remote.sh' && stdbuf -oL -eL bash '$DEPLOY_PATH/scripts/deploy-remote.sh' 2>&1 | tee /tmp/deploy.log"
