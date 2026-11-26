# Group01 - Checkpoint 2

**AI voice triage assistant** | CSIC30216 AI-in-the-Loop in Software Project Cycle, NYCU, Fall 2026

吳普軒 314553047 · 張棨翔 414551004 · 劉順松 414551016 · 林均澔 112550026

Repository: https://github.com/hwupu/115A-535527-AIDLC-Final

> Review package, 2026-11-26. Known unfinished requirements are disclosed in the final section and SUBMISSION_STATUS.json. This report does not certify joint attendance or final submission readiness.

## What the tool does

> Our tool helps emergency triage nurses to finish the intake record once and hand the physician a complete report by
> turning the nurse–patient conversation into a draft with quotes from it that the nurse checks and confirms, while
> the nurse still decides 檢傷級數. (Agreed by all four, walking skeleton Part 1.)

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
- **Patient:** answers on their own screen by voice or text and never sees the AI draft (step-by-step questions, #109; checklist and keyboard shortcuts restored to main by #123).
- **Admin:** evaluation runs and JSON/CSV export.

Pipeline: browser recording → Whisper small (GPU if startup succeeds, otherwise CPU int8; whole clip after stop) → OpenCC to Traditional Chinese →
prompt v5 on Ollama (`gemma3:1b` by default, `gemma4:e4b` on the workstation) → quote and type checks → nurse review
→ confirmed record. Every nurse edit is stored with before/after values. If the model times out or returns broken
output, the nurse is told and finishes the record by hand (#80).

Run: `README.md` → 快速開始 (one script on macOS/Linux and Windows; Docker as an alternative). CI runs lint, type
checks, unit and integration tests and a Docker build on every PR.

**Week 12 lab (2026-11-23):** our status card was Track A, "our main task runs end to end". Group 03 used the prototype
and set it up from our README on a fresh Mac. Their four findings became issues (#86, #28, #97, #27); see §2.

## 2. Design rationale and user testing

Full text: `DESIGN_RATIONALE.md`. Key decisions and what shaped them (CP1 interviews, the Group 03 review in the Week 12
lab, and four outside-team participants):

- **The nurse confirms every field and decides the triage level** (CP1 interviews; course safety boundary). AI text
  is labelled 「AI 草稿」 until confirmed; an unmentioned field stays empty rather than becoming "no".
- **Every drafted field carries its transcript quote**, so the nurse can check it in place. Quote containment does
  not prove the quote supports the field, so review stays mandatory.
- **Local models only** (Ollama, Whisper): no patient speech leaves the machine; the model is a setting.
- **Whole-clip transcription after stop** instead of streaming: a thinner path that works reliably end to end.

Outside-team sessions (protocol, form and scenario cards: `USER_TEST_PROTOCOL.md`, `USER_TEST_FORM.md`,
`SCENARIO_CARDS.md`):

Four people outside the team (U03 a nurse, U04 a physician, U01 and U02 neither), in two runs of scenario S03:
each pair had one at the nurse screen and one playing the patient, facilitated by the PO (U01/U02 on 2026-11-23,
U03/U04 on 2026-11-24). Ratings, 1 = strongly disagree, 5 = strongly agree: (1) the AI draft
made the triage record faster, (2) it was easy to tell AI drafts from confirmed fields, (3) I would use it at work.

| Participant / role | Ratings 1/2/3 | Feedback and follow-up |
|---|---|---|
| U01: other profession, nurse screen | 5 / 5 / 5 | Formal printout (#99); HIS excluded; multi-device load remains #100. |
| U02: other profession, patient role | 5 / 5 / 5 | Correctable speaker labels (#102); summary accuracy needs held-out evaluation (#45). |
| U03: nurse, nurse screen | 4 / 5 / 5 | STT waiting time led to GPU fallback (#117); HIS excluded. |
| U04: physician, patient role | 5 / 5 / 5 | Fewer confirmation steps (#113); TTAS reference proposal accepted only with the safeguards in DECISIONS.md; implementation and clinical checks remain separate (#115). |

Original anonymized answers are retained in USER_TEST_PROTOCOL.md and DESIGN_RATIONALE.md. Four participants took part in two paired runs, not four independent task runs.

Measured in the two runs (demo database): start to confirm 5 min 02 s and 3 min 28 s; AI drafts against the S03
answer key 14/17 and 18/19 correct, none filled although not said. One safety finding: STT heard 血壓 as 「斜壓兩」
and systolic BP became 2; the nurse confirmed it and corrected it eleven seconds later. The facilitator saw hesitation
while waiting for the AI draft (partial drafts, #112) and at the misspelled 瘻管 (#89). Without a paper baseline these
are observations, not time saved. Details: `USER_TEST_PROTOCOL.md`, `EVALUATION_REPORT.md`.

## 3. Evaluation (interim)

Full text: `EVALUATION_REPORT.md`. Summary:

- **Extraction:** prompt v5 on gemma4:e4b drafts 36 of 43 expected fields correctly across 14 development cases,
  10/12 whole cases on T01–T12, and no wrong yes/no, number or date. The laptop default gemma3:1b drafts only 8/43.
- **Speech:** Whisper small, character error 0.146 (plain) / 0.131 (masked) at 1.7 s per clip; medium is more
  accurate but about 3× slower on CPU.
- **Not tested yet:** time saved, nurse-reviewed accuracy on held-out cases, more than one speaker, load, and
  time saved for outside users (two runs, no paper baseline). All prompt cases are development cases.

## 4. System prompt and prompt documentation card

- `services/llm/prompts/v5.txt` is the prompt the app sends to the extraction model (v1–v4 kept for the test
  history).
- `CLAUDE.md` is the system prompt for our coding agent (Claude Code); `AGENTS.md` links to it for other tools.
- `PROMPT_CARD.md`: what the AI does, the model and settings, the validation steps, boundaries (no triage level,
  diagnosis or identifiers) and known failure modes (wrong field for a correct quote, corrections, small-model
  omissions).

## 5. AI usage guidelines

`AI_USAGE_GUIDELINES.md` v0.3, approved by the team on 2026-11-24 (`DECISIONS.md`). v0.1 was the Week 3 plan; v0.2 (Weeks 8–11) described how we actually worked, e.g.
AI agents may approve or merge only on a named human's explicit instruction (#73, #74). v0.3 (Week 12 lab) rewrites
three rules so a reviewer can check them from a PR: PRs of about 400 changed lines at most, an approval counts only
with a written comment, and every PR fills in the template's "AI assistance" section (#96, #98).

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
screen, speaker labels, Whisper on the GPU, the TTAS reference level by rule table, keeping the current exports,
no RAG, and the Week 8-12 steward records (Week 10 had no pull requests, #119). The Week 12 entry holds the
merge-day plan and outcome.

Week 9 is now recorded late from evidence: implementation and #73 were created Nov 4, but no Week 9 formal review by 414551016 was found across all 40 PRs. No completed Week 9 steward term is claimed. The single README/course-folder organization was explicitly confirmed by 劉順松 on Nov 26.

## 8. Contributions

Audited from all 40 repository PRs and formal review records on 2026-11-26, through main 924d688. Counts below are PRs authored and merged with base main; documentation is included. Written approvals are repository evidence, not certification of substantive human review or course credit. Reverted and restored PRs (#122/#123) remain in historical counts.

| Member | Merged main PR count | Written approval examples | Steward record |
|---|---|---|---|
| 吳普軒 | 16 | #67, #68, #85, #117 | Week 8 recorded late; handover not recorded |
| 張棨翔 | 14 | #80, #81, #82, #109 | Week 11 recorded |
| 劉順松 | 3 | #74, #94-#96, #98, #114, #120, #124 | Week 9 unverified execution; Week 12 recorded |
| 林均澔 | 3 | #74, #75, #90, #91, #94 | Week 10 recorded late; no approvals that week |

Evidence: evidence/closeout-2026-11-26/repository-review-audit.json. 劉順松's two code PRs are #73 and #80; #103 is documentation. Approvals executed with Codex assistance on explicit instructions remain disclosed as such.

The GitHub contributor graph was recaptured on 2026-11-26 after the merge-day PRs (#126, #127, #129) merged: claude 81 commits (+21,605 / -4,738), hwupu 52 (+17,765 / -4,054), XiangLibra 30 (+4,296 / -684), 414551016 9 (+1,015 / -270), junlinwk 5 (+688 / -74) and LSS-580812 5 (+74 / -37). These are displayed GitHub identities, not six human team members. Co-author attribution and excluded merge commits make this different from PR counts; identities are not combined without verified mapping. Screenshot: CONTRIBUTOR_GRAPH.png. It is a dated snapshot and will not include this closeout PR.

## 9. Walking skeleton

The course asks for the worksheets at `docs/walking_skeleton.md` and `docs/merge_day.md`; we keep all course files
under `docs/cp2/` (filled worksheets) and `docs/references/` (the instructor's blank originals).

No completed four-person technical session is evidenced in the records available at this review. The worksheet retains the members' actual entries and uncompleted fields.

- Technical slice / four-person activity: not completed or verified in this review.
- #80 is prior AI-failure work and is not counted again as a new session slice.
- #120 is a merged interim documentary record, not a substitute for the required technical session. Instructor acceptance of that substitution has not been recorded.
- Follow-up: #106; use the instructor worksheet and record actual times, participant actions, non-author explanations, review, author reply and reflection.

## 10. Merge day

The merges happened as reviewed PRs into `main` (2026-11-21 to 11-26); the four of us then met for merge day on
2026-11-26 (participant-reported in #126 and #129; see `MERGE_DAY.md`). The record takes each member's last main feature: #80 (劉順松), #82 (林均澔), #117 (張棨翔) and #123 (吳普軒), with
three drivers and CI green on every merge commit. One finding: #110 (#87) and #111 (#28) were approved but merged
into stacked branches after their base had reached `main`, so they missed `main` until #123.

- Merge plan and outcome: `DECISIONS.md`, "Week 12 steward actions and future merge plan"
- Fresh-clone test (non-steward, README only): participant-reported in #126. Each member, including the non-stewards, ran nurse confirmation -> physician read from the README on their own machine. Individual run details (times, clone revision) are not attached.
- Worksheet: `docs/cp2/MERGE_DAY.md`

## Known gaps

- The four-person merge-day meeting and the fresh-clone test are participant-reported (#126, #129); individual run details are not attached.
- The walking-skeleton technical slice is still open. #120 is a documentary record, and the instructor has not approved it as a substitute (#106).
- On this laptop Ollama is not reachable at 127.0.0.1:11434 as checked Nov 26; no new real-model run is claimed.
- Week 9 steward execution is unverified; the historical record does not retrospectively satisfy an individual threshold. Team/instructor action is needed if alternative credit is sought.
- User-test timing and provisional AI grading were reported by the facilitator; exact Nov 23 commit and historical N-xx mapping remain unrecorded. Nurse verification of grading, held-out evaluation and paper baseline are not completed.
- TTAS reference implementation (#115), load testing (#100), medical vocabulary and draft-streaming follow-ups are tracked separately. No clinical deployment or safety certification is claimed.
- This closeout PR needs another teammate's review. Whole-team ZIP review and E3 upload have not happened in this run. See CLOSEOUT_STATUS.md and SUBMISSION_STATUS.json.

## AI use in this checkpoint

Claude Code and Codex helped write code, tests and documents; the current closeout logs the assistance in `prompt-log/` and its PR description. Historical gaps are disclosed in AI_USAGE_GUIDELINES.md; not every historical PR has complete disclosure. Formal reviews and merges may be executed by an AI agent on explicit human instruction. This is not evidence of independent human reading, joint attendance or consensus.
