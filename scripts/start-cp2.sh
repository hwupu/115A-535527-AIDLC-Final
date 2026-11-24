#!/usr/bin/env bash
# macOS/Linux counterpart of start-cp2.ps1: real api + stt + llm + web, synthetic data only.
# Usage: ./scripts/start-cp2.sh [--setup]
set -euo pipefail
cd "$(dirname "$0")/.."

command -v uv >/dev/null 2>&1 || { echo "Install uv: https://docs.astral.sh/uv/getting-started/installation/" >&2; exit 1; }
command -v pnpm >/dev/null 2>&1 || { echo "Install pnpm (Node 24+) first." >&2; exit 1; }

if [[ "${1:-}" == "--setup" ]]; then
  pnpm install --frozen-lockfile
  for service in api stt llm; do uv sync --locked --directory "services/$service"; done
fi

# Binding detects occupied localhost ports even if their owner is another user.
uv run --directory services/llm python - <<'PY'
import socket
for port in (5173, 8000, 8001, 8002):
    with socket.socket() as sock:
        sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        try:
            sock.bind(("127.0.0.1", port))
        except OSError:
            raise SystemExit(f"Port {port} is already in use; stop the previous server first.")
PY

uv run --directory services/api alembic upgrade head
mkdir -p evidence

export EVAL_MODE=1 VITE_API_MOCK=0 API_URL=http://127.0.0.1:8000 PYTHONUTF8=1

pids=()
kill_tree() { local child; for child in $(pgrep -P "$1"); do kill_tree "$child"; done; kill "$1" 2>/dev/null || true; }
cleanup() { trap - EXIT INT TERM; for pid in "${pids[@]}"; do kill_tree "$pid"; done; }
trap cleanup EXIT INT TERM

for pair in api:8000 stt:8001 llm:8002; do
  service=${pair%%:*}; port=${pair##*:}
  (cd "services/$service" && exec uv run uvicorn app.main:app --host 127.0.0.1 --port "$port") \
    >"evidence/$service.stdout.log" 2>"evidence/$service.stderr.log" &
  pids+=($!)
done

echo "Group1 CP2: http://localhost:5173 (real API; synthetic data only). Ctrl+C stops everything."
pnpm --filter web dev --host 127.0.0.1 &
pids+=($!)
wait
