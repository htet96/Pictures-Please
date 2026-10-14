!/usr/bin/env bash
# Usage: ./redeploy.sh [/path/to/project]   (defaults to the current directory)
# Runs: cd -> docker compose down -> git pull -> docker compose up -d --build
# Stops at the first failure and prints the error log.
 
PROJECT_DIR="${1:-$PWD}"
LOG_FILE="$(mktemp /tmp/redeploy.XXXXXX.log)"
 
run() {
  echo ">>> $*" | tee -a "$LOG_FILE"
  "$@" >>"$LOG_FILE" 2>&1
  local code=$?
  if [ "$code" -ne 0 ]; then
    echo
    echo "ERROR: '$*' failed with exit code $code" >&2
    echo "----- error log ($LOG_FILE) -----" >&2
    cat "$LOG_FILE" >&2
    exit "$code"
  fi
}
 
run cd "$PROJECT_DIR"   # note: cd in a function still affects the script (no subshell)
run docker compose down
run git pull
run docker compose up -d --build
 
echo "All commands completed successfully."
echo "Full log: $LOG_FILE"