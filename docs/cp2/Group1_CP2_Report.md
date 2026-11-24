# Group1 - Checkpoint 2 Review Report

AI Voice Triage Handoff Assistant | CSIC30216 | Updated 2026-11-24

吳普軒 314553047; 張棨翔 414551004; 劉順松 414551016; 林均澔 112550026

**REVIEW CANDIDATE - required human evidence remains pending. Not submitted to E3.**

Repository: https://github.com/hwupu/115A-535527-AIDLC-Final

Official requirements: https://csic30216-fall26.denniswang.net/project/cp2/

Deadline: Sunday 2026-11-29, end of day. The Week 12 peer review was scheduled for November 23. This report updates the November 4 technical candidate; it does not imply the later shared activities have happened.

## 1. Product, workflow and implementation

The prototype addresses duplicate triage documentation and incomplete nurse-to-physician handoff, grounded in two CP1 interviews. The reported extra 2-3 minutes was an interview estimate, not a measured baseline. CP1 interviews are not CP2 prototype usability sessions.

| Component | Current behavior |
|---|---|
| Shared web workflow | Patient, nurse, physician and evaluation interfaces; real session API; nurse checks and confirms fields before the doctor reads the report |
| Persistence | SQLAlchemy/SQLite with Alembic; before/after nurse edits, confirmation and evaluation events; active-session deletion |
| Speech | Whole MediaRecorder clips processed after stop; Whisper small default, medium for recorded workstation comparisons; OpenCC conversion and timestamps |
| Extraction | Local Ollama; gemma3:1b default, gemma4:e4b in recorded workstation experiments; prompt v5 for all allowed fields; older v1-v4 retained |
| Validation | Known-field schema and source containment; nurse ownership; numeric label/date/home-reading guards added during #95 review |
| Export | Confirmed report text/JSON and ED-style printout (#99); evaluation JSON/CSV |

The nurse alone assigns triage level. AI does not diagnose, recommend treatment or write to a real HIS. Roles are demonstration interfaces, not authentication. Use localhost and fictional data only. Source containment does not prove semantic correctness; every draft requires review. The Qwen2.5 CPU adapter was the earlier November 4-21 implementation, not the current Ollama model.

## 2. Evaluation evidence and its limits

| Evidence | What it supports and does not support |
|---|---|
| November 4 Qwen development suite | v2 4/12 and v3 8/12 whole-case passes; shape failure led to copied quotes plus adapter; historical, not Gemma results |
| November 22 Ollama experiments | gemma4:e4b v3 10/12, v4 9/12, v5 10/12 on T01-T12; raw outputs in docs/cp2/evidence; T13/T14 expand full-field development coverage |
| v5 field scoring | 36/43 in the recorded run uses exact typed values but loose free-text presence/grounding; this is not semantic or clinical accuracy |
| November 24 guard regression | Labelled numeric matching, invalid-calendar-date rejection and home-vital filtering. Integrated API/eval 26 tests and LLM 29 passed before closeout document work |
| Speech comparison | One-speaker plain/masked comparison recorded by the team: medium reduced CER on those fixtures; ordering/practice and small sample limit inference |
| Current closeout validation | 134 tests passed (web 76, API 23, STT 3, LLM 29, metrics 3), plus lint/typecheck/build. Exact exit status, source scope and warnings are recorded in evidence/2026-11-24-closeout/verification.json; do not substitute historical checks for current ones |

The 2026-11-22 real-model outputs predate the new numeric/date guards. No new Gemma run or current accuracy claim is made by this closeout. The small default model often omits fields; tests are development cases, not held-out clinical validation. Unit tests use explicit fake model transport. Browser contexts and synthetic audio are not human user research. Human time saving, error catch rate and safety remain unestablished.

The revised evaluation plan proposes a low-burden CP2 tool task plus feedback and a separate non-author fresh-copy check, based on Group03 setup feedback (#97). Formal counterbalanced paper-versus-tool timing remains CP3 work; proposals need human confirmation.

## 3. U01 and U02: reported feedback, incomplete metadata

#94 and #101 report two questionnaire records, labelled U01 and U02. Both gave 5/5/5 for perceived speed, draft visibility and willingness to use. These ratings are subjective, with only two respondents; they do not establish measured improvement or broad acceptance.

| Reported feedback | Response and current status |
|---|---|
| U01: more formal PDF / hospital-system integration | #99 printout implemented; retest unknown. Direct HIS writes remain excluded |
| U01: several devices at once | #100 load testing proposed; no new load result claimed |
| U02: distinguish speaker roles | #102 content-based labels with nurse correction proposed; voice diarization deferred |
| U02: summary accuracy | #45 formal evaluation and #89 vocabulary work; source checks alone do not establish accuracy |

Participant backgrounds, outside-team confirmation, actual dates, consent, task/scenario, version, observed behavior and assistance have not been supplied. The preparation author did not witness these sessions. Until the facilitator confirms them, the two qualifying outside-team prototype sessions are not fully evidenced.

USER_TEST_FOLLOWUP.md separates the existing quotes from every missing field. Use actual forms/logs; write not recorded where necessary. If the contacts were feedback-only conversations, report them honestly and arrange replacement prototype sessions if feasible. The API accepts N-xx participant codes; U01/U02 are document labels and their historical mapping is unknown. No missing date, consent or observation is invented.

## 4. Collaboration, review and decisions

| Member | Merged code examples | Written approval examples |
|---|---|---|
| 吳普軒 | #56, #70, #71, #74 | #73, #85 |
| 張棨翔 | #84, #85, #91, #95 | #80, #81, #82 |
| 劉順松 | #73, #80 | #74, #94, #95, #96, #98 |
| 林均澔 | #81, #82 | #75, #90, #91, #94 |

Formal review snapshots and links are in COLLABORATION.md and evidence/2026-11-24-closeout/review-snapshot.json. These replace stale November 19 counts. The instructor assesses substantive contribution and actual steward service; empty approvals do not count, and a written review alone does not prove role timing or personal understanding.

Week 11 handover is recorded. 劉順松 is current Week 12 steward; observed agent-assisted review/correction/approval/merge actions are dated in DECISIONS.md. Week 9 and Week 10 historical execution evidence remains unprovided. AI assistance is disclosed, not represented as independent student authorship or other members' actions.

#96 updates the PR template; #98 adds checkable AI rules. Proposed clauses remain pending human ratification. #94/#95/#96/#98 are merged, but those agent-assisted merges are not the required four-member merge-day session.

Walking skeleton (#77) is planned for Thursday 2026-11-26, time unconfirmed. 劉順松 plans to operate locally and accompany the online session; teammates support facilitation and integration. This is not completed attendance. All four must trace the path, build the next slice, review together and record reflections. #80 was already merged preparation, not that event. Merge day (#78) follows, including a fresh-copy run by a non-steward. Teacher worksheets remain blank until the actual sessions.

## 5. Reproduction, handoff and remaining submission work

README.md contains the single quick start. Install Git, Node 24/pnpm, Python 3.12/uv and local Ollama; pull the selected model. Use start-cp2.sh --setup on macOS/Linux or start-cp2.ps1 -Setup on Windows. Script-launched Python services use process environment variables; Compose and Vite read .env according to their configuration. Keep every local model run's actual model, prompt and revision.

CLOSEOUT_STATUS.json keeps unresolved human-evidence gates explicit. The packaging script includes the repository link, source, report Markdown/PDF, checksums and review status. Default output is a review candidate; --require-complete refuses a final-mode package while required evidence is pending. A successful archive/hash check is not proof of user studies or collaboration.

Before E3: facilitator completes real U01/U02 evidence; four members conduct walking skeleton then merge day; confirm policy/evaluation proposals and personal steward evidence; a non-author validates README on a fresh copy; review the final report and exact ZIP; confirm group naming and uploader; submit to E3 before November 29 ends. No E3 upload has been performed here.

AI disclosure: Codex assisted implementation, tests, reviews and document preparation at 劉順松's request. Humans retain acceptance and authorship responsibility, must understand retained work, and supply actual research/activity evidence. This report does not certify clinical deployment readiness.
