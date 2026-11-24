# Group01 - Checkpoint 2

**AI voice triage assistant** | CSIC30216 AI-in-the-Loop in Software Project Cycle, NYCU, Fall 2026

吳普軒 314553047 · 張棨翔 414551004 · 劉順松 414551016 · 林均澔 112550026

Repository: https://github.com/hwupu/115A-535527-AIDLC-Final

> DRAFT, 2026-11-24. Items marked **TODO(team)** must be filled in from real records before submission. Do not fill
> them with estimates.

## What the tool does

<!-- TODO(team): replace with the agreed sentence from Part 1 of docs/cp2/WALKING_SKELETON.md. -->
At the emergency-department triage desk, the tool listens to the nurse and patient, transcribes the conversation and
drafts a structured triage record (chief complaint, history, TOCC, vitals, measurement restrictions), with the
transcript quote behind every drafted field. The nurse checks, corrects and confirms each field and alone decides
the triage level (檢傷級數); the physician then reads the confirmed record. The AI never assigns a triage level,
gives medical advice or writes to a hospital system. Simulated data only.

**Does the tool use AI?** Yes: Whisper (speech to text) and a local Gemma model on Ollama (field extraction).

## Deliverables

The deliverables table, with the file for each item, is in [`README.md`](README.md) in this folder. The sections
below follow its numbering (1–10).

## 1. Working prototype

Four screens share one FastAPI backend and SQLite database, so different people on different browsers work on the
same visit:

