#!/bin/sh
set -e

echo "Waiting for PostgreSQL..."
until pg_isready -h postgres -p 5432 -U postgres > /dev/null 2>&1; do
  sleep 1
done

echo "Starting application..."
exec node -r ./dist/src/telemetry.js dist/src/main.js
