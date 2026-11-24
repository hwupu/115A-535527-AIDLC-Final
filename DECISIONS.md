# Decisions Log

**Current code steward: 劉順松 (Week 12, Nov 23 – 29), per the confirmed rotation.** Rotation schedule: `README.md`.
Update this line via PR at every handover. The Week 9 (劉順松) and Week 10 (林均澔) handovers were not recorded
when they happened. Each person adds a short entry with what they actually did as steward, or says the week was
missed.

Entry format: Status, Context, Decision, Consequences, Decided by. New entries go at the top of the 2026-11 block.

## 2026-11-24 — TTAS reference level filled in by a rule table, never by the LLM; the nurse decides
- Status: proposed (PO direction 2026-11-24; the team confirms in the PR review)
- Context: outside-team participant U04 (physician, #101) suggested filling in the triage level from the chief
  complaint by the TTAS criteria (急診五級檢傷分類基準), since in practice choosing the complaint mostly sets the
  level. The project rule so far: the nurse decides 檢傷級數 and the AI never does. TTAS is not one level per
  complaint: the adult non-trauma table has about 127 standard complaints and 1,400 criteria, and the level depends
  on modifiers such as SpO2, blood pressure, heart rate, temperature, consciousness and pain (for example 呼吸短促
  is level 1 at SpO2 < 90 %, 2 at < 92 %, 3 at 92–94 %, 4 without distress).
- Decision: the LLM keeps drafting the chief complaint and vitals only; it never outputs a level (v5 schema
  unchanged). A program looks up a TTAS rule table: chief complaint → standard complaint (synonym table), then
  the vitals already in the report → the matching criterion and level. The screen shows it as 「TTAS 參考級數（程式
  依主訴與生命徵象對照）」 with the matched criterion; the nurse still selects and confirms 檢傷級數. If the complaint
  cannot be matched, or a criterion needs information the report lacks (consciousness, pain, PEFR), it says so
  instead of guessing. The audit log keeps the reference level and the nurse's level.
- Consequences: the rule becomes "the AI never decides 檢傷級數; the system may show a TTAS reference level from a
  rule table, and the nurse decides". `CLAUDE.md`, `PROMPT_CARD.md`, the printout footer, the scenario answer keys
  and the "no triage level from the AI" tests are updated with the implementation, and the LLM tests stay as they
  are. The first version covers the complaints in S01, S03 and S04 and the vitals-based criteria; the rest of the
  table follows. The TTAS PDFs stay out of the repository until their licence is checked; the repository holds only
  the structured rows used. CP3 can report how often the nurse's level matches the reference level.
- Decided by: 張棨翔 (PO), pending team confirmation

## 2026-11-24 — Exports stay copy text, print and JSON; no HIS integration
- Status: accepted
- Context: three of four outside-team participants (U01, U03, U04; #101) said getting the report into the HIS
  matters more than printing. The scope excludes writing to a real HIS, and the project uses simulated data only.
- Decision: keep the three exports (copy text, the ED-style printout from #99, JSON download). No HIS-specific
  export for now.
- Consequences: re-typing into the HIS remains, and the evaluation and final report name it as the main gap for
  real use.
- Decided by: 張棨翔 (PO)

## 2026-11-24 — AI usage guidelines v0.3 approved
- Status: accepted
- Context: v0.3 (#98) rewrote three rules so they can be checked from a PR, from the Week 12 lab evidence: PRs of
  about 400 changed lines at most, an approval counts only with a written comment, and every PR fills in the
  template's "AI assistance" section (#96). It was merged as a draft pending team ratification.
- Decision: the team approves v0.3 as written. The "(proposed)" markers become "(v0.3)".
- Consequences: reviewers check these three rules on every PR from now on; the PR template already asks for them.
- Decided by: the team (recorded by 吳普軒)

## 2026-11-24 — One README, and course files kept in `docs/cp2/` (#97, #103)
- Status: proposed by 吳普軒 (README area lead) in #103; pending review
- Context: Group 03 found two conflicting quick starts in the Week 12 lab (`README.md` and `README_CP2.md`, #97). The
  repository root and `docs/` also held course working notes (`CP2_WORK_LOG.md`, personal handoff files, an old
  archive), mixed in with the documentation for the code.
- Decision: `README.md` is the only run guide. Everything handed in for a checkpoint lives in `docs/cp2/` (starting
  at `docs/cp2/README.md`, with the deliverables table); the instructor's blank worksheets go in `docs/references/`.
  Scripts are named for what they do (`scripts/start.*`, `scripts/check.*`); the zip builder is `docs/cp2/_package.py`
  and packs only the deliverables plus the repository link.
- Rejected: keeping the worksheets at `docs/walking_skeleton.md` and `docs/merge_day.md` as the worksheet text says;
  `docs/cp2/README.md` points graders to the actual location. Packing the whole source tree in the zip: the code is
  graded from GitHub.
- Consequences: removed files stay in git history (`56a8b38`). The CP2 report and the zip read from `docs/cp2/`.
- Decided by: 吳普軒 (README area lead); the team confirms in the #103 review

## 2026-11-24 - Week 12 steward actions and future merge plan
- Status: observed repository actions plus a proposed future plan; not joint-session minutes.
- Human owner: 劉順松 (current Week 12 steward). On explicit instruction, Codex reviewed, corrected and approved/merged #96 -> #98 -> #95 -> #94, with written review records. #95 fixes cover labelled values, home vitals and invalid dates; #94 fixes clarify participant codes and unverified metadata. Integrated API/eval 26 tests and LLM 29 passed on that revision; latest premerge CI passed.
- Authorship boundary: these were AI-assisted actions under the user's account, not a claim of independent personal line-by-line review or four-member collaboration. Week 9 actions have not been supplied; no retrospective service is invented. Week 10 remains for the actual participant to confirm.
- Proposed next decision: use one reproducible quick start and a non-author fresh-copy check to address #97. Evaluate CP2 with one tool task and honest feedback, retaining formal timing comparison for CP3. Team acceptance remains pending.
- Alternative rejected in preparation: claiming current Qwen/v3 or no merged code for 劉順松/林均澔 from stale November 4/19 documents; inventing missing user metadata.

### Future merge-day plan (prepared before the session; not executed)
- Target: after the 2026-11-26 walking skeleton, before E3. Exact start and attendees unconfirmed.
- At planning baseline 48a41b8, no open PRs remained after the four merges. The closeout branch and the session's new skeleton PR must be enumerated with the live open-PR list at the call.
- Order: complete the genuine skeleton slice and review first; then reviewed independent documentation/startup work; any shared contract change before consumers. Run tests and the primary task after each merge, stop on failure. Do not add new features during merge day.
- Expected overlap: DECISIONS.md, README and CP2 report. Preserve separate dated decisions; do not overwrite teammate notes. Rotate drivers and require explanation of any AI conflict suggestion.
- Done: clean main; every open PR merged or closed with reason; a non-steward clones fresh and completes nurse confirmation -> doctor report from README only; actual outcome and reflection recorded in docs/merge_day.md.
- Outcome, driver rotation, fresh-copy tester, result and evidence: PENDING ACTUAL SESSION. Agent-only merges on 2026-11-24 do not satisfy this activity.

## 2026-11-23 — Speaker roles in the transcript: labelled by the AI from content, correctable by the nurse
- Status: accepted
- Context: an outside-team participant (U02, #101) asked for the conversation's speaker roles. Today every line
  recorded on the nurse screen is labelled 護理師; only patient-screen input is labelled 病患. Whisper does not tell
  speakers apart.
- Decision: each transcript line gets a speaker (`nurse`, `patient`, `family`, `unknown`) judged by the extraction
  model from its content and context; when unsure it says `unknown` rather than guessing. The nurse can correct it,
  and the correction is audited. Voice-based speaker separation (pyannote) is left for later (#9), after checking
  its licence, GPU needs and results on short, masked, Mandarin speech. Implementation: #102.
- Consequences: one recording becomes several transcript lines (one per Whisper segment). Speaker labels go into
  the transcript prompt v5 sees, which should help tell a patient's own reading from the nurse's measurement.
  Accuracy is measured on S01, S03 and S04 before relying on it.
- Decided by: 張棨翔 (PO)

## 2026-11-22 — The AI drafts every report field it hears (prompt v5)
- Status: accepted
- Context: prompt v3 (#73) lets the AI fill six fields; in a recorded test, vitals, date of birth, accompaniment and
  TOCC answers stayed empty, and a travel answer without the word 旅遊 was dropped by the v3 adapter.
- Decision: prompt v5 drafts every field in `contracts.py` that the transcript states, and is the default
  (`LLM_PROMPT_VERSION`, v3 and v4 stay available). Safeguards: Ollama structured output with a JSON Schema (only
  known fields, each `{value, source_span}`, so no `triage_level`); the quote must appear in the transcript; numbers
  and the date of birth are computed in code from the quote and dropped if it cannot support them; a temperature
  from a sentence about a home reading is dropped; the api's type checks and the nurse's confirmation stay.
- Measured (`docs/cp2/evidence/prompt-v5-2026-11-22/`, 12 dev cases plus S01 and a synthetic STT-style case):
  gemma4:e4b v5 10/12 whole cases on T01–T12 (v3 10/12), 36/43 fields correct, no wrong yes/no, number or date.
  gemma3:1b fills few fields (8/43) but gave no wrong typed value.
- Consequences: more fields means more to review; the extra drafts are still 「AI 草稿」 until the nurse confirms.
  T13 and T14 are development cases written while tuning v5; held-out cases and a nurse review of the answer key are
  still needed. `CLAUDE.md` and `docs/cp2/PROMPT_CARD.md` now name v5.
- Decided by: 張棨翔 (PO and LLM lead)

## 2026-11-22 — Patient screen asks one question at a time and shows the patient's own answers
- Status: accepted
- Context: 2026-10-29 the PO chose fixed guided questions on the patient screen (option B, #86) and deferred the
  read-back, scoped to repeating only the patient's own words ("Frontend choices" entry;
  `docs/frontend/PERSONAS_STORIES.md`).
- Decision: the patient screen becomes a step-by-step questionnaire: one fixed question per screen, answered by voice
  or text, skippable, with simple pre-written follow-ups and no AI choosing the next question (#86). The read-back is
  pulled forward into #86 with the same scope: the screen shows only what the patient said or typed (voice as its
  transcript), never the AI draft, danger-sign flags or a triage level. Questions are not read aloud for now; reading
  the fixed questions with Fish Speech may follow later in its own card, after checking its licence and speed and
  only for fixed text, never AI output.
- Consequences: each answer is stored with its question (e.g. "過去兩個月內，有去過國內或國外旅遊嗎？沒有") so prompt v5 can
  tell what a bare 「沒有」 answers; the frontend shows the patient's own `transcript.segment`, which the api already
  sends to the patient connection. #86 grew from S to M; the frontend lead assigns it.
- Decided by: 張棨翔 (PO)

## 2026-11-22 — Week 11 code steward handover (張棨翔 → 劉順松)
- Status: record
- What the steward did (Nov 16 – 22):
  - Approved four PRs with written reviews: #75 (吳普軒; ran the Python half of `check-cp2.sh` on the Linux
    workstation, found that `start-cp2.sh`'s `lsof` check misses root-owned listeners), #80 (劉順松; reran tests on
    the latest `main`, confirmed the new test fails on the unfixed code, agreed as backend lead), #81 and #82
    (林均澔).
  - While reviewing #81, found that the api dropped the recording because `recording.stop` arrives before the audio
    (#83); fixed in #84 (merged). While reviewing #82, found that recorded lines had no timestamps (#91).
  - PO decisions this week: extraction on Ollama with gemma3:1b by default and gemma4:e4b for official runs (#85),
    Whisper small by default and medium for official runs (A1, #90), prompt v5 for every field (#95), the patient
    screen entry above (#86).
- Open at handover (as of Nov 22): #85 was merged. #90, #91 and #95 await review; #95 replaces #92, which GitHub
  closed when #85's branch was deleted (#92 was stacked on it). #90 and #95 add entries at the top of this file, so
  whoever merges later keeps both sides. The `start-cp2.sh` port check is not fixed. #86 and #87 are assigned to
  吳普軒 but not started. #77's team session needs a slice other than #80, which is merged. Before E3
  (Nov 29): the two outside-team user sessions (0 of 2), walking skeleton and merge day, and regenerating
  `docs/cp2/Group01_CP2_Report.md`.
- Handover to 劉順松: no separate walk-through meeting; handed over through this entry and a LINE message.
- Recorded by: 張棨翔 (outgoing steward)

## 2026-11-22 — Whisper model size (A1, #6)
- Status: accepted
- Context: A1 asks for latency and CER of at least two Whisper sizes, including masked speech and medical terms.
  Measured with `eval/stt_benchmark.py`: one speaker, 18 fictional sentences, plain and masked, browser webm, the
  STT service's own settings (CPU int8). CER without punctuation and with numerals scored as values:
  tiny 0.35 / 0.31, base 0.22 / 0.20, small 0.15 / 0.13, medium 0.10 / 0.07 (plain / mask); median 0.4, 0.6, 1.7 and
  4.7 s per 6 s clip. Only medium handled the Taiwanese-accented sentence (CER 0.31; small 0.75). Every size
  misheard 瘻管 and 盤尼西林. Evidence: `docs/cp2/evidence/stt-2026-11-22/`.
- Decision: `small` stays the default (`WHISPER_MODEL`) for everyone's development and testing. Official runs on
  the workstation use `medium`, set in its own `.env`. STT should try the GPU first and fall back to the CPU when no
  GPU is available (#88). Medical vocabulary hints are tried separately, with a check for invented terms (#89).
- Consequences: on the CPU, medium makes a 30 s turn wait about 22 s, so official runs need #88 first. The lower
  masked CER is likely a practice effect (the mask round came second, one speaker); later speakers record the mask
  round first.
- Decided by: 張棨翔 (STT lead and PO)

## 2026-11-21 — Ollama as the extraction runtime (spike B2)
- Status: accepted
- Context: the CP2 model decision (entry below) needs Gemma models. On Transformers they need a Hugging Face licence
  and token on every machine and a CPU torch install; the 2026-10-27 stack entry left the runtime open (B2).
- Decision: the llm service calls Ollama (`/api/chat`, `temperature 0`, `format: json`) at `OLLAMA_URL`; the model is
  `LLM_MODEL`. torch and transformers are removed. `docker compose` runs `ollama/ollama:0.33.2` with the models in a
  volume, CPU by default, NVIDIA GPU with `docker-compose.gpu.yml`. The script path (`start-cp2.*`) needs a local
  Ollama. The llm service sends one warm-up extraction at start and reports `/ready` after it (even if it fails), and
  the web waits for that, because the first chat after Ollama loads a model took 38–89 s on the workstation.
  Thinking models (gemma4) get `think: false`, detected from Ollama's model capabilities: with thinking on, gemma4
  used the whole output budget reasoning and returned no answer, while `think: false` emptied gemma3's answers.
- Consequences: switching models is an `.env` change. The workstation's system Ollama (0.20.5) is too old for
  `gemma3:1b`, so the demo there uses the compose Ollama. Measured results: `docs/cp2/evidence/ollama-2026-11-21/`.
- Decided by: 張棨翔 (LLM lead)
## 2026-11-19 — CP2 dates from the published rubric
- Status: proposed (drafted by the AI Scrum Master; confirm in PR review)
- Context: the 2026-10-27 schedule entry records CP2 as "due Mon Nov 23 (team-confirmed)". The CP2 page published
  2026-11-19 says the Week 12 lab on Mon Nov 23 is peer review, where the prototype must be demonstrable, and the E3
  deadline is Sun Nov 29. The TA's CP2 guidance (2026-11-19) orders the team sessions: walking skeleton, then merge
  day, both before submission (worksheets in `docs/cp2/WALKING_SKELETON.md` and `docs/cp2/MERGE_DAY.md`; instructor originals in `docs/references/`).
- Decision: be demo-ready on Nov 23 and submit `Group01_CP2.zip` to E3 by Nov 29. This supersedes the CP2 date in
  "Two-week sprints and schedule". Deliverable checklist: `docs/cp2/Group01_CP2_Report.md`.
- Consequences: six extra days for the two outside-team user sessions and the per-member PR minimums.
- Decided by: (team to confirm)

## 2026-11-19 — #73 merged as the CP2 prototype base
- Status: accepted
- Decision: #73 (author 劉順松: persistent api, audit, local Whisper/Qwen adapters, prompt suite, CP2 docs) is merged
  into `main`. 吳普軒 approved it with a written review listing follow-ups (fixed in the follow-up PR).
- Context: #73 had no review before this, but its checklist marked "reviewed by another member" and "area lead
  reviewed". Checklist boxes are ticked only after the event happens.
- Process note: Claude Code ran the approve and merge commands on 吳普軒's explicit instruction, under their
  account. This departs from "AI agent as Scrum Master" (2026-10-08: the agent does not merge to `main`). The team
  should ratify or reject the amendment proposed in `AI_USAGE_GUIDELINES.md` §1.
- Consequences: the Qwen adapter is now on `main` while the model choice is still open (next entry). #74's conflict
  with #73 in `NurseSession.vue` was resolved on the #74 branch; 劉順松 then approved #74 with a written review
  (submitted by Codex on their instruction) and merged it the same day.
- Decided by: 吳普軒 (approver and merger)

## 2026-11-19 — Extraction model for CP2
- Status: accepted (PO 張棨翔: Gemma 3 1B in the #75 review on 2026-11-21; plan for Gemma-4 the same day)
- Context: CP1 and the 2026-10-27 stack entry chose Gemma-4, runtime TBD (spike B2). #73 ships a local CPU adapter for
  Qwen/Qwen2.5-0.5B-Instruct, chosen for a 4 GB-VRAM laptop. On 12 synthetic dev cases, v3 passes 8/12 whole cases.
  No Gemma-4 run exists.
- Options: (A) present Qwen 0.5B as the CP2 feasibility adapter, keep Gemma-4 as the CP3 target and rerun the same
  12 cases on it; (B) deploy Gemma-4 before Nov 23 and rerun the cases; (C) other.
- Decision: (C) `gemma3:1b` is the default (`.env.example`) for everyone's development and testing. Official runs
  (demos, evaluation sessions) use `gemma4:e4b`, set by 張棨翔 in the workstation's own `.env`. Qwen 0.5B is no
  longer used. Both run on Ollama (entry above). Prompt v3 stays the default; v4 is kept for comparison.
- Measured on the workstation, same 12 dev cases (v3 / v4): gemma3:1b 4/12 / 4/12, gemma3:4b 8/12 / 9/12,
  gemma4:e4b 10/12 / 9/12 (thinking off, about 0.2 s per case). gemma3:1b returns no fields for almost every case,
  so its AI draft is mostly empty; `gemma4:e4b` is one `.env` change away. v3's examples repeat three of the cases,
  which inflates v3 scores.
- Consequences: update `AI_USAGE_GUIDELINES.md` §1, `docs/cp2/PROMPT_CARD.md` and `docs/cp2/EVALUATION_REPORT.md`
  to match (before Nov 29).
- Decided by: 張棨翔 (PO and LLM lead)

## 2026-11-04 — CP2 local candidate (proposal, not team ratification)
- User-confirmed facts: 劉順松 (414551016) confirmed instructor topic approval and authorized local CP2 implementation. Team review precedes E3 upload, which remains the user's action.
- Implemented candidate: integrate existing frontend stack locally; persistent SQLAlchemy/Alembic API, audit and evaluation, whole-clip Whisper small CPU int8, Qwen/Qwen2.5-0.5B-Instruct CPU adapter and source-quote prompt v3. This is a reviewable implementation, not an assertion that other team members approved a new model or scope.
- Proposal for team: use the small CPU adapter for CP2 feasibility, retain manual fields and record its observed failures; alternatively deploy the planned model and rerun the same cases. Whole clips avoid invalid independent WebM fragments. Existing database decision is retained.
- Consequences: limited six-field extraction and unvalidated semantic accuracy; real external-user tests and individual PR/steward/session evidence remain outstanding. No hidden model substitution in evaluation.
- Human owner: 劉順松; led-by/team ratification: pending. See docs/cp2/Group01_CP2_Report.md and prompt-log/2026-11-04-414551016-cp2.md.
- Steward handover: README schedules Week 9 for 劉順松, but this run did not conduct a real handover. The old Current code steward line below is retained as stale pending actual human confirmation.

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
  `docs/archive/discharge-summary/` (removed 2026-11-24; still in git history).

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

## 2026-11-05 — Compact layout for staff screens (nurse, physician, admin)
- Status: accepted by the frontend lead
- Context: the nurse, physician and admin screens showed little information per screen. Heavy padding, 2 px borders, a box
  around every field and large buttons made them hard to scan; the nurse report was about 7,000 px tall on a tablet.
- Decision: staff routes are marked `compact` and use an 18 px base at every width (no 20 px tablet step), tighter line
  height and spacing, 1 px borders, and no box per field, list item or vital: report fields are rows (label and value on the
  left, status and actions on the right). The nurse's 就診號 and 返回清單 move into the role header. Entry and patient screens keep
  the 18/20 px sizes of the entry above. The full-width 「示範用途・僅使用模擬資料」 banner is removed on every screen to save
  space; the data stays simulated (`SIM-######` visit numbers, no personal information). Unchanged: nothing smaller than
  16 px, buttons at least 48 px tall, status shown with text and icon, high contrast.
- Consequences: amends the "Default text is large" part of the 2026-10-28 frontend entry for staff screens only, and the
  "demo / simulated data banner is always visible" rule in `docs/frontend/ARCHITECTURE.md`. Shared
  components tighten with the `compact:` Tailwind variant (`apps/web/src/style.css`). Whether 18 px reads well on the ward
  tablet is a pilot question (E9).
- Decided by: 吳普軒 (frontend lead)


## 2026-11-19 - AI failure handling, prepared as a candidate slice for the walking skeleton (#77, merged in #80)
- Status: proposed by the user-authorized Codex preparation; not a ratified team decision or attendance record.
- Context: malformed model JSON can crash extraction or be reported as success. #77 is the whole walking-skeleton
  session, not only this slice. Its Route 2 picks the next slice in order: something still faked or hard-coded, then
  the second user, and only then one AI failure state with fake-model tests. This entry covers only that third option,
  prepared in advance; it was merged in #80, so the session needs a different slice.
- Proposed decision: validate the response envelope before applying fields and reuse the existing recoverable nurse notification. Preserve transcript and manual workflow.
- Alternative rejected in this candidate: swallowing all exceptions or treating malformed envelopes as successful empty extraction.
- Human owner: 劉順松 (414551016); team acceptance and session lead remain pending.
- Evidence: services/api/tests/test_ai_failure.py (merged in #80). The four-person session, actual steward review and merged session PR remain outstanding.
