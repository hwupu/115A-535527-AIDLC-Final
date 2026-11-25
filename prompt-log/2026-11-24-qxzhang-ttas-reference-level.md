# TTAS reference level by rule table, and keeping the current exports
- Date: 2026-11-24
- Author: 張棨翔
- Tool / model: Claude Code / Opus 5.5
- PR: (this PR)

## Prompt
Follow U04's suggestion: fill in a TTAS reference level from the chief complaint the LLM extracts, by a program,
not by the LLM; the nurse still decides. Keep copy text, print and JSON as the exports (no HIS).

## Output summary
- `DECISIONS.md`: two entries. TTAS reference level from a rule table using the chief complaint and the vitals
  (proposed, team to confirm); exports stay copy text, print and JSON (accepted).
- The assistant read the local TTAS PDFs (not committed) and found the level depends on vitals and other modifiers,
  not on the complaint alone, so the rule table uses both.
- GitHub: implementation card for the rule table (backend, with a small display change on the nurse screen).

## Outcome
- Kept: the LLM never outputs a level; the nurse selects and confirms 檢傷級數.
- Changed: "complaint → level" became "complaint + vitals → reference level", after reading the TTAS table.
- Rejected (and why): letting the LLM suggest the level (not testable, conflicts with the safety rule).
