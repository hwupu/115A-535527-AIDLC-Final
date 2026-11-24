# Group1 CP2 - reproducible local candidate

Owner: 劉順松 / 414551016. Created 2026-11-04; merged to `main` in #73 on 2026-11-19. Updated 2026-11-24. U01/U02 questionnaires are reported; facilitator metadata remains pending. E3 not submitted.

CP2 dates (published rubric): peer-review demo in the Week 12 lab on **Mon 2026-11-23**; E3 deadline **Sun 2026-11-29**.

## GitHub review copy

The editable report is [docs/cp2/Group1_CP2_Report.md](docs/cp2/Group1_CP2_Report.md). Committed machine evidence is in [docs/cp2/evidence/](docs/cp2/evidence/); generated runtime evidence stays in ignored `evidence/`. Generate the Windows synthetic microphone fixture with `./scripts/make-synthetic-audio.ps1` before running the browser suite. It uses Windows Hanhan text-to-speech, not a person's recording.

Merging #73 does not mean E3 submission and the outstanding collaboration/user-testing requirements are complete. PDF and the E3 zip are local generated artifacts; source, Markdown and text evidence are versioned. Do not enable GitHub Pages for this FastAPI/model prototype: Pages cannot execute its Python backend or models.

## Requirements and launch

Node 24+, pnpm, Python 3.12 and uv (https://docs.astral.sh/uv/getting-started/installation/). The extraction model
runs in Ollama: for the scripts below install Ollama (https://ollama.com/download) and run `ollama pull gemma3:1b`
once (or the model named by `LLM_MODEL`). `docker compose up` starts its own Ollama and downloads the model; on an
NVIDIA machine add `docker-compose.gpu.yml` (see `.env.example`). From the repository root:

```bash
# macOS / Linux
./scripts/start-cp2.sh --setup
```

```powershell
# Windows
./scripts/start-cp2.ps1 -Setup
```

Drop `--setup` / `-Setup` on later runs.

Browse http://localhost:5173. Keep the terminal open. Ctrl+C stops all child services. Model weights download on the first actual inference and are not part of the submission. Internet is needed for initial dependencies/models; after caching the models, local inference does not require a hosted API or key.

Manual alternative: `pnpm install --frozen-lockfile`; `uv sync --locked` inside each service; `uv run alembic upgrade head` inside services/api. In separate terminals run `uv run uvicorn app.main:app --host 127.0.0.1 --port 8000` in api, port 8001 in stt and port 8002 in llm. Set `EVAL_MODE=1` in the API terminal if evaluation tools are needed. In the root frontend terminal set `VITE_API_MOCK=0` (PowerShell: `$env:VITE_API_MOCK='0'`) then `pnpm --filter web dev --host 127.0.0.1`. Override stale `.env` mock settings with the process environment. No need for Docker.

No authentication: roles are demo interfaces, not access control. Bind localhost only. Never use real patient data. The patient UI does not receive drafts through its WebSocket; anyone with local API access can impersonate roles, a documented prototype limitation.

## Actual CP2 components

- Existing Vue nurse/doctor/patient/admin UI integrated locally from origin/feat/62-patient-and-admin (stack #69-72); upstream authorship preserved in Git.
- FastAPI with SQLAlchemy SQLite JSON encounter records and Alembic initial migration; persistence across reload/restart; never store audio.
- API session lifecycle, visit numbers, source-linked drafts, per-field review, nurse-only decision path in UI, confirmed read-only report, ETag polling, audit and delete.
- Local extraction through Ollama (`LLM_MODEL`: `gemma3:1b` by default, `gemma4:e4b` for official runs) with prompts v1–v5; v5 is the default and drafts every report field the transcript states (v3/v4 fill six fields). Until 2026-11-21 this was a Transformers CPU Qwen2.5-0.5B adapter; its results stay in `docs/cp2/evidence/` and are not Gemma results.
- Whisper CPU int8 and OpenCC s2twp. Whole recordings processed on stop, not live streaming. Text entry is a real fallback, never secretly substituted for inference.
- Evaluation-mode runs/events/JSON/CSV; 14 synthetic development prompt cases and comparison functions.

## Verification

Run `./scripts/check-cp2.sh` (macOS/Linux) or `./scripts/check-cp2.ps1` (Windows). Browser test instructions and results are in docs/cp2/START_HERE_劉順松.md and evidence/. Real prompt suite: `uv run --directory services/llm python -X utf8 ../../eval/run_prompt_suite.py --version v5`. Do not run model downloads in CI unit tests: those tests mock inference transport explicitly; actual-model runs are separate evidence.

API schema is at http://localhost:8000/docs. GET /health proves server liveness only, not loaded model readiness. GET /sessions/{id}/audit gives before/after field history. DELETE /sessions/{id} deletes active encounter/audit/evaluation records; it does not promise forensic erasure of SQLite pages, backups or exported files.

## Scope and known limits

The small model can misclassify statements, fail on correction, and produce invalid JSON. Quote containment does not prove entailment. Source checks, allowlists and manual review reduce risk but do not establish clinical safety. No validated clinical flags/risk scoring. Unsupported fields remain manual. No HIS integration, no medical advice, no triage prediction.

Read docs/cp2/REQUIREMENTS.md before submission. External testing, real PR contributions, approvals and collaboration-session artifacts remain mandatory human work. Build the E3 zip with `python3 scripts/package-cp2.py` → `submission/Group01_CP2.zip` (committed files plus `repository_link.txt`). Building it is not a claim of full checkpoint completion.


## 2026-11-24 evidence boundary

README.md has the single quick start. Script-launched Python services use process environment variables, not root .env (Compose and Vite do read .env according to their configuration). Start Ollama and pull LLM_MODEL before extraction. #95 guards now match numeric labels, validate calendar dates and filter home measurements of all vitals. Historical 2026-11-22 model outputs predate those corrections; they are not a new model run. Human sessions, policy ratification and a non-author fresh-machine check remain pending.


## Report generation prerequisites

scripts/render-cp2-markdown.py requires reportlab and pypdf plus the Windows Microsoft JhengHei fonts used in this verified export. It does not change the Markdown. On another OS, provide compatible CJK fonts before regenerating; the application itself does not depend on this document-rendering environment. Generated PDF and ZIP files are kept out of Git. Use the supplied report PDF for this review candidate and rerender after any report edit.
