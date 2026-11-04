# Frontend ↔ API Interface (Proposal)

Status: **proposal from the frontend side; the direction was approved by the PO and backend lead (張棨翔, 2026-10-29)**; details are
confirmed in D1 and D5. Only `GET /health` exists today (stub). System design: [`../ARCHITECTURE.md`](../ARCHITECTURE.md).
Report schema and field model: [`../SCENARIOS.md`](../SCENARIOS.md) §1 and [`../ARCHITECTURE.md`](../ARCHITECTURE.md) §4.

The frontend talks only to `services/api` under `/api` (Vite proxy and nginx strip the prefix). JSON everywhere except audio frames.
No authentication in the prototype; evaluation endpoints are enabled only when `EVAL_MODE=1`.

## 1. Conventions

- IDs are strings. **No personal information is collected or stored** (no name, 身分證字號, phone). Each visit is identified only by
  `visit_no` (就診號), a **system-generated simulated number** matching `^SIM-\d{6}$`, never a real hospital number.
  It is allocated by the backend when the intake is written to the database, and is never typed by the patient.
  **就診號 vs 病歷號:** 就診號 is generated per visit; 病歷號 is a patient's permanent record number. This prototype does not
  handle 病歷號 (no HIS integration).
- Times are ISO 8601 UTC. Dates of birth are ISO; the UI shows 民國.
- Errors: HTTP status plus `{ "error": { "code": "snake_case", "message": "人看得懂的繁中訊息" } }`.
- Every report field is `{ value, status, source_span, source }`.
  `status ∈ 未提及 | AI 草稿 | 護理師已確認`; `source ∈ ai | nurse_edit | patient_input` (**`patient_input` is new**, see §6).
- `triage_level` is accepted only from the nurse on confirm. No endpoint ever returns an AI-suggested level.
- **Known limitation (PO, 2026-10-29): no authentication.** The role is a client-side route and the `role` query parameter is supplied
  by the frontend, so anyone who can reach the URL can switch roles or call the evaluation API. Fine for a local demo; access control
  is needed before the app is exposed on an HTTPS domain (see P4).

## 2. Sessions (nurse and patient)

A session is one triage encounter. It is created by the patient screen (first input) or by the nurse. Its 就診號 is allocated
when the intake is committed (see `finish-intake`) or immediately when the nurse creates the session.

| Method and path | Who | Purpose |
|---|---|---|
| `POST /sessions` `{ created_by: "patient"\|"nurse", mode?: "normal"\|"evaluation", scenario_id? }` | patient, nurse, admin | Create a session. → `{ session_id, status, visit_no? }` (`visit_no` is `null` until intake is finished; the nurse path returns it right away). |
| `POST /sessions/{id}/inputs` `{ kind: "text", text }` | patient, nurse | Add a typed entry. Stored as a transcript segment with `speaker: "patient"` or `"nurse"` and `source: "patient_input"` when sent from the patient screen. → `{ input_id }` |
| `POST /sessions/{id}/finish-intake` | patient | The patient is done. Allocates and returns the 就診號 and moves the session to `ready`. → `{ visit_no }` |
| `GET /sessions?visit_no=SIM-000123` or `?status=ready` | nurse | Find a patient by the 就診號 they read out, or from the list of patients who finished intake. |
| `POST /sessions/{id}/claim` | nurse | The nurse takes a `ready` session (`ready → in_progress`). Idempotent. 409 `intake_not_finished` if the patient is still entering. → `{ status, visit_no }` |
| `GET /sessions/{id}` | nurse | Full session: `{ session_id, status, visit_no, segments, fields, flags, confirmed_at? }`. `fields` is a flat map from field path to `{ value, status, source_span, source }`. |
| `PATCH /sessions/{id}/fields` `{ path, value }` or `{ path, confirm: true }` | nurse | Edit one field, or accept the AI draft as it is. Both are audited (AI value vs new value). An edit sets `source: "nurse_edit"`; a plain confirm keeps `source: "ai"`. Both set `status: 護理師已確認`. An empty `value` returns the field to `未提及`. → the updated field |
| `POST /sessions/{id}/confirm` `{ triage_level: 1..5 }` | nurse | Save the report. `triage_level` is the nurse's own entry. **409 `drafts_unconfirmed`** while any field is still `AI 草稿` (the server enforces the gate, not only the UI). → `{ confirmed_at }` |
| `DELETE /sessions/{id}` | nurse, admin | Remove the session and its data. |

