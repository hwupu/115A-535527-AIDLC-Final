# Decisions Log

**Current code steward: 吳普軒 (Week 8, Oct 26 – Nov 1).** Rotation schedule: `README.md`.
Update this line via PR at every handover.

Entry format: Status, Context, Decision, Consequences, Decided by.

## 2026-09-21 — Initial code steward
- Status: superseded by the 2026-10-27 rotation entry
- Decision: 吳普軒 is the initial code steward.
- Context: volunteered.
- Decided by: team

## 2026-09-21 — Local Ollama for the discharge-summary prototype
- Status: superseded (topic changed, see 2026-10-27)
- Decision: run an open-weight model locally through Ollama to draft
  discharge summaries; a physician reviews and approves. Synthetic or
  authorized de-identified data only.
- Context: controlled environment; avoids sending test inputs to a public
  AI service.
- Led by: 張棨翔
- Note: the local-inference principle carries over to the new topic; the
  runtime for Gemma-4 is still open (spike B2). Old plan archived in
  `docs/archive/discharge-summary/`.

## 2026-10-08 — AI agent as Scrum Master
- Status: accepted
- Decision: Claude Code acts as Scrum Master (facilitates planning, check-ins,
  review, retro; keeps backlog and notes current; flags drift). It does not own
  the product, assign people, merge to `main`, or settle disagreements. Major
  decisions and changes are recorded here and in `prompt-log/`.
- Consequences: humans keep all approval authority. The Product Owner is
  decided in the 2026-10-27 entry below. Revisit after the first retrospective.
- Decided by: team (led by 吳普軒)

## 2026-10-27 — Project topic: AI voice triage assistant
- Status: accepted
- Context: after CP1 the team chose the ED triage topic over discharge
  summaries, based on two interviews (triage nurse, attending physician).
- Decision: build a web app that transcribes triage conversation and drafts a
  structured report for the nurse to confirm. The nurse alone decides 檢傷級數.
  Simulated scenarios only. Details in `docs/references/HANDOFF_scrum_setup.md`.
