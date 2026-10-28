#!/usr/bin/env bash
# Run everything without Docker: api :8000, stt :8001, llm :8002, web :5173.
# Requires uv (https://docs.astral.sh/uv/) for the Python services and pnpm for web.
set -euo pipefail
cd "$(dirname "$0")/.."

command -v uv >/dev/null 2>&1 || {
  echo "uv not found. Install: https://docs.astral.sh/uv/getting-started/installation/" >&2
  exit 1
}

run_py() { # <service> <port>
  (
    cd "services/$1"
    exec uv run --python 3.12 --with-requirements requirements.txt \
      uvicorn app.main:app --reload --port "$2"
  ) &
}

trap 'kill 0' EXIT INT TERM
run_py api 8000
run_py stt 8001
run_py llm 8002
pnpm dev
