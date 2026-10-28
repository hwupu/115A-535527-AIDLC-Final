# Architecture Plan (Draft Proposal)

Status: **proposal for 張棨翔 (backend/LLM lead) and the team to confirm** (FastAPI is decided). Nothing here is
decided until it appears in `DECISIONS.md`. Items marked TBD depend on spikes A1/B2.
Item IDs (A1, B2, ...) refer to issues on the GitHub Project board.
This file is the starting point for F5 (`docs/architecture.md` in S2).

## 1. Goals and constraints

- Web app only (desktop or tablet browser at the triage station). No native app.
- Nurse stays hands-free: speech in, editable draft out.
- Human–AI boundary: the AI never produces a triage level or advice, and never writes to a real HIS. Empty (`未提及`) beats invented.
- Local inference; simulated data only; audio not stored by default.
- `docker compose up` starts everything. An offline fallback (recorded audio fixtures) exists for demos.
- Traceability: every AI field carries a `source_span` the nurse can check.

## 2. Components

```
┌──────────── Browser (apps/web, Vue 3) ────────────┐
│ Recorder (MediaRecorder) · Transcript panel       │
│ Draft form (per-field status) · Physician view    │
└───────────┬──────────────────────▲────────────────┘
   audio chunks (WebSocket)        │ transcript + draft events
┌───────────▼──────────────────────┴────────────────┐
│ services/api (FastAPI)                       │
│ session lifecycle · WebSocket hub · orchestration │
│ schema validation · boundary guard · audit log    │──▶ SQLite (sessions, fields, audit events)
└───────┬─────────────────────────────┬─────────────┘
        │ HTTP/gRPC (TBD)             │ HTTP
┌───────▼────────┐            ┌───────▼─────────────┐
│ services/stt   │            │ services/llm        │
│ Whisper        │            │ Gemma-4 (runtime TBD)│
└────────────────┘            └─────────────────────┘
```

| Component | Responsibility | Does not do |
|---|---|---|
| `apps/web` | capture audio, show transcript, editable draft, status per field, confirm/export, physician read-only view, evaluation mode | decide anything clinical; call stt/llm directly |
| `services/api` | owns sessions and state; routes audio to stt; builds the LLM request; validates and repairs LLM JSON; enforces the boundary guard; writes audit events | inference |
| `services/stt` | audio chunk → zh-TW text with timestamps | extraction |
| `services/llm` | transcript → schema JSON with `source_span` | state, persistence |
| SQLite | sessions, current draft, confirmed report, audit events | audio (not stored by default) |

Keeping `stt` and `llm` as thin stateless services means they can be swapped
(Ollama / vLLM / llama.cpp; faster-whisper or another) without touching the API
or frontend. Proposed API is the only component that holds state.

## 3. Data flow (MVP)

1. Nurse opens a session → `POST /sessions` returns `session_id`; browser opens `WS /sessions/{id}`.
2. Browser streams audio chunks. API forwards them to `stt`; transcript segments (text, start/end time) return and are pushed to the browser.
3. **Drafting trigger:** after each pause or at end of conversation (MVP). Incremental drafting while speaking is stretch item B6.
4. API sends the transcript (and the schema and prompt version) to `llm`; receives JSON.
5. API validates against the schema, retries or repairs on failure, runs the boundary guard, and pushes field updates (`value`, `status=AI 草稿`, `source_span`).
6. Nurse edits fields and confirms each. Each edit is an audit event (AI value vs confirmed value). Confirmed fields get `護理師已確認`.
7. `POST /sessions/{id}/confirm` saves the confirmed report. The physician view (second browser) reads the confirmed report (polling, D4).
8. Nurse copies or prints the report for manual entry into the HIS. There is no HIS integration.

## 4. Data model (draft)

Report schema follows `docs/SCENARIOS.md` §1 (patient, tocc, measurement, chief_complaint, hpi, flags). Changes proposed:

- Every leaf field is `{ value, status, source_span, source }` where `status ∈ 未提及 | AI 草稿 | 護理師已確認` and `source ∈ ai | nurse_edit`.
- `triage_level` is **not part of the LLM output schema**. It exists only as a nurse-entered field in the UI, so the model has nowhere to write it.
- Vitals are taken from nurse dictation, kept separate from patient-reported values (S01: reported 38.4 vs measured 38.5).
- Dates stored as ISO, displayed in 民國.
- Later statements override earlier ones (S08, S10); the field keeps the earlier value in the audit trail.

