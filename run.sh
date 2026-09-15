#!/usr/bin/env bash
# Runs backend (Spring Boot, :8080) and frontend (Next.js, :3000) together.
# Requires MySQL reachable at localhost:3306 with a `mealdeck` database and
# `mealdeck`/`mealdeck` user already created (see backend/CLAUDE.md).
set -euo pipefail

cd "$(dirname "$0")"

JAVA_HOME="${JAVA_HOME:-/opt/homebrew/opt/openjdk}"
export JAVA_HOME

cleanup() {
  echo "Stopping..."
  jobs -p | xargs -r kill 2>/dev/null
}
trap cleanup EXIT INT TERM

echo "Starting backend on :8080..."
(cd backend && ./mvnw spring-boot:run) &

echo "Starting frontend on :3000..."
(cd frontend && npm run dev) &

wait
