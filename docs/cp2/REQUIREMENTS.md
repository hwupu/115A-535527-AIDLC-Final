# CP2 evidence matrix - checked 2026-11-24

Official requirements: https://csic30216-fall26.denniswang.net/project/cp2/
E3 deadline: Sunday 2026-11-29, end of day. One GroupXX_CP2 ZIP with a plain-text repository link. Group1 uses Group01_CP2 pending final team confirmation. Product and collaboration each carry 50 points.

| Requirement | Points | Current evidence and remaining work |
|---|---|---|
| Working two-person prototype | 15 | Merged #73 and subsequent fixes; real shared API and confirmed doctor view. Automated role tests exist. Human fresh-machine run still pending |
| Design rationale and at least two outside-team user sessions | 10 | #94/#101 U01/U02 questionnaires and changes recorded. Date, role, consent, outside-team confirmation and task observations not yet supplied; not fully evidenced |
| Interim evaluation report | 10 | Updated report distinguishes old Qwen, Gemma experiments, current guard tests, synthetic tests and unmeasured human outcomes |
| System prompt and card | 5 | CLAUDE.md links services/llm/prompts/v5.txt; PROMPT_CARD.md describes limits; v1-v4 retained |
| Evolved AI guidelines | 4 | v0.3 merged in #98; proposed rules await human team ratification |
| Ten-plus prompt cases and failure/fix/retest | 6 | 14 development cases, historical actual-model output and #95 regression fixes. Current real-model rerun not claimed |
| Four members contribute real code | 15 | At least two code PR examples each in COLLABORATION.md; instructor determines substantive credit |
| Review quality / steward | 15 | Written review examples exist for all four; actual role timing and AI involvement must be assessed; historical handover gaps remain |
| Decisions log | 10 | Model choices and Week 11 handover recorded; Week 12 observed actions and future-session plan drafted; no invented Week 9/10 actions |
| Walking skeleton and merge day | 10 | Both actual four-member sessions still pending; teacher worksheets remain unfilled |

## Individual evidence

See COLLABORATION.md and evidence/2026-11-24-closeout/review-snapshot.json. Each student needs two merged substantive code PRs, two substantive steward approvals and at least one recorded actual steward term. PR counts alone do not establish understanding or proper role service.

## Submission gate

CLOSEOUT_STATUS.json intentionally records unresolved human evidence. scripts/package-cp2.py creates a clearly labelled review candidate by default. Its --require-complete mode refuses packaging while required evidence remains pending. Do not change a boolean to true without links to the real event and participant confirmation.

Before final E3: fill real session/user evidence, ratify or retain clearly proposed decisions, update report/evidence, render PDF, build and verify the ZIP from the reviewed revision, then have the team confirm and submit. Generated PDF/ZIP are not committed to Git.
