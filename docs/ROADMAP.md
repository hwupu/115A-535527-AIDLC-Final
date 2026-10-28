# Roadmap: Week 8 → DEMO Week 16

Status: **proposal, team to confirm the item-level plan.** Sprint length (2 weeks),
start (Week 9), buffer (Week 15) and CP dates were set by the team on 2026-10-27
(see `DECISIONS.md`). Item IDs (P1, B2, ...) are in the issue titles on the board. The handoff's
backlog and sprint plan are superseded by the board and this file.

## Fixed dates

| Milestone | Date | Weight |
|---|---|---|
| CP1 Discovery | past; submission status to confirm | 5% |
| **CP2 Building** (walking skeleton, prototype, test suite, peer review) | **Mon Nov 23** (start of Week 12) | 15% |
| **CP3 Synthesising** (evidence, final report, presentation prep) | **Mon Dec 14** (start of Week 15) | 12% |
| **Week 16 class: DEMO** | **Mon Dec 21** | |
| Final deliverables: demo video + peer evaluation | after Week 16 class (page says Dec 21; confirm whether later) | |

Demo format (course page): a **90-second lightning talk** (each member one sentence on
problem, tool, evidence) and a **40-minute poster and demo session** with the running demo,
poster, and evaluation evidence visible. The 5–7 minute script in `docs/SCENARIOS.md` §4
must be adapted into a poster-station demo (F6).
Course checkpoint requirements beyond the page summary are still to be read on the course site.

## Calendar (2-week sprints)

| Sprint | Weeks | Dates | Theme | Deadlines inside |
|---|---|---|---|---|
| **S0** | 8 | Oct 26 – Nov 1 | Setup: repo, GitHub Project, decisions, plan | |
| **S1** | 9–10 | Nov 2 – Nov 15 | Foundations + walking skeleton | |
| **S2** | 11–12 | Nov 16 – Nov 29 | Reviewable draft, traceability, harness | **CP2 Mon Nov 23** |
| **S3** | 13–14 | Nov 30 – Dec 13 | Safety, pilot, evaluation | **CP3 Mon Dec 14** |
| **Buffer** | 15 | Dec 14 – Dec 20 | Bug fixes, analysis, write-up, poster, rehearsals | feature freeze |
| **DEMO** | 16 | Mon Dec 21 | Lightning talk + poster/demo session | |

Sprint Planning on the first Monday of each sprint (Nov 2, Nov 16, Nov 30); Review and
Retrospective on the last day (Nov 15, Nov 29, Dec 13). Week N starts Oct 26 + 7×(N−8).

## Sprint plan

Items, owners, sizes and acceptance criteria are GitHub issues; filter the board by Sprint.
Keep about 20% buffer; velocity is unknown.

| Sprint | Goal | Exit criteria |
|---|---|---|
| S0 (Week 8) | Setup | repo and board ready; plan confirmed. Spikes A1 (Whisper) and B2 (Gemma-4) may start early; they are on the critical path |
| S1 | Walking skeleton | `docker compose up` runs the stack; scenario S01 works end to end (speak → transcript → draft JSON → UI); a second member can run it from scratch; spike results in `DECISIONS.md` |
| S2 | Reviewable draft | nurse can edit fields; JSON valid on dev scenarios; harness reports baseline metrics; 10 scenarios nurse-reviewed; **CP2 submitted Nov 23** |
| S3 | Safety, pilot, evaluation | safety tests pass; pilot done in Week 13; minimum-evidence data collected by about Dec 11; **CP3 submitted Dec 14** |
| Buffer (Week 15) | Freeze and polish | blocker fixes only; analysis and write-up finished; poster and two rehearsals; `main` demo-ready |
| Week 16 | DEMO | demo, demo video, peer evaluation submitted |

Deferred by default (labelled `deferred`, no sprint): B6 incremental drafting, A4 speaker
separation, P4 HTTPS, C9 ergonomics. They are listed in the scope levers below.

## Code steward rotation

Weekly, independent of sprint length. The schedule and handover rules are in `README.md` (single source); the current steward is named at the top of `DECISIONS.md`.

## Critical path

B2 and A1 spikes → P1 compose skeleton → B3 / A2 / D1 → C4 → E4 / E5 harness → E9 pilot (Week 13) → E10 (Week 14) → E11 / F4 → CP3.
Start nurse recruitment (E8) in S2; the pilot cannot slip past Week 13 because CP3 is due Dec 14.

## Scope levers (cut in this order if the schedule slips)

Already deferred: B6, A4, P4, C9. Next: C10 evaluation mode → stopwatch and spreadsheet;
D4 pub/sub → polling; B5 RAG spike → default "no RAG" and log it.
Protect: B3/B4, C4/C5, E4, D2, and the boundary guard test (B8).

## Risks

- **S1 is overloaded:** it merges two planned sprints, and 張棨翔 owns most of it. Area leads check workloads at Sprint Planning (Nov 2) and reassign or cut (see README).
- **CP2 lands one week into S2**, so the walking skeleton, a test suite and PR peer reviews must exist by about Nov 20.
- **CP3 is due the day Week 15 starts**, so evaluation data must be collected by about Dec 11. Week 15 is buffer, not extra data-collection time.
- GPU and hardware for Gemma-4 and Whisper (spikes first); STT on Taiwanese-accented speech and masks.
- Demo reliability: keep pre-recorded audio fixtures as a fallback.
- Nurse availability: recruit in S2; say honestly if the evidence threshold is missed.
- Scope creep: HIS integration and diagnosis support stay out of scope.

## Needs a human answer

1. Item-level assignments are a starting point; area leads reassign (see README).
2. CP1 submission status; whether final deliverables are due after the Week 16 class.
3. Confirm shadcn-vue, GPU availability, demo environment.
4. Tie-break rule, response-time norm, and the remaining language details (issue/PR wording, comments).
5. The proposed scope cuts above.

## Repo setup status

- [x] GitHub Project, labels, milestones: see `docs/SCRUM.md`
- [x] Branch protection on `main` (ruleset: PR + 1 approval, no force-push or deletion; TAs can see the repo, it is public)
- [x] Issues for all items, with owner, sprint, size, epic (GitHub Project is the single source)
- [ ] CP1 submission, cleaned interview notes (remove `[cite: 1]`)
