# Frontend ↔ API Interface (Proposal)

Status: **proposal from the frontend side for 張棨翔 (backend lead) to confirm or change.** Nothing here is decided until it
is in `DECISIONS.md`. Only `GET /health` exists today (stub). System design: [`../ARCHITECTURE.md`](../ARCHITECTURE.md).
Report schema and field model: [`../SCENARIOS.md`](../SCENARIOS.md) §1 and [`../ARCHITECTURE.md`](../ARCHITECTURE.md) §4.

The frontend talks only to `services/api` under `/api` (Vite proxy and nginx strip the prefix). JSON everywhere except audio frames.
No authentication in the prototype; evaluation endpoints are enabled only when `EVAL_MODE=1`.

## 1. Conventions

- IDs are strings. `patient_id` is a **simulated code** matching `^P-\d{4}$`; never a real 身分證字號 or 病歷號.
- Times are ISO 8601 UTC. Dates of birth are ISO; the UI shows 民國.
- Errors: HTTP status plus `{ "error": { "code": "snake_case", "message": "人看得懂的繁中訊息" } }`.
- Every report field is `{ value, status, source_span, source }`.
  `status ∈ 未提及 | AI 草稿 | 護理師已確認`; `source ∈ ai | nurse_edit | patient_input` (**`patient_input` is new**, see §6).
- `triage_level` is accepted only from the nurse on confirm. No endpoint ever returns an AI-suggested level.

## 2. Sessions (nurse and patient)

A session is one triage encounter for one patient code. There is at most one active session per `patient_id`.

| Method and path | Who | Purpose |
|---|---|---|
| `POST /sessions` `{ patient_id, created_by: "patient"\|"nurse", mode?: "normal"\|"evaluation", scenario_id? }` | patient, nurse, admin | Create the active session for the patient, or return the existing one (idempotent). → `{ session_id, patient_id, status }` |
| `GET /sessions/{id}` | nurse | Full session: transcript segments, current report, status. |
| `POST /sessions/{id}/inputs` `{ kind: "text", text }` | patient, nurse | Add a typed entry. Stored as a transcript segment with `speaker: "patient"` or `"nurse"` and `source: "patient_input"` when sent from the patient screen. → `{ input_id }` |
| `PATCH /sessions/{id}/fields` `{ path, value }` | nurse | Edit one field (audited: AI value vs new value). Sets `source: "nurse_edit"`. |
| `POST /sessions/{id}/confirm` `{ triage_level, fields_confirmed: [path…] }` | nurse | Confirm the report. `triage_level` is the nurse's own entry. → `{ confirmed_at }` |
| `DELETE /sessions/{id}` | nurse, admin | Remove the session and its data. |

Statuses: `in_progress` → `awaiting_confirmation` → `confirmed`.

### Realtime: `WS /sessions/{id}/ws?role=patient|nurse`

Client → server:

| Message | Notes |
|---|---|
| binary audio chunk | MediaRecorder chunks; `role` decides `speaker`. Format and chunk size TBD after spike A1. |
| `{ "type": "recording.start" \| "recording.stop" }` | Lets the server and other views show the recording indicator. |
| `{ "type": "field.edit", "path", "value" }` | Same effect as `PATCH`; convenient on the open socket. |

Server → client:

| Message | Notes |
|---|---|
| `{ "type": "transcript.segment", segment_id, speaker, text, start, end, final }` | Partial (`final:false`) and final segments. |
| `{ "type": "field.update", path, value, status, source_span, source }` | Draft changes from the LLM. |
| `{ "type": "recording.state", recording: bool, by }` | So the nurse sees the patient is speaking, and vice versa. |
| `{ "type": "status", stt: "ok"\|"down", llm: "ok"\|"slow"\|"down" }` | Drives the connection banner. |
| `{ "type": "error", code, message }` | Non-fatal; the UI keeps the manual path open. |

The socket resumes by `session_id` after a drop (server keeps state).

## 3. Physician

| Method and path | Purpose |
|---|---|
| `GET /sessions?status=in_progress,awaiting_confirmation,confirmed&limit=50` | List for the physician picker. Items: `{ session_id, patient_id, status, started_at, confirmed_at?, chief_complaint?, has_flags }`. Newest first. |
| `GET /sessions/{id}/report` | Read-only confirmed report (404 or `409 not_confirmed` if not yet confirmed). Includes per-field `status` and `source` so the UI can show confirmed versus edited. |

The UI polls the list every few seconds (ETag or `If-None-Match`, return `304` when unchanged). Push (SSE or WS) is a later option.
`chief_complaint` in the list is a one-line preview of the nurse-confirmed value only (empty until confirmed).

## 4. Admin (evaluation mode, `EVAL_MODE=1`)

| Method and path | Purpose |
|---|---|
| `GET /scenarios` | `[{ id, title, split: "dev"\|"held_out", demo: bool }]` from `docs/SCENARIOS.md` data. |
| `POST /evaluation/runs` `{ scenario_id, participant_code }` | Create a run (and its session). `participant_code` is anonymous, e.g. `N-01`. → `{ run_id, session_id }` |
| `POST /evaluation/runs/{id}/start` and `/finish` | Start and stop the timer on the server clock. |
| `GET /evaluation/runs/{id}/events` | Event log: `task_start`, `field_edit`, `error_found`, `level_entered`, `task_end`; edits come from the audit log automatically. |
| `POST /evaluation/runs/{id}/events` `{ type, payload }` | Manual events the admin records (for example "nurse caught an error"). |
| `GET /evaluation/runs` / `GET /evaluation/runs/{id}/export?format=json\|csv` | List and export. Export includes `model`, `prompt_version`, `whisper_model`, `git_commit` (backend doc §4, `runs` table). |

Evaluation endpoints return `404` when `EVAL_MODE` is off, so a normal demo cannot reach them.

## 5. Health and misc

- `GET /health` → `{ "status": "ok", "service": "api" }` (exists).
- `GET /scenarios/{id}/audio` (dev and demo profiles only): fixture audio for the offline demo fallback.

## 6. Impact on the backend design (for 張棨翔)

1. **New `source` value** `patient_input` and a `speaker` on transcript segments (`patient | nurse`). Patient voice goes through the
   same stt path; patient text skips stt and goes straight into the transcript.
2. **Patient entries are inputs to the draft, not confirmed facts.** They never reach a field as `護理師已確認` without the nurse.
3. **Idempotent `POST /sessions`** so the patient and nurse screens converge on the same session for a code.
4. **Physician list needs a cheap query** (status and timestamps indexed); no full report per row.
5. **Patient endpoints expose no draft, flags or level.** The WebSocket with `role=patient` must not receive `field.update`.
6. **`EVAL_MODE` flag** gates evaluation routes; evaluation reuses the audit log instead of a second logging path.

## 7. Open questions

| # | Question | Default |
|---|---|---|
| 1 | Who creates a patient code: the patient typing it, the nurse, or a seeded list? | any role can create via idempotent `POST /sessions` |
| 2 | Same WebSocket route for patient and nurse, or separate? | one route, `role` query decides |
| 3 | Audio format and chunking | decide after spike A1 |
| 4 | Polling versus push for the physician list | polling |
| 5 | Should the patient see a confirmation that the nurse received their entry? | no (keep the screen minimal) |