**Server rules the frontend relies on:** (1) an AI update (`field.update`) never overwrites a field whose status is `護理師已確認`;
(2) after `confirmed` every write returns 409; (3) the patient role never receives `field.update` or `flags.update`.

**Field paths.** The current list of paths, Chinese labels and value types is `apps/web/src/report/schema.ts` (frontend-owned until the
backend schema B1 lands, then B1 is the source of truth and the file is aligned to it). Values are text, numbers (vitals), booleans
(`measurement.wristband_no_treatment`) or string lists (`measurement.restrictions` as "部位：原因", symptoms, history).

Statuses: `intake` (patient entering) → `ready` (intake finished, waiting for the nurse) → `in_progress` (nurse working) → `confirmed`.
A session still in `intake` after a timeout (proposed 30 minutes) is purged and **never receives a 就診號**.

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
| `{ "type": "field.update", path, value, status, source_span, source }` | Draft changes from the LLM (`status: AI 草稿`). Nurse role only. |
| `{ "type": "flags.update", flags: [{ text, basis }] }` | Danger-sign suggestions with the quote they are based on (replaces the previous list). Nurse role only. Thresholds come from the backend (B8), never from the frontend. |
| `{ "type": "recording.state", recording: bool, by }` | So the nurse sees the patient is speaking, and vice versa. |
| `{ "type": "status", stt: "ok"\|"down", llm: "ok"\|"slow"\|"down" }` | Drives the connection banner. |
| `{ "type": "error", code, message }` | Non-fatal; the UI keeps the manual path open. |

The socket resumes by `session_id` after a drop (server keeps state).

## 3. Physician

| Method and path | Purpose |
|---|---|
| `GET /sessions?status=ready,in_progress,confirmed&limit=50` | List for the physician picker. Items: `{ session_id, visit_no, status, started_at, confirmed_at?, chief_complaint?, has_flags }`. Newest first. `chief_complaint` is filled only for `confirmed` sessions, so the physician never sees an unconfirmed AI draft in the list. `ETag` / `If-None-Match` supported (304). |
| `GET /sessions/{id}/report` | Read-only confirmed report `{ session_id, visit_no, confirmed_at, triage_level, fields, flags }`. `triage_level` is the nurse's own entry. **409 `not_confirmed`** until the nurse saves (the UI treats this as "尚未確認" and keeps polling). Per-field `source` lets the UI mark what the nurse edited (`nurse_edit`) versus accepted (`ai`). |

The UI polls the list every few seconds (ETag or `If-None-Match`, return `304` when unchanged). Push (SSE or WS) is a later option.
`chief_complaint` in the list is a one-line preview of the nurse-confirmed value only (empty until confirmed).

## 4. Admin (evaluation mode, `EVAL_MODE=1`)

| Method and path | Purpose |
|---|---|
| `GET /scenarios` | `[{ id, title, split: "dev"\|"held_out", demo: bool }]` from `docs/SCENARIOS.md` data. |
| `POST /evaluation/runs` `{ scenario_id, participant_code }` | Create a run (and its session). `participant_code` is anonymous, e.g. `N-01` (not a name). → `{ run_id, session_id }` |
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
3. **就診號 allocation** happens at `finish-intake` (patient) or session creation (nurse); sessions abandoned in `intake` are purged without a number. The nurse finds the session by 就診號 or from the `ready` list.
4. **Physician list needs a cheap query** (status and timestamps indexed); no full report per row.
5. **Patient endpoints expose no draft, flags or level.** The WebSocket with `role=patient` must not receive `field.update`.
6. **`EVAL_MODE` flag** gates evaluation routes; evaluation reuses the audit log instead of a second logging path.

## 7. Open questions

Status: **the defaults below were adopted by the PO (張棨翔, 2026-10-29)**; details are confirmed while building D1 and D5.

| # | Question | Default |
|---|---|---|
| 1 | 就診號 numbering: sequential or random within `SIM-######`? | sequential (easy to read aloud; no real data) |
| 2 | Same WebSocket route for patient and nurse, or separate? | one route, `role` query decides |
| 3 | Audio format and chunking | decide after spike A1 |
| 4 | Polling versus push for the physician list | polling |
| 5 | Should the patient see a confirmation that the nurse received their entry? | no (keep the screen minimal) |
