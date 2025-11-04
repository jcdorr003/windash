#!/usr/bin/env bash
# Windash dev environment setup script
# Spins up docker-compose.dev.yml stack, applies migrations, optional seed, waits for services.
#
# Usage:
#   scripts/setup-dev.sh [options]
#
# Options:
#   --rebuild        Force rebuild of dev image
#   --pull           Pull base images before starting
#   --wipe-db        Remove dev Postgres volume (postgres-data-dev) BEFORE start (destructive)
#   --no-seed        Skip seeding step
#   --wait           Wait for Postgres health + app port readiness
#   --timeout N      Max seconds to wait when --wait (default 60)
#   --dry-run        Show actions without executing
#   --force|--yes    Skip confirmation for destructive wipe
#   --no-color       Disable ANSI colors
#   -h|--help        Show help
#
# Examples:
#   scripts/setup-dev.sh --wait
#   scripts/setup-dev.sh --wipe-db --rebuild --wait --timeout 90
#   scripts/setup-dev.sh --dry-run
#
# Requires: docker, docker compose plugin, pnpm inside dev container.

set -euo pipefail
COLOR=${COLOR:-true}
if [[ "${1:-}" == "--no-color" ]]; then COLOR=false; shift; fi
if [[ ${COLOR} == true && -t 1 ]]; then
  RED='\033[31m'; YELLOW='\033[33m'; GREEN='\033[32m'; BLUE='\033[34m'; DIM='\033[2m'; BOLD='\033[1m'; RESET='\033[0m'
else
  RED=''; YELLOW=''; GREEN=''; BLUE=''; DIM=''; BOLD=''; RESET=''
fi
info() { echo -e "${BLUE}>>${RESET} $*"; }
success() { echo -e "${GREEN}✔${RESET} $*"; }
warn() { echo -e "${YELLOW}!${RESET} $*"; }
err() { echo -e "${RED}✖${RESET} $*" >&2; }
run() { local cmd="$*"; if [[ ${DRY_RUN} == true ]]; then echo -e "${DIM}DRY:${RESET} ${cmd}"; else eval "${cmd}"; fi }

REBUILD=false
PULL=false
WIPE_DB=false
NO_SEED=false
WAIT=false
TIMEOUT=60
DRY_RUN=false
FORCE=false

usage(){ sed -n '1,80p' "$0" | grep -E '^#' | sed 's/^# \{0,1\}//'; exit 1; }

for arg in "$@"; do
  case "$arg" in
    --rebuild) REBUILD=true ;;
    --pull) PULL=true ;;
    --wipe-db) WIPE_DB=true ;;
    --no-seed) NO_SEED=true ;;
    --wait) WAIT=true ;;
    --timeout) shift; TIMEOUT="${1:-60}" ;;
    --dry-run) DRY_RUN=true ;;
    --force|--yes) FORCE=true ;;
    --no-color) COLOR=false ;;
    -h|--help) usage ;;
    *) err "Unknown arg: $arg"; usage ;;
  esac
  shift || true
done

if ! command -v docker >/dev/null 2>&1; then err "docker not found"; exit 1; fi
if ! docker compose version >/dev/null 2>&1; then err "docker compose plugin required"; exit 1; fi

COMPOSE_FILE="docker-compose.dev.yml"
DEV_SERVICE="windash-dev"
DB_SERVICE="postgres"
DB_VOLUME="postgres-data-dev"

if [[ ! -f $COMPOSE_FILE ]]; then err "Missing $COMPOSE_FILE"; exit 1; fi

confirm(){ if [[ $FORCE == true ]]; then return 0; fi; echo -ne "${YELLOW}$1 [y/N]${RESET} "; read -r ans || true; [[ $ans == y || $ans == Y ]]; }

if [[ $WIPE_DB == true ]]; then
  if confirm "Remove dev DB volume $DB_VOLUME? This deletes all data."; then
    if docker volume inspect "$DB_VOLUME" >/dev/null 2>&1; then
      info "Removing volume $DB_VOLUME"; run "docker volume rm $DB_VOLUME" || warn "Failed to remove $DB_VOLUME"
    else
      warn "Volume $DB_VOLUME not found (already clean)"
    fi
  else
    warn "Skipped DB wipe"
  fi
fi

if [[ $PULL == true ]]; then
  info "Pulling images"; run "docker compose -f $COMPOSE_FILE pull"
fi

if [[ $REBUILD == true ]]; then
  info "Rebuilding dev image"; run "docker compose -f $COMPOSE_FILE build --no-cache windash-dev"
fi

info "Starting Postgres first"
run "docker compose -f $COMPOSE_FILE up -d $DB_SERVICE"

if [[ $WAIT == true ]]; then
  info "Waiting for Postgres health (timeout=${TIMEOUT}s)"
  start_ts=$(date +%s)
  while true; do
    if docker inspect --format='{{json .State.Health.Status}}' $(docker compose -f $COMPOSE_FILE ps -q $DB_SERVICE) 2>/dev/null | grep -q 'healthy'; then
      success "Postgres healthy"; break
    fi
    now=$(date +%s); (( now - start_ts > TIMEOUT )) && { err "Timed out waiting for Postgres"; exit 2; }
    sleep 2
  done
fi

info "Starting dev app container"
run "docker compose -f $COMPOSE_FILE up -d $DEV_SERVICE"

# Apply migrations using existing script (db:push)
info "Applying schema migrations (pnpm db:push)"
run "docker compose -f $COMPOSE_FILE exec -T $DEV_SERVICE pnpm db:push" || warn "Migrations failed or not applicable"

# Optional seed stub: adjust when a real seeding script exists
if [[ $NO_SEED == false ]]; then
  if docker compose -f $COMPOSE_FILE exec -T $DEV_SERVICE pnpm run | grep -q 'db:seed'; then
    info "Running seed script"; run "docker compose -f $COMPOSE_FILE exec -T $DEV_SERVICE pnpm db:seed" || warn "Seed script failed"
  else
    warn "No seed script defined (skipping). Add 'db:seed' to package.json to enable."
  fi
else
  info "Skipping seed step (--no-seed)"
fi

if [[ $WAIT == true ]]; then
  # Basic app port readiness (5173) check
  info "Checking app port readiness on 5173"
  start_ts=$(date +%s)
  while true; do
    if curl -fsS http://localhost:5173 >/dev/null 2>&1; then
      success "Dev server responding on :5173"; break
    fi
    now=$(date +%s); (( now - start_ts > TIMEOUT )) && { warn "Timed out waiting for :5173 (may still be booting)"; break; }
    sleep 2
  done
fi

success "Dev environment ready"
exit 0
