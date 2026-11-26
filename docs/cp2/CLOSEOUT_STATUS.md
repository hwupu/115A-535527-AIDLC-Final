# CP2 closeout - 2026-11-26

This record supports #106. It does not close the issue or certify final readiness.

## Completed technical/documentary work
- #120 and #124 are merged into main 924d688; all five CI checks succeeded. Existing checklist/keyboard work reaches main through #123.
- Week 9 now has a dated, evidence-based late entry. No formal Week 9 approval by 414551016 was found across all 40 PRs; implementation evidence is not a steward review.
- 劉順松 explicitly confirmed the One README organization in the Nov 26 conversation.
- The report contains facts and disclosed gaps instead of unresolved editorial placeholders; the submission index has no temporary Status column.
- Contributor graph recaptured Nov 26 after #126, #127 and #129 merged.
- Merge day and the README-only fresh-clone test: participant-reported in #126/#129 (`MERGE_DAY.md`); run details not attached. PDF and ZIP are local deliverables, kept outside Git.

## Required human follow-through
1. Team / instructor: build the walking-skeleton technical slice together, or obtain instructor acceptance of a specific alternative. Do not reuse #80 as a new slice. Merge day is participant-reported (#126, #129). Keep actual entries in the worksheets.
2. Fresh-clone test: participant-reported in #126 (MERGE_DAY.md Part 3). If the team wants it verifiable, add tester, commit, model and timestamps to MERGE_DAY.md.
3. Teammate reviewer (requested: 吳普軒): review this closeout PR. Check the Week 9 boundary and explicit submission gaps. No self-approval.
4. Team: read the PDF and ZIP, replace readiness fields only from actual evidence, regenerate from the reviewed commit, then hand to the #49 uploader. E3 is due Nov 29 per repository schedule; no upload is performed here.

## Technical verification boundary
The main 924d688 CI covers web checks, Python service checks and Docker builds. It does not establish that this laptop has Ollama running, a working Docker engine or a completed fresh-clone user task. Ollama was not reachable at localhost:11434 on this review. No model accuracy results are newly claimed.

## Packaging
Run `python docs/cp2/_package.py` for a review ZIP; it warns while requirements remain. Run `python docs/cp2/_package.py --strict` for final readiness validation. A real pending requirement must produce a warning/failure; do not silence it to make the output look complete. Both modes use committed files plus local PDF and graph. All human gates remain visible in SUBMISSION_STATUS.json.
