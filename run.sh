#!/usr/bin/env bash
# Runs backend (Spring Boot, :8080) and frontend (Next.js, :3000) together.
#
#   ./run.sh          MySQL on localhost:3306 with a `mealdeck` database, plus
#                     backend/.env holding DB_USERNAME/DB_PASSWORD.
#   ./run.sh --demo   In-memory H2 instead, so no MySQL and no .env needed.
#
# Either side going down takes the other with it and exits non-zero.
set -euo pipefail

# Job control, so each background job lands in its own process group and the
# teardown below can signal the whole tree. Without it, killing the subshell
# leaves mvnw's java (and next's node) orphaned and still holding the ports.
set -m

cd "$(dirname "$0")"

# Find a JDK that actually runs, rather than trusting a path or PATH entry:
# on macOS /usr/bin/java is Apple's stub that exits non-zero when no real JDK
# is installed, so `command -v java` succeeding proves nothing. Honour a usable
# JAVA_HOME if one is already set, else probe the usual Homebrew (macOS) and
# /usr/lib/jvm (Linux) locations, else fall back to a working java on PATH.
java_works() {
  [ -n "$1" ] && [ -x "$1" ] && "$1" -version >/dev/null 2>&1
}

if ! java_works "${JAVA_HOME:-}/bin/java"; then
  JAVA_HOME=""
  for candidate in \
    /opt/homebrew/opt/openjdk \
    /usr/local/opt/openjdk \
    /usr/lib/jvm/default-java \
    /usr/lib/jvm/default \
    /usr/lib/jvm/java-21-openjdk-amd64 \
    /usr/lib/jvm/java-21-openjdk \
    /usr/lib/jvm/*; do
    if java_works "$candidate/bin/java"; then
      JAVA_HOME="$candidate"
      break
    fi
  done
fi

if [ -n "${JAVA_HOME:-}" ]; then
  export JAVA_HOME
elif java_works "$(command -v java 2>/dev/null)"; then
  echo "JAVA_HOME unset; using the java already on PATH." >&2
else
  echo "No usable JDK found. Install JDK 21+ or set JAVA_HOME to one." >&2
  exit 1
fi

DEMO=0
for arg in "$@"; do
  case "$arg" in
    --demo) DEMO=1 ;;
    -h|--help) echo "Usage: $0 [--demo]"; exit 0 ;;
    *) echo "Unknown option: $arg" >&2; echo "Usage: $0 [--demo]" >&2; exit 2 ;;
  esac
done

MVN_PROFILE=""
if [ "$DEMO" -eq 1 ]; then
  MVN_PROFILE="-Dspring-boot.run.profiles=demo"
elif [ ! -f backend/.env ]; then
  cat >&2 <<'MSG'
backend/.env is missing, so DB_PASSWORD is unset. Spring passes the literal
"${DB_PASSWORD}" through to MySQL and the backend dies on startup with:

    Access denied for user 'mealdeck'@'localhost' (using password: YES)

Fix it either way:

    cp backend/.env.example backend/.env   # then put the real password in it
    ./run.sh --demo                        # in-memory H2, no MySQL needed
MSG
  exit 1
fi

BACKEND_PID=""
FRONTEND_PID=""

# Signal the process group (-PID) so the java/node grandchildren go too, then
# fall back to the bare PID if the group is already gone.
stop_tree() {
  pid="$1"
  if [ -n "$pid" ]; then
    kill -TERM "-$pid" 2>/dev/null || kill -TERM "$pid" 2>/dev/null || true
  fi
}

SHUTTING_DOWN=0

cleanup() {
  trap - EXIT INT TERM
  SHUTTING_DOWN=1
  echo "Stopping..."
  stop_tree "$BACKEND_PID"
  stop_tree "$FRONTEND_PID"
  wait 2>/dev/null || true
}
trap cleanup EXIT INT TERM

if [ "$DEMO" -eq 1 ]; then
  echo "Starting backend on :8080 (demo profile, in-memory H2)..."
else
  echo "Starting backend on :8080..."
fi
(cd backend && ./mvnw spring-boot:run $MVN_PROFILE) &
BACKEND_PID=$!

echo "Starting frontend on :3000..."
(cd frontend && npm run dev) &
FRONTEND_PID=$!

# macOS ships bash 3.2, which has no `wait -n`, and a bare `wait` always
# returns 0 no matter how the children exited -- so a dead backend used to go
# unnoticed and leave the frontend serving "Couldn't reach the server". Poll
# instead and tear down as soon as either side stops.
while kill -0 "$BACKEND_PID" 2>/dev/null && kill -0 "$FRONTEND_PID" 2>/dev/null; do
  sleep 1
done

# Ctrl-C already ran cleanup, so don't blame whichever child it happened to
# reap first -- that quit was deliberate.
if [ "$SHUTTING_DOWN" -eq 1 ]; then
  exit 0
fi

if kill -0 "$BACKEND_PID" 2>/dev/null; then
  echo "Frontend exited; shutting down." >&2
else
  echo "Backend exited; shutting down." >&2
fi

exit 1
