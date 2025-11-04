#!/usr/bin/env bash
# Windash Docker stack cleanup helper
# Safely stop and remove dev/prod compose stacks, with optional deep cleaning.
#
# MIT License
#
# Usage:
#   scripts/cleanup.sh [options]
#
# Options:
#   --dev              Target ONLY dev stack (docker-compose.dev.yml)
#   --prod             Target ONLY prod stack (docker-compose.yml)
#   --all              Target both dev and prod (default if neither --dev nor --prod)
#   --with-volumes     Remove named volumes for targeted stacks (DESTRUCTIVE)
#   --images           Remove built windash images (windash:latest) + dangling layers
#   --networks         Remove custom networks for targeted stacks
#   --force / --yes    Skip interactive confirmation
#   --dry-run          Show what would run without executing destructive commands
#   --prune            Run docker image prune -f (after stack removal)
#   --no-color         Disable ANSI colors
#   -h | --help        Show help
#
# Examples:
#   scripts/cleanup.sh --dev                 # stop dev containers only
#   scripts/cleanup.sh --prod --images       # remove prod stack and its image
#   scripts/cleanup.sh --all --with-volumes  # nuke data (asks confirmation)
#   scripts/cleanup.sh --all --dry-run       # preview actions
#   scripts/cleanup.sh --dev --force --with-volumes --images --prune
#
# Safety:
#   Volumes are preserved unless --with-volumes is provided.
#   Will prompt before destructive actions unless --force/--yes set.
#
# Exit codes:
#   0 success / partial (non-fatal missing resources) | 1 usage error | 2 aborted

set -euo pipefail

############ Formatting ############
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
run() {
  local cmd="$*"
  if [[ ${DRY_RUN} == true ]]; then
    echo -e "${DIM}DRY:${RESET} ${cmd}";
  else
    eval "${cmd}";
  fi
}

############ Defaults / Flags ############
TARGET_DEV=false
TARGET_PROD=false
WITH_VOLUMES=false
REMOVE_IMAGES=false
REMOVE_NETWORKS=false
FORCE=false
DRY_RUN=false
PRUNE=false

############ Help ############
usage() {
  sed -n '1,70p' "$0" | grep -E '^#' | sed 's/^# \{0,1\}//'
  exit 1
}

for arg in "$@"; do
  case "$arg" in
    --dev) TARGET_DEV=true ;;
    --prod) TARGET_PROD=true ;;
    --all) TARGET_DEV=true; TARGET_PROD=true ;;
    --with-volumes) WITH_VOLUMES=true ;;
    --images) REMOVE_IMAGES=true ;;
    --networks) REMOVE_NETWORKS=true ;;
    --force|--yes) FORCE=true ;;
    --dry-run) DRY_RUN=true ;;
    --prune) PRUNE=true ;;
    --no-color) COLOR=false ;;
    -h|--help) usage ;;
    *) err "Unknown arg: $arg"; usage ;;
  esac
  shift || true
done

if [[ $TARGET_DEV == false && $TARGET_PROD == false ]]; then
  TARGET_DEV=true; TARGET_PROD=true
fi

############ Confirmation ############
confirm() {
  local prompt="$1"; shift || true
  if [[ ${FORCE} == true ]]; then return 0; fi
  echo -ne "${YELLOW}${prompt} [y/N]${RESET} "
  read -r ans || true
  [[ $ans == y || $ans == Y ]]
}

############ Checks ############
command_exists() { command -v "$1" >/dev/null 2>&1; }

COMPOSE_CMD="docker compose"
if ! command_exists docker; then
  err "Docker not found in PATH"; exit 1
fi
if ! docker compose version >/dev/null 2>&1; then
  if command_exists docker-compose; then
    COMPOSE_CMD="docker-compose"
  else
    err "Docker compose plugin not available"; exit 1
  fi
fi

############ Resource Lists ############
DEV_FILE="docker-compose.dev.yml"
PROD_FILE="docker-compose.yml"
DEV_VOLUMES=(postgres-data-dev node_modules pnpm-store)
PROD_VOLUMES=(postgres-data)
DEV_NETWORK="windash-dev-network"
PROD_NETWORK="windash-network"
IMAGE_NAME="windash:latest"

removed_any=false

############ Stack Removal ############
remove_stack() {
  local file="$1"; local label="$2";
  if [[ ! -f $file ]]; then warn "$label compose file missing: $file"; return; fi
  info "Stopping $label stack ($file)"; run "$COMPOSE_CMD -f $file down" || warn "Down command reported issues for $label"
}

############ Volume Removal ############
remove_volumes() {
  local volumes=("$@")
  for v in "${volumes[@]}"; do
    if docker volume inspect "$v" >/dev/null 2>&1; then
      info "Removing volume: $v"; run "docker volume rm $v" && removed_any=true || warn "Failed to remove volume $v"
    else
      warn "Volume not found: $v"
    fi
  done
}

############ Network Removal ############
remove_network() {
  local net="$1"
  if docker network inspect "$net" >/dev/null 2>&1; then
    info "Removing network: $net"; run "docker network rm $net" && removed_any=true || warn "Failed to remove network $net"
  else
    warn "Network not found: $net"
  fi
}

############ Image Removal ############
remove_images() {
  if docker images | grep -q "windash"; then
    if docker images | grep -q "${IMAGE_NAME}"; then
      info "Removing image: ${IMAGE_NAME}"; run "docker rmi ${IMAGE_NAME}" || warn "Could not remove image ${IMAGE_NAME}"
    fi
    info "Removing dangling windash layers (if any)"; run "docker image prune -f" || warn "Prune failed"
  else
    warn "No windash images found"
  fi
}

############ EXECUTION ############
info "Compose command: ${COMPOSE_CMD}"

if [[ $TARGET_DEV == true ]]; then remove_stack "$DEV_FILE" "dev"; fi
if [[ $TARGET_PROD == true ]]; then remove_stack "$PROD_FILE" "prod"; fi

if [[ $WITH_VOLUMES == true ]]; then
  if confirm "Remove named volumes? This deletes Postgres data and caches."; then
    [[ $TARGET_DEV == true ]] && remove_volumes "${DEV_VOLUMES[@]}"
    [[ $TARGET_PROD == true ]] && remove_volumes "${PROD_VOLUMES[@]}"
  else
    warn "Skipped volume removal"
  fi
fi

if [[ $REMOVE_NETWORKS == true ]]; then
  [[ $TARGET_DEV == true ]] && remove_network "$DEV_NETWORK"
  [[ $TARGET_PROD == true ]] && remove_network "$PROD_NETWORK"
fi

if [[ $REMOVE_IMAGES == true ]]; then
  if confirm "Remove images (windash:latest + prune)?"; then
    remove_images
  else
    warn "Skipped image removal"
  fi
fi

if [[ $PRUNE == true ]]; then
  if confirm "Run global image prune?"; then
    info "Running global image prune"; run "docker image prune -f"
  else
    warn "Skipped global prune"
  fi
fi

success "Cleanup complete (dry-run=${DRY_RUN})"
exit 0
