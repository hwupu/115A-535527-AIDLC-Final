# api healthcheck so web waits for api
- Date: 2026-10-28
- Author: 張棨翔 (entry added by 吳普軒 during review)
- Tool / model: Claude Code / Opus 5.5
- PR: #68

## Prompt
Follow-up from the #55 review: in demo, nginx returns 502 for about 3 s at
startup because `depends_on` doesn't wait for the api to be ready. Add an api
healthcheck in docker-compose. (Reconstructed from the PR description; the
original prompt was not saved.)

## Output summary
Added a healthcheck to `api` in `docker-compose.yml` using `python -c` with
`urllib` (`python:3.12-slim` has no curl), interval 2s, timeout 2s, 15 retries.
`web` and `web-demo` now use `depends_on: { api: { condition: service_healthy } }`.

Checked: dev and demo profiles, `/api/health` polled 40 times every 0.2 s right
after `up`: 0 × 502 (before: 502 at the same point). In review, 吳普軒 re-ran
this with #67 merged: demo went from 4 × 502 to 0; api reports `healthy` using
`/srv/.venv/bin/python`.

## Outcome
- Kept: the healthcheck and both `depends_on` changes as generated.
- Changed: nothing.
- Rejected (and why): installing curl for the healthcheck (bigger image, the
  stdlib is enough). Not done yet: healthchecks for stt and llm, which need a
  longer `start_period` once real models load.
