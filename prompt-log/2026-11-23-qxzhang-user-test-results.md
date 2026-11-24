# First two outside-team user tests and the speaker-role decision
- Date: 2026-11-23
- Author: 張棨翔
- Tool / model: Claude Code / Opus 5.5
- PR: #94

## Prompt
Record the questionnaire answers of two outside-team testers as cards and in the CP2 docs, marking everything not
reported as 待補. Decide how to tell speakers apart (option B: the AI labels lines from content, the nurse can
correct; pyannote later). Say two people have tested and more will follow.

## Output summary
- `docs/cp2/USER_TEST_PROTOCOL.md`: session records U01 and U02 with the ratings and answers as given; roles, date,
  scenario, timing, edits, AI draft accuracy and observations marked 待補; the intro now says two sessions were held
  and more will follow.
- `docs/cp2/DESIGN_RATIONALE.md`: findings from the two sessions and the matching changes (#99, #100, #102, #45,
  #89, and not integrating with a real HIS). `EVALUATION_REPORT.md` and `REQUIREMENTS.md`: two sessions held, more
  planned, no measured outcome yet.
- `DECISIONS.md`: speaker roles labelled by the AI from content, correctable by the nurse (#102); pyannote later (#9).
- GitHub in the same session: cards #100 (load test), #101 (feedback summary), #102 (speaker roles), comments on #9,
  #45 and #99.

Nothing was filled in that the user did not report.

## Outcome
- Kept: the protocol, questionnaire and scenario cards, or the author-reported answers, as listed in the output summary; pending session metadata stays explicit.
- Changed: 2026-11-24 Codex review clarified valid API participant codes and the evidence boundary; no participant data was invented.
- Rejected (and why): estimating missing timing, consent, roles or outside-team status; treating ratings as measured time savings.

Review follow-up by Codex for 劉順松, explicitly authorized to complete integration on 2026-11-24. This completes observable artifact notes, not the original author's personal verification.
