# CP2 cleanup and submission draft
- Date: 2026-11-24
- Author: 吳普軒 (hwupu), taking over 劉順松's branch `feat/414551016-cp2-closeout` (#103)
- Tool / model: Claude Code / Claude Opus 5.5
- PR: #103

## Prompt
Take over the branch. Clean up what is not needed, follow the CP2 instructions on deliverables and file names,
merge `README_CP2.md` into `README.md` and remove the conflicts, remove `CP2_WORK_LOG.md` from the root, and draft
the submission under `docs/cp2`.

## Output summary
- Removed files that are not CP2 deliverables: `CP2_WORK_LOG.md`, `README_CP2.md`, `docs/cp2/START_HERE_劉順松.md`,
  `TEAM_HANDOFF_劉順松.md`, `WEEK9_EVIDENCE_AND_STRATEGY.md`, `CLOSEOUT_STATUS.json`, `SESSION_RUNBOOK.md`,
  `ISSUE77_SESSION_PREP.md`, `USER_TEST_FOLLOWUP.md`, `REQUIREMENTS.md`, `COLLABORATION.md`,
  `evidence/2026-11-24-closeout/`, and the report/PDF/package-verification scripts.
- `README.md` is the single run guide (繁中): quick start with the main two-person task, Docker and manual start,
  checks and tests, limits, and the developer setup commands that had been dropped.
- `docs/cp2/Group01_CP2_Report.md`: the submission report, one section per deliverable, TODO(team) where real records
  are needed. `EVALUATION_REPORT.md` restructured to the current Ollama/v5 state; prompt card and design rationale
  brought up to date; `metrics.md` renamed `METRICS.md`.
- `scripts/package-cp2.py` builds `submission/Group01_CP2.zip` with only the deliverables and `repository_link.txt`.
- `start-cp2.sh`: dropped `SO_REUSEADDR` so the port check also catches listeners on 0.0.0.0 on macOS.

Second request (same day): keep course files out of the codebase folders, remove `docs/archive/`, and fill in the
survey answers of 護理師 A and B.
- Worksheets: instructor originals in `docs/references/*_worksheet.md`; the copies the team fills in are
  `docs/cp2/WALKING_SKELETON.md` and `docs/cp2/MERGE_DAY.md`. The package script moved to `docs/cp2/_package.py`.
- Removed `docs/archive/` (old discharge-summary plan, in git history) and `docs/cp2/evidence/clean-extraction.json` (verified an old candidate zip).
- Renamed course-named code: `scripts/start-cp2.*` → `scripts/start.*`, `scripts/check-cp2.*` → `scripts/check.*`,
  `apps/web/e2e/cp2.spec.ts` → `workflow.spec.ts`.
- U01/U02: role 護理師, outside the group; ratings and answers were already recorded verbatim and match the survey.

Third request: restore `CONTRIBUTORS.md` (required since CP1) and add `docs/cp2/README.md` (where to start and the
deliverables table). The zip now has that README, the report and `repository_link.txt` at the top, and the
repository files under `repository/`.

## Outcome
- Kept: 劉順松's `DECISIONS.md` entry (Week 12 steward record and merge plan), the evaluation-plan proposal, the
  start-script prerequisite checks, all evidence from real runs.
- Changed: see above. The removed working notes are in git history (commit 56a8b38).
- Rejected: filling in user-test details, session records or steward weeks; these stay TODO(team) for the people
  who were there.
