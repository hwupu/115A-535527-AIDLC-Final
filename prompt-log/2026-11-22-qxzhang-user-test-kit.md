# Low-burden user test protocol, Chinese form and scenario cards
- Date: 2026-11-22
- Author: 張棨翔
- Tool / model: Claude Code / Opus 5.5
- PR: #94

## Prompt
Prepare the outside-team user tests for next week with as little question-and-answer burden on the participant as
possible: what they do, what they fill in, a separate Chinese questionnaire, and scenario cards. Nurses ask in their
own words, but the patient content must be fictional.

## Output summary
- `docs/cp2/USER_TEST_PROTOCOL.md`: one task with the tool (about 15 minutes in total), a 30-second consent script,
  five questions (three 1–5 ratings, two open), and everything else observed or read from the system (evaluation
  mode timing, audit log, AI drafts against the scenario card). The paper-vs-tool timing comparison is left to the
  CP3 formal evaluation.
- `docs/cp2/USER_TEST_FORM.md`: printable Chinese form, one page for the participant and one for the facilitator.
- `docs/cp2/SCENARIO_CARDS.md`: S01, S03, S04 from `docs/SCENARIOS.md` as role-player cards, measured-values cards
  and answer keys.

At the initial preparation on 2026-11-22, no sessions had been run. The separate 2026-11-23 results entry records the author-reported U01/U02 questionnaires; missing facilitator metadata remains pending.

## Outcome
- Kept: the protocol, questionnaire and scenario cards, or the author-reported answers, as listed in the output summary; pending session metadata stays explicit.
- Changed: 2026-11-24 Codex review clarified valid API participant codes and the evidence boundary; no participant data was invented.
- Rejected (and why): estimating missing timing, consent, roles or outside-team status; treating ratings as measured time savings.

Review follow-up by Codex for 劉順松, explicitly authorized to complete integration on 2026-11-24. This completes observable artifact notes, not the original author's personal verification.
