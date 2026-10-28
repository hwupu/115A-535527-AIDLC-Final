# uv projects instead of requirements.txt (#57)
- Date: 2026-10-28
- Author: 張棨翔
- Tool / model: Claude Code / Opus 5.5
- PR: (to fill)

## Prompt
Open a ticket to use uv instead of requirements.txt, update DECISIONS.md, and
convert the Python services after 吳普軒 agreed.

## Output summary
Created issue #57 and set its board fields. Each service (`api`, `stt`, `llm`)
now has `pyproject.toml` (dev tools in `[dependency-groups]`, `package = false`)
and `uv.lock`; `requirements*.txt` removed. Dockerfiles use
`uv sync --frozen --no-dev` and run from `/srv/.venv`. CI uses `uv sync --locked`
then `uv run ruff` / `uv run pytest`. `scripts/dev.sh` uses `uv run`. README and
DECISIONS.md updated. No uv workspace, so stt and llm can pin different versions.

Checked: ruff and pytest pass in all three services; locks valid with uv 0.8.15
and 0.9.30; `docker compose` dev and demo profiles build and serve web → api,
stt and llm stubs; `uv run uvicorn` starts each service from a clean state.

## Outcome
- Kept: (to fill)
- Changed: (to fill)
- Rejected (and why): (to fill)
