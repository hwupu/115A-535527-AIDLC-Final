#!/usr/bin/env bash
# Run everything without Docker: api :8000, stt :8001, llm :8002, web :5173.
# Python runner: `uv` if installed (optional), otherwise a plain venv + pip per service.
set -euo pipefail
cd "$(dirname "$0")/.."

run_py() { # <service> <port>
  local svc=$1 port=$2
  (
    cd "services/$svc"
    if command -v uv >/dev/null 2>&1; then
      exec uv run --python 3.12 --with-requirements requirements.txt \
        uvicorn app.main:app --reload --port "$port"
    else
      [ -d .venv ] || python3 -m venv .venv
      .venv/bin/pip install -q -r requirements.txt
      exec .venv/bin/uvicorn app.main:app --reload --port "$port"
    fi
  ) &
}

trap 'kill 0' EXIT INT TERM
run_py api 8000
run_py stt 8001
run_py llm 8002
pnpm dev
