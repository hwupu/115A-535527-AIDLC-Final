#!/usr/bin/env bash
# macOS/Linux counterpart of check.ps1. Logs go to evidence/; summary in evidence/checks.json.
set -uo pipefail
cd "$(dirname "$0")/.."
mkdir -p evidence
results=()
check() { # <name> <command...>
  local name=$1; shift
  "$@" >"evidence/$name.log" 2>&1
  local code=$?
  echo "$name exit=$code"
  results+=("{\"name\":\"$name\",\"exit\":$code}")
}
for cmd in lint typecheck test build; do check "web-$cmd" pnpm "$cmd"; done
for service in api stt llm; do
  check "$service-lint" uv run --directory "services/$service" ruff check .
  check "$service-tests" uv run --directory "services/$service" pytest -q
done
check metrics uv run --directory services/api python -m pytest ../../eval -q
(IFS=,; echo "[${results[*]}]") >evidence/checks.json
grep -q '"exit":[1-9]' evidence/checks.json && { echo "One or more checks failed. See evidence/checks.json." >&2; exit 1; }
echo "All checks passed."
