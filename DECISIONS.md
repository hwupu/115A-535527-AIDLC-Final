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
