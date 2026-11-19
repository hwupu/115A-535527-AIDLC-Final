# CP2 rubric check, #73 merge, #74 conflict, rubric follow-ups
- Date: 2026-11-19
- Author: 吳普軒
- Tool / model: Claude Code / Opus 5.5
- PR: #73 (review + merge), #74 (conflict fix), follow-up PR (this entry)

## Prompt
1. "I checked out the CP2 PR I haven't approved yet. The rubric was just announced on
   https://csic30216-fall26.denniswang.net/project/cp2/. Please check the requirements."
2. "Approve this PR and merge. Then fix the merge conflict on #74 in NurseSession. Then create a new PR to solve the
   CP2 rubric issues."

## Output summary
- Read the CP2 page and mapped all ten deliverables, the 100-point rubric and per-student minimums against #73 and
  GitHub PR/review history.
- Approved #73 with a written review (strengths, seven follow-ups) and merged it into `main` on the user's instruction.
- Merged `main` into `feat/compact-staff-layout` (#74): kept the compact layout and passed #73's `:report` prop to
  `ExportPanel`, reading `store.visitNo` because #74 moved the visit number into the role header. Web lint, typecheck
  and 34 tests pass.
- Follow-up PR: corrected CP2 dates (demo Nov 23, due Nov 29); rubric-aligned evidence matrix with per-member counts
  from GitHub; macOS/Linux `start-cp2.sh` / `check-cp2.sh` (all 11 checks pass; start/stop smoke-tested);
  `Group01_CP2.zip` naming with committed files only; system-prompt pointer in `CLAUDE.md` and the prompt card;
  AI usage guidelines v0.2 draft; `DECISIONS.md` entries (dates, #73 merge, open model decision, steward line);
  session record templates; `EVAL_MODE=0` in `.env.example`.

## Outcome
- Kept: all of the above, pending team review.
- Changed: the first `start-cp2.sh` left servers running when the script was killed; replaced `kill 0` with tracked
  PIDs and a recursive cleanup, then re-tested (0 listeners left). The package script included untracked files;
  restricted to committed files.
- Not done by AI (needs humans): the two outside-team user sessions, walking-skeleton and merge-day records,
  steward handover entries for Weeks 9–11, the Qwen vs Gemma-4 decision (PO), ratifying guidelines v0.2, and the
  missing PRs/approvals for 劉順松 and 林均澔.
- Note: the agent merging #73 departs from the 2026-10-08 decision; recorded in `DECISIONS.md` for the team to rule on.