- **Nurse:** starts a visit, records (or types) the conversation, reviews the AI draft field by field against its
  quote, edits, chooses the triage level and confirms. Can print the record in an ED-style layout (#99) or export it.
- **Physician:** sees only confirmed records, read-only, including the nurse's triage level.
- **Patient:** answers on their own screen by voice or text and never sees the AI draft (a step-by-step
  questionnaire is planned, #86).
- **Admin:** evaluation runs and JSON/CSV export.

Pipeline: browser recording → Whisper small (CPU, int8; whole clip after stop) → OpenCC to Traditional Chinese →
prompt v5 on Ollama (`gemma3:1b` by default, `gemma4:e4b` on the workstation) → quote and type checks → nurse review
→ confirmed record. Every nurse edit is stored with before/after values. If the model times out or returns broken
output, the nurse is told and finishes the record by hand (#80).

Run: `README.md` → 快速開始 (one script on macOS/Linux and Windows; Docker as an alternative). CI runs lint, type
checks, unit and integration tests and a Docker build on every PR.

**Week 12 lab (2026-11-23):** our status card was Track A, "our main task runs end to end". Group 03 used the prototype
and set it up from our README on a fresh Mac. Their four findings became issues (#86, #28, #97, #27); see §2.

## 2. Design rationale and user testing

Full text: `DESIGN_RATIONALE.md`. Key decisions and what shaped them (CP1 interviews, the Group 03 review in the Week 12
lab, and two nurses):

- **The nurse confirms every field and decides the triage level** (CP1 interviews; course safety boundary). AI text
  is labelled 「AI 草稿」 until confirmed; an unmentioned field stays empty rather than becoming "no".
- **Every drafted field carries its transcript quote**, so the nurse can check it in place. Quote containment does
  not prove the quote supports the field, so review stays mandatory.
- **Local models only** (Ollama, Whisper): no patient speech leaves the machine; the model is a setting.
- **Whole-clip transcription after stop** instead of streaming: a thinner path that works reliably end to end.

Outside-team sessions (protocol, form and scenario cards: `USER_TEST_PROTOCOL.md`, `USER_TEST_FORM.md`,
`SCENARIO_CARDS.md`):

Both participants are nurses outside the team. Ratings, 1 = strongly disagree, 5 = strongly agree: (1) the AI draft
made the triage record faster, (2) it was easy to tell AI drafts from confirmed fields, (3) I would use it at work.

| Session | Participant | Ratings 1/2/3 | Hardest part / what to change (Q4) | Main worry if it went live (Q5) | What we changed |
|---|---|---|---|---|---|
| U01 | 護理師 A | 5 / 5 / 5 | 「更正式的 PDF 格式，又或者對接醫院系統。」 (a more formal PDF, or hospital-system integration) | 「有沒有考慮到多台裝置負載的問題」 (load from several devices) | Printable ED-style record (#99); HIS integration out of scope; load test planned (#100) |
| U02 | 護理師 B | 5 / 5 / 5 | 「如果可以辨別對話的角色。」 (tell the speakers apart) | 「會比較在意資料摘要的精準度。」 (accuracy of the summary) | Speaker label per transcript line, correctable by the nurse (`DECISIONS.md` 2026-11-23, #102); held-out evaluation (#45) |

With two participants the 5/5 ratings are encouraging opinions, not a measured result.

<!-- TODO(team): the facilitator fills in, from the real forms: date, consent, scenario, whether they operated the prototype, observed problems. Write "not
recorded" where nothing was recorded. If these were questionnaire-only conversations, say so and run two real
sessions before Nov 29. -->

## 3. Evaluation (interim)

Full text: `EVALUATION_REPORT.md`. Summary:

- **Extraction:** prompt v5 on gemma4:e4b drafts 36 of 43 expected fields correctly across 14 development cases,
  10/12 whole cases on T01–T12, and no wrong yes/no, number or date. The laptop default gemma3:1b drafts only 8/43.
- **Speech:** Whisper small, character error 0.146 (plain) / 0.131 (masked) at 1.7 s per clip; medium is more
  accurate but about 3× slower on CPU.
- **Not tested yet:** time saved, nurse-reviewed accuracy on held-out cases, more than one speaker, load, and
  measured outcomes from outside users. All prompt cases are development cases.

## 4. System prompt and prompt documentation card

- `services/llm/prompts/v5.txt` is the prompt the app sends to the extraction model (v1–v4 kept for the test
  history).
- `CLAUDE.md` is the system prompt for our coding agent (Claude Code); `AGENTS.md` links to it for other tools.
- `PROMPT_CARD.md`: what the AI does, the model and settings, the validation steps, boundaries (no triage level,
  diagnosis or identifiers) and known failure modes (wrong field for a correct quote, corrections, small-model
  omissions).

## 5. AI usage guidelines

`AI_USAGE_GUIDELINES.md` v0.3. v0.1 was the Week 3 plan; v0.2 (Weeks 8–11) described how we actually worked, e.g.
AI agents may approve or merge only on a named human's explicit instruction (#73, #74). v0.3 (Week 12 lab) rewrites
three rules so a reviewer can check them from a PR: PRs of about 400 changed lines at most, an approval counts only
with a written comment, and every PR fills in the template's "AI assistance" section (#96, #98).

<!-- TODO(team): record in DECISIONS.md that all four ratified v0.3 (or what was changed). -->

## 6. Prompt test suite

`eval/cases.json`: 14 synthetic cases — typical visits, missing information, measured vs self-reported
temperature, corrections, prompt injection, a request for a triage level, mobility, empty input, a full S01 dialogue
(T13) and a Whisper-style run-on transcript (T14). Runner: `eval/run_prompt_suite.py`; raw outputs per run in
`docs/cp2/evidence/`.

Fail → fix → re-run: T01 failed under v2 (flat values rejected, 0/3 fields), passed under v3 after switching to
copied quotes (3/3; suite 4/12 → 8/12). The first v5 run truncated T13, turned 民國87 into 1997 and took a home
temperature as measured; after the JSON Schema, code-computed numbers/dates and the home-reading rule, the re-run
reached 36/43 fields with no wrong typed value.

## 7. DECISIONS.md

Entries from the project start (2026-09-21) through Week 12, each with context, decision, consequences and who
decided: topic, stack, steward rotation, model and runtime choices (Ollama, Whisper size, prompt v5), the patient
screen, speaker labels, and the Week 11 and Week 12 steward records. The Week 12 entry holds the merge-day plan.

<!-- TODO(team): Week 9 (劉順松) and Week 10 (林均澔) steward entries: what each actually did, or that the week was
missed. Add the walking-skeleton line and the merge-day outcome. -->

## 8. Contributions

Counted from GitHub on 2026-11-24 (merged PRs into `main`; approvals with a written comment).

| Member | Area lead | Merged PRs | Approvals with comment | Code steward |
|---|---|---|---|---|
| 吳普軒 | Frontend, CI, README | 12 (e.g. #54–#56, #70–#72, #74, #75) | #67, #68, #73, #85 | Week 8 |
| 張棨翔 | LLM, API, STT (PO) | 10 (e.g. #84, #85, #90, #91, #95, #99) | #54–#56, #75, #80–#82 | Week 11 |
| 劉順松 | Audit, evaluation metrics | 2 (#73, #80) | #74, #94–#96, #98 | Week 9 (not recorded), Week 12 (current) |
| 林均澔 | Scenarios, test data, docs | 2 (#81, #82) | #74, #75, #90, #91, #94 | Week 10 (not recorded) |

Reading the contributor graph: commits made with Claude Code carry a `Co-Authored-By` line, so GitHub also lists
Claude as a contributor (53 of 60 non-merge commits on `main` as of 2026-11-24). Every commit's author is one of the
four of us. 劉順松's main implementation (#73, 3,589 lines) arrived as a merge commit (it integrated the frontend
branches), and GitHub's graph does not count merge commits, so his graph line is smaller than his work; see #73.

<!-- TODO(team): re-count after merge day; add the contributor-graph screenshot as docs/cp2/contributor-graph.png. -->

## 9. Walking skeleton

The course asks for the worksheets at `docs/walking_skeleton.md` and `docs/merge_day.md`; we keep all course files
under `docs/cp2/` (filled worksheets) and `docs/references/` (the instructor's blank originals).

<!-- TODO(team): fill after the session (planned 2026-11-26). Date, attendees, the slice built, the merged PR link,
the steward's comment and the reflection are in docs/cp2/WALKING_SKELETON.md. -->

- Date and attendees: TODO(team)
- Merged PR: TODO(team)
- Biggest decision (also in `DECISIONS.md`): TODO(team)

## 10. Merge day

<!-- TODO(team): fill after the session. -->

- Date and attendees: TODO(team)
- Merge plan and outcome: `DECISIONS.md`, "Week 12 steward actions and future merge plan"
- Fresh-clone test (non-steward, README only): TODO(team)
- Worksheet: `docs/cp2/MERGE_DAY.md`

## Known gaps

<!-- TODO(team): list honestly whatever is still open at submission. -->

## AI use in this checkpoint

Claude Code and Codex helped write code, tests and documents; each AI-assisted PR has a `prompt-log/` entry and an
"AI assistance" section. Humans reviewed and merged every PR and are responsible for what was kept.