Tables (SQLite, names TBD): `sessions`, `transcript_segments`, `fields` (current value and status), `audit_events` (who, what, when, ai_value, confirmed_value, event type), `runs` (model, prompt version, whisper model, git commit, for evaluation).

## 5. Safety and boundary enforcement

Defence in depth, because a prompt alone is not enough:

1. **Schema:** no triage-level or advice field in the LLM output.
2. **Prompt:** never instructs the model to infer triage level (tested, not assumed).
3. **Boundary guard in API:** scans output for triage-level or advice patterns; blocks and logs a violation.
4. **Fabrication check:** a field with a value must have a `source_span` that exists in the transcript; otherwise reset to `未提及`.
5. **UI:** AI content visibly labelled until confirmed; flags styled as suggestions; the nurse must confirm before saving.
6. **Tests (B8, E4):** automated "no triage level" test on all outputs; fabrication, omission and vitals exact-match checks in the harness.

## 6. Privacy and audit

- No real patient data; synthetic scenarios and consented teammate voices only.
- Audio is held in memory for transcription and not written to disk by default; `DELETE /sessions/{id}` removes a session (D3).
- Audit events record edits and timings for metrics (D2, E6). No real names, 身分證字號 or 病歷號 anywhere.
- Every evaluation run logs model, prompt version, Whisper model and git commit.

## 7. Deployment

- `docker-compose` services: `web`, `api`, `stt`, `llm`. Profiles: `dev` and `demo`. `.env` for configuration (P3).
- GPU for `stt` and `llm` is TBD (spikes A1, B2). A CPU-only or smaller-model path must exist for development laptops.
- Microphone access needs a secure context: `localhost` works; a second device needs HTTPS via reverse proxy (P4, scope lever: demo from `localhost`).
- Node.js LTS everywhere (local, CI, Docker images). `n` is optional for local version management.
- CI (P2): lint, typecheck, test, build, docker build.

## 8. Evaluation harness

Reuses the same stt and llm services outside the UI:
load scenario audio and reference JSON → STT → LLM → compare to reference. Runs on the gold
transcript and the Whisper transcript to measure error propagation. Metric functions (E4) and the
pipeline runner (E5) are separate so metrics are unit-testable. Output is a run log keyed by the `runs` record.
Layout proposal: `eval/` with `scenarios/` (script, reference JSON, key terms, audio), `metrics/`, `runner/`.

## 9. Failure modes and fallbacks

| Failure | Behaviour |
|---|---|
| STT slow or down | UI shows connection status; nurse can type into the form manually |
| LLM returns invalid JSON | validate, retry once, repair; then leave fields `未提及` and tell the nurse |
| LLM slow | transcript still shown; draft appears when ready; latency logged |
| No GPU or network at demo | pre-recorded audio fixtures (P5) |
| WebSocket drop | session state kept server-side; client reconnects and resumes |

## 10. Decisions and spikes needed

| # | Question | Resolved by | Default if unresolved |
|---|---|---|---|
| 1 | Backend language and framework | decided 2026-10-27 | **FastAPI** |
| 2 | Gemma-4 runtime (Ollama / vLLM / llama.cpp), model size, GPU, latency | B2 | decide by end of S1 (Nov 15) |
| 3 | Whisper variant and latency/CER on Taiwan Mandarin | A1 | faster-whisper |
| 4 | Service-to-service protocol (HTTP vs gRPC) | 張棨翔 | HTTP |
| 5 | Is speaker separation needed | A4 | skip (scope lever) |
| 6 | Is RAG needed | B5 | no RAG |
| 7 | Drafting trigger (pause vs end vs incremental) | B6, team | pause or end |
| 8 | shadcn means shadcn-vue | team | shadcn-vue |
| 9 | Physician view sync (polling vs pub/sub) | D4 | polling |

Record each answer in `DECISIONS.md` (spikes: with the measured numbers).

## 11. Repo layout (to create in P1)

```
apps/web/            Vue 3 + Vite + TypeScript + Tailwind + shadcn-vue
services/api/        session API, validation, guard, audit
services/stt/        Whisper wrapper
services/llm/        Gemma-4 wrapper, prompts (versioned)
eval/                scenarios, metrics, runner
docker-compose.yml   web, api, stt, llm
pnpm-workspace.yaml
```

## 12. Build order

Follows `docs/ROADMAP.md` (sprint goals) and the board (items): walking skeleton for scenario S01 first,
then the validated editable draft with traceability and the harness, then safety, pilot and evaluation.