- Consequences: discharge-summary docs are archived. Evidence limits (two
  teaching-hospital interviews, nurse's unmeasured 2–3 min estimate) must be
  stated honestly in all documents.
- Decided by: team

## 2026-10-27 — Weekly code-steward rotation
- Status: accepted (order confirmed in the Product Owner entry below)
- Decision: the code steward rotates weekly, Monday to Sunday. Week 8: 吳普軒.
  Schedule is in `README.md`. This replaces the earlier idea of
  designating a rotation "later".
- Consequences: the steward may not be the sole approver of their own PR.
  Disputes about AI output: the current steward decides; if the steward authored
  the change, the team decides by majority vote excluding the author.
- Decided by: team

## 2026-10-27 — Language policy
- Status: accepted
- Decision: course submissions in English; team communication and GitHub
  Projects in 繁體中文（台灣）; commit messages and branch names in English; README in 繁體中文 (team onboarding, decided 2026-10-27).
  Clinical terms stay in Traditional Chinese (glossary in the handoff §6).
- Open (defaults proposed, not yet decided): issue/PR titles and review
  comments in Chinese; templates bilingual; code identifiers English with
  Chinese comments allowed.
- Decided by: team

## 2026-10-27 — Initial tech stack and area leads
- Status: accepted (stack items marked TBD are open)
- Decision: web app only; pnpm workspace on Node.js LTS (`n` optional for local version management); Vue 3 + Tailwind + shadcn-vue
  (to confirm); Whisper for STT; Gemma-4 for extraction; docker-compose; GitHub
  Actions CI. Backend: FastAPI. LLM runtime TBD (spike B2).
  Area leads: see `README.md` (current version).
- Decided by: team

## 2026-10-27 — Two-week sprints and schedule
- Status: accepted
- Context: CP2 is due Mon Nov 23 and CP3 Mon Dec 14 (team-confirmed); DEMO is
  Mon Dec 21. The original plan had nine one-week sprints starting Week 8.
- Decision: 2-week sprints. Week 8 is Sprint 0 (setup). S1 = Weeks 9–10,
  S2 = 11–12, S3 = 13–14. Week 15 is a buffer. Week 16 is the demo. The code
  steward still rotates weekly. Plan: `docs/ROADMAP.md`.
- Consequences: six working weeks replace eight, so scope is cut (B6 dropped;
  A4, P4, C9 deferred by default). S1 is overloaded and CP3 leaves no
  data-collection time in Week 15. Revisit at the S1 retrospective.
- Decided by: team

## 2026-10-27 — Backlog on GitHub; area leads reassign work
- Status: accepted
- Decision: the product backlog lives only in GitHub issues and the GitHub
  Project board (owner, Sprint, Size, Epic). Docs do not copy it. Initial owners
  follow the handoff proposal. Area leads (listed in `README.md`) judge workload
  and reassign tickets later; any member who is stuck or overloaded asks their
  area lead for help instead of silently slipping.
- Decided by: team

## 2026-10-27 — Product Owner and steward rotation order confirmed
- Status: accepted
- Decision: 張棨翔 is the Product Owner. The weekly code-steward rotation order
  (Week 8 吳普軒, 9 劉順松, 10 林均澔, 11 張棨翔, 12 劉順松, 13 林均澔,
  14 吳普軒, 15 張棨翔, 16 吳普軒) is confirmed. The table is in `README.md`.
- Consequences: 張棨翔 now holds the Product Owner role on top of being an
  area lead for LLM, backend, STT and compose (the heaviest load). The Product
  Owner decides backlog order and acceptance; the AI Scrum Master flags this
  load at each Sprint Planning.
- Decided by: team

## 2026-10-28 — uv for Python tooling
- Status: accepted; the `requirements.txt` part is superseded by
  "uv projects instead of requirements.txt" below
- Decision: Python services use `uv` for packages and the Python version (3.12),
  in Dockerfiles, `scripts/dev.sh` and CI. No pip. `requirements.txt` stays the
  single dependency list. `n` for Node remains optional.
- Decided by: 吳普軒

## 2026-10-28 — uv projects instead of requirements.txt
- Status: accepted
- Context: `requirements.txt` uses `>=` ranges, so local, CI and Docker can
  install different versions. uv can lock exact versions.
- Decision: each Python service (`api`, `stt`, `llm`) is its own uv project
  with `pyproject.toml` and `uv.lock`; dev tools go in `[dependency-groups]`.
  `requirements*.txt` files are removed. Add packages with `uv add`. Docker
  uses `uv sync --frozen --no-dev`; CI uses `uv sync --locked`, which fails
  if `uv.lock` was not updated after `pyproject.toml` changed. No uv
  workspace: stt (Whisper) and llm (Gemma runtime) may need different
  versions of shared packages such as PyTorch, and each service must stay
  swappable on its own.
- Consequences: replaces "requirements.txt stays the single dependency list"
  in the entry above. Dockerfiles, CI, `scripts/dev.sh` and README change
  together (#57).
- Decided by: 張棨翔 (backend lead), agreed by 吳普軒 (CI)

## 2026-10-28 — SQLite with SQLAlchemy for the api database
- Status: accepted
- Context: the api needs to store sessions, transcript segments, fields,
  audit events and evaluation runs. At most two sessions run at once. A
  separate database container would add setup for every member and CI.
- Decision: a SQLite file inside the api, accessed only through SQLAlchemy;
  schema changes through Alembic migrations. Connection string in `.env` as
  `DATABASE_URL`. No raw SQL or SQLite-only features, so moving to
  PostgreSQL stays a configuration change. Database files are not committed.
- Consequences: no `db` service in docker-compose; Docker-free dev and CI
  need no changes. D2 (audit log, 劉順松) adds its tables through the same
  Alembic setup. If SQLite is not enough, switch to PostgreSQL by the end
  of S2 (Nov 29), before evaluation data collection (E10) starts.
- Decided by: 張棨翔 (backend lead), agreed by 吳普軒

## 2026-10-28 — Frontend choices: shadcn-vue, Pinia, readable UI, roles
- Status: accepted. Items marked (PO) were confirmed by 張棨翔 on 2026-10-29
- Decision: adopt shadcn-vue and Pinia. Default text is large (18 px base, 20 px on tablets) with a high-contrast light
  theme. The first screen has four demo roles: 病患, 檢傷護理師, 醫師, 管理者 (admin, evaluation mode). Patient screen:
  voice input, text input, then an ending screen with the 就診號 (PO; amended below). Physician picks the patient from a list (PO). Admin persona owns
  evaluation mode, separate from the nurse screen (PO).
- Consequences: the patient adds a new input source (`patient_input`) and the api gains list and evaluation endpoints;
  proposed in `docs/frontend/API_INTERFACE.md`; direction approved by the PO and backend lead (details in D1/D5).
  Patient read-back is deferred and, when built, only repeats the patient's own words (no draft, flags or level).
- Decided by: 吳普軒 (frontend lead); confirmed by PO 張棨翔 (2026-10-29)

## 2026-10-28 — No personal information; visits identified by a simulated 就診號
- Status: accepted; confirmed by the PO 張棨翔 (2026-10-29)
- Context: school project, so no personal information is collected. The patient does not know an ID before anything is written to
  the database.
- Decision: the patient screen no longer asks for a code. The patient speaks or types, taps 完成, and the ending screen shows
  the **就診號** assigned by the system (simulated, format `SIM-######`, never a real hospital number). Nurses and physicians
  identify patients by 就診號. This supersedes the "simulated patient code" part of the entry above.
- Terminology (PO, 2026-10-29): what the patient receives is the **就診號** (visit number, generated per visit), not the 病歷號
  (the patient's permanent record number). The prototype does not handle 病歷號 because there is no HIS integration.
  The api field is `visit_no`.
- Consequences: backend allocates the number at `finish-intake` (or at nurse-created sessions) and purges unfinished intakes;
  see `docs/frontend/API_INTERFACE.md`. No name, 身分證字號 or phone is stored anywhere. The app has no login, so
  access control is needed before exposing it on an HTTPS domain.
- Decided by: 吳普軒 (frontend lead); PO 張棨翔 confirmed

## 2026-10-30 — Nurse workflow built as one PR behind contracts
- Status: accepted by the frontend lead; backend items proposed to 張棨翔 (see tickets D1, D5, B4, B8)
- Context: the nurse path touches tickets owned by several people. Reviewing it in one PR keeps the context together, and
  placeholders behind fixed contracts let the other owners replace their parts without blocking the workflow.
- Decision: implement the whole nurse workflow against the mock api (open by 就診號 or list, consent, recorder, transcript,
  editable draft, 量測禁忌 and flags, nurse-entered 檢傷級數, confirm gate, copy/print). Report fields are a flat path map
  (`apps/web/src/report/schema.ts`). No "confirm all" button: drafts are confirmed one by one. The server (not only the UI) must
  refuse to save while any AI 草稿 remains and must never overwrite a nurse-edited field with an AI update. Vitest and happy-dom are
  adopted and run in CI.
- Consequences: new api surface proposed in `docs/frontend/API_INTERFACE.md` (`claim`, `PATCH` with `confirm`, `flags.update`,
  409 `drafts_unconfirmed`). Whether nurses accept confirming one by one is a pilot question (E9).
- Decided by: 吳普軒 (frontend lead)

## 2026-10-30 — Physician workflow: confirmed reports only, nurse's level shown
- Status: accepted by the frontend lead; api items proposed to 張棨翔 (D1, D4)
- Decision: the physician list and report are read-only and mock-backed. The report is available only after the nurse saves it
  (409 `not_confirmed` before that, shown as 「尚未確認」). The physician sees the nurse's 檢傷級數 and which fields the nurse edited;
  the list previews the main complaint only for confirmed sessions, so no unconfirmed AI draft reaches the physician. Vitals are
  displayed as values only; flags come from the backend (B8). The list refreshes by polling with ETag.
- Decided by: 吳普軒 (frontend lead)

## 2026-10-30 — Admin evaluation screen and patient wiring, mock-backed
- Status: accepted by the frontend lead; evaluation api (D6) proposed in `docs/frontend/API_INTERFACE.md` §4
- Decision: the admin screen runs scenarios as timed runs with anonymous participant codes (`N-##`), logs the nurse's edits and
  level entry automatically while a run is running, takes manual error and note events, and exports JSON and CSV. The patient
  screen now uses the api client (lazy session, typed text, shared recorder contract, `finish-intake` for the 就診號).
- Consequences: the mock is the executable reference for D6; whether to keep `EVAL_MODE` as a build or runtime flag is left to
  the backend. Run data contains no names.
- Decided by: 吳普軒 (frontend lead)
