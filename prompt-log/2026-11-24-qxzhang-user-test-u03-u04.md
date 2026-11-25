# User tests U03/U04 and facilitator records for all four participants
- Date: 2026-11-24
- Author: 張棨翔
- Tool / model: Claude Code / Opus 5.5
- PR: (this PR)

## Prompt
Record two more outside-team testers (U03 nurse, U04 physician, 2026-11-24) and fill in the facilitator part for
all four from what the facilitator reported and what the demo database recorded. Keep copy, print and JSON as the
exports. Open cards for partial AI drafts and section confirmation.

## Output summary
- `docs/cp2/USER_TEST_PROTOCOL.md`: U03/U04 records; for U01–U04 the facilitator, consent, outside-team status,
  roles, who played nurse or patient, scenario S03, timing, edits, AI draft accuracy against the S03 answer key,
  hesitations, and the #99 printout retest.
- `DESIGN_RATIONALE.md`, `EVALUATION_REPORT.md`, `REQUIREMENTS.md`: four participants in two runs, measured
  timing and accuracy, one safety finding (systolic BP 2 from the STT error 「斜壓兩」).
- GitHub: cards #112 (partial AI drafts) and #113 (section confirmation).

## Outcome
- Kept: participant answers and facilitator reports as given; system numbers read from the demo audit log.
- Changed: the answer-key comparison was made by the assistant and is marked as not yet checked by a nurse.
- Rejected (and why): a time-saving claim (two runs, no paper baseline).
