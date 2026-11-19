# Group1 - Checkpoint 2

## AI Voice Triage Handoff Assistant

### LOCAL REVIEW CANDIDATE - HUMAN EVIDENCE PENDING

Group1 
<br>Prepared: 2026-11-04 | Course: CSIC30216 | 
<br>吳普軒 | 314553047 
<br>張棨翔 | 414551004 
<br>劉順松 | 414551016
<br>林均澔 | 112550026


The user confirmed instructor approval of the topic. This package contains a locally runnable technical candidate, reproducible machine tests, prompt revision evidence and a plan for required human evaluation. It has not been submitted to E3 or approved/merged by the team.

### Problem and intended outcome

Triage nurses describe writing notes and re-entering them later; physicians receive incomplete handoffs and re-ask questions. The tool transcribes a simulated conversation, proposes source-linked fields, asks the nurse to review, and lets the physician read the confirmed record in a separate browser.

### Evidence boundary

The two CP1 interviews establish discovery context. They are not prototype usability sessions. No external-user CP2 session was conducted during this run. The reported extra 2-3 minutes per patient is an interview estimate, not a measured baseline. No time-saving or clinical-safety claim is made.

Repository: https://github.com/hwupu/115A-535527-AIDLC-Final

Official CP2: https://csic30216-fall26.denniswang.net/project/cp2/

## 1. What the candidate implements

| Component | Implemented behavior |
| --- | --- |
| Vue interface | Upstream patient, nurse, doctor and admin workflow integrated locally from the existing PR stack; upstream authorship is preserved. |
| Session API | Real shared session lifecycle, SIM visit numbers, source fields, per-field edits and confirmation, ETag list polling and read-only confirmed reports. |
| Persistence / audit | SQLAlchemy SQLite records and initial Alembic migration. Before/after field values and confirmation events persist; active-session deletion removes linked active records. |
| Speech | Real MediaRecorder whole clips, CPU int8 Whisper small and OpenCC s2twp. Audio is decoded in memory; no default audio persistence. |
| AI | Local Qwen/Qwen2.5-0.5B-Instruct CPU adapter. v3 selects literal quotes for six fields; deterministic grounding and API validation follow. |
| Evaluation / export | Anonymous run codes, task timing/events, JSON/CSV and confirmed-report JSON/text export. |

The nurse owns the triage decision. AI never writes that field. The physician report endpoint returns 409 until confirmation. No clinical alerts, diagnosis, treatment or HIS integration are claimed. Fields outside the small v3 extraction scope remain manually editable.

Local access is not authentication. Roles are demo routes and anyone with API access can impersonate them. Bind to localhost and use fictional data only. The original Gemma-4 runtime is not deployed or benchmarked; Qwen is a local validation proposal requiring team ratification.

## 2. Verification and scope of evidence

| Check | Observed evidence |
| --- | --- |
| Frontend | 34 tests, plus lint, typecheck and production build; logs in evidence/. |
| Backend / model guards | API workflow, persistence, audit, confirmation, invalid input, ETag, evaluation lifecycle and deletion. Model transport is mocked in unit tests; real inference is separate. |
| Browser | Two independent nurse/doctor contexts, two tablet dimensions, actual-model typed-input path and synthetic-microphone MediaRecorder/Whisper path. See browser-tests.json. |
| Prompt | 12 synthetic development cases; v2 4/12, v3 8/12 whole cases passing. |
| Speech | One local Hanhan synthetic TTS clip. tiny/base misrecognize travel history; small recovers the intended content with punctuation differences. |
| External users | NOT CONDUCTED. No measured human task-time or handoff-question outcome. |
| Docker | Configuration checked separately; daemon/build not verified in this run. Windows direct launch is the tested path. |

Final command checks recorded: 11; nonzero exits: 0. Consult logs for exact counts and warnings; passing these checks does not replace human evaluation.

The browser actions are automation of simulated roles, not real two-person user research. TTS is not a consenting real speaker. The small development suite is neither held out nor nurse-reviewed.

## 3. Prompt revision and honest results

Observed failure: v2 asked for nested objects containing value and source_span. On T01, the model returned flat values; validation rejected them and none of the three reference fields matched.

Change: v3 explicitly asks the model to copy raw phrases. A deterministic adapter checks exact quote containment and normalizes selected field types. T01 then matched cough, yesterday and negative travel history (3/3). Both versions and raw outputs are preserved; no failures were deleted.

| Case | Type | v3 outcome |
| --- | --- | --- |
| T01 | typical | PASS |
| T02 | typical | FAIL - reference mismatch / misclassification |
| T03 | edge | FAIL - reference mismatch / misclassification |
| T04 | typical | PASS |
| T05 | safety | PASS |
| T06 | correction | FAIL - invalid output |
| T07 | safety | PASS |
| T08 | injection | PASS |
| T09 | boundary | PASS |
| T10 | typical | PASS |
| T11 | empty | PASS |
| T12 | edge | FAIL - reference mismatch / misclassification |

8/12 whole-case passes include empty/safety abstentions; this is not 90% field accuracy. T02/T12 classify travel as chief complaint, T03 differs from the strict expected wording, and T06 fails correction parsing. Source containment is necessary but not proof that a quote supports its assigned field. Human review remains essential.

## 4. External-user evaluation plan

Required before CP2: conduct at least two prototype testing sessions with real users outside the team. Record anonymous role, actual date, consent, software version, task, observations and design changes. The blank protocol is in docs/cp2/USER_TEST_PROTOCOL.md.

Use fictional matched cases: baseline paper note plus simulated record entry versus this tool, with the same complete-handoff stopping point. Counterbalance method order across participants. Include manual fallback and failures in time measurements rather than excluding them.

| Measure | How it will be reported |
| --- | --- |
| Time saving | Raw baseline and tool seconds per participant; median/range; (baseline-tool)/baseline. NOT MEASURED yet. |
| Handoff quality | Missing/wrong fields and repeated clarification questions; actual examples and their consequences. NOT MEASURED yet. |
| Interaction design | Observed confusion, assistance needed, changed design and retest. No invented quotes. |
| HPI scoring | Nurse-reviewed key-element rubric per scenario. NOT FINALIZED. |

Complete these results before replacing the current missing-evidence statement. CP1 interviews and screenshots cannot substitute for these sessions. The original 30% time reduction and 90% field targets remain proposed goals.

## 5. Team review and submission checklist

| Item | Next human action |
| --- | --- |
| Model / design | Ratify or replace CPU Qwen adapter and restricted-field scope. Review actual failures and safety limits. |
| Individual contributions | Each of four students needs two substantive merged code PRs by CP2. This local uncommitted work is not proof for all members. |
| Steward reviews | Each student needs two approvals with substantive comments and at least one recorded steward term. AI does not approve PRs. |
| Walking skeleton | Four actual participants, code touched by each, merged PR link. This run did not conduct the mandatory joint session. |
| Merge day | Actual Week 11 meeting, dependency/conflict plan, stable main and DECISIONS entry. Do not prefill attendance/results. |
| External testing | At least two actual sessions and findings integrated into design rationale/evaluation. |
| E3 | One Group1_CP2 ZIP with repository-link text. |

Run scripts/start-cp2.ps1 -Setup to launch; scripts/check-cp2.ps1 for checks. Read README_CP2.md and the Traditional-Chinese START_HERE guide. The review ZIP excludes .env, .git, model weights, local database, virtual environments and installed tools. Review source, machine evidence and hashes before upload.

### Status: TECHNICAL CANDIDATE COMPLETE FOR REVIEW; FULL CP2 HUMAN EVIDENCE STILL OUTSTANDING.
