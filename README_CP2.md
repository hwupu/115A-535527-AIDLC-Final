# Group1 CP2 - reproducible local candidate

Owner: 劉順松 / 414551016. Date: 2026-11-04. Status: technical candidate awaiting team and external-user evidence. E3 not submitted.

## GitHub review copy

The editable report is [docs/cp2/Group1_CP2_Report.md](docs/cp2/Group1_CP2_Report.md). Committed machine evidence is in [docs/cp2/evidence/](docs/cp2/evidence/); generated runtime evidence stays in ignored `evidence/`. Generate the Windows synthetic microphone fixture with `./scripts/make-synthetic-audio.ps1` before running the browser suite. It uses Windows Hanhan text-to-speech, not a person's recording.

The GitHub branch/PR makes the candidate reviewable. It does not mean the team has approved it or that E3 submission and the outstanding collaboration/user-testing requirements are complete. PDF and review ZIP are local generated artifacts; source, Markdown and text evidence are versioned. Do not enable GitHub Pages for this FastAPI/model prototype: Pages cannot execute its Python backend or models.

## Requirements and launch

Node 24+, pnpm, Python 3.12 and uv. On this machine uv is in `.tools/bin/uv.exe`; on a new machine install uv from https://docs.astral.sh/uv/getting-started/installation/. From the repository root:

```powershell
./scripts/start-cp2.ps1 -Setup
```

Browse http://localhost:5173. Keep the terminal open. Ctrl+C stops child Python services. Model weights download on the first actual inference and are not part of the submission. Internet is needed for initial dependencies/models; after caching the models, local inference does not require a hosted API or key.

Manual alternative: `pnpm install --frozen-lockfile`; `uv sync --locked` inside each service; `uv run alembic upgrade head` inside services/api. In separate terminals run `uv run uvicorn app.main:app --host 127.0.0.1 --port 8000` in api, port 8001 in stt and port 8002 in llm. Set `EVAL_MODE=1` in the API terminal if evaluation tools are needed. In the root frontend terminal set `$env:VITE_API_MOCK='0'` then `pnpm --filter web dev --host 127.0.0.1`. Override stale `.env` mock settings with the process environment. No need for Docker.

No authentication: roles are demo interfaces, not access control. Bind localhost only. Never use real patient data. The patient UI does not receive drafts through its WebSocket; anyone with local API access can impersonate roles, a documented prototype limitation.

## Actual CP2 components

- Existing Vue nurse/doctor/patient/admin UI integrated locally from origin/feat/62-patient-and-admin (stack #69-72); upstream authorship preserved in Git. No remote PR was merged by this work.
- FastAPI with SQLAlchemy SQLite JSON encounter records and Alembic initial migration; persistence across reload/restart; never store audio.
- API session lifecycle, visit numbers, source-linked drafts, per-field review, nurse-only decision path in UI, confirmed read-only report, ETag polling, audit and delete.
- Local Transformers CPU Qwen/Qwen2.5-0.5B-Instruct validation adapter with prompts v1/v2/v3; v3 has a restricted six-field scope. This is a proposed local substitute for the unimplemented planned Gemma runtime, not evidence for Gemma-4.
- Whisper CPU int8 and OpenCC s2twp. Whole recordings processed on stop, not live streaming. Text entry is a real fallback, never secretly substituted for inference.
- Evaluation-mode runs/events/JSON/CSV; 12 synthetic development prompt cases and comparison functions.

## Verification

Run `./scripts/check-cp2.ps1`. Browser test instructions and results are in docs/cp2/START_HERE_劉順松.md and evidence/. Real prompt suite: `services/llm/.venv/Scripts/python.exe -X utf8 eval/run_prompt_suite.py --version v3`. Do not run model downloads in CI unit tests: those tests mock inference transport explicitly; actual-model runs are separate evidence.

API schema is at http://localhost:8000/docs. GET /health proves server liveness only, not loaded model readiness. GET /sessions/{id}/audit gives before/after field history. DELETE /sessions/{id} deletes active encounter/audit/evaluation records; it does not promise forensic erasure of SQLite pages, backups or exported files.

## Scope and known limits

The small model can misclassify statements, fail on correction, and produce invalid JSON. Quote containment does not prove entailment. Source checks, allowlists and manual review reduce risk but do not establish clinical safety. No validated clinical flags/risk scoring. Unsupported fields remain manual. No HIS integration, no medical advice, no triage prediction.

Read docs/cp2/REQUIREMENTS.md before submission. External testing, real PR contributions, approvals and collaboration-session artifacts remain mandatory human work. `submission/Group1_CP2_REVIEW.zip` is a review candidate, not a claim of full checkpoint completion.
