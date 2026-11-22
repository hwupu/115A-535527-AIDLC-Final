# Issue #77: Route 2 session preparation

Status: PREPARATION ONLY. No four-member session, attendance, shared review or team decision is claimed. Related issue: #77 (not closed by this PR).

## Prepared slice (team acceptance pending)

The existing two-role workflow already runs. This candidate addresses Route 2's third option: one AI failure state, tested using a fake model. Before applying draft fields, the API checks that the extraction response is an object with a fields object, optional metadata object and optional rejected list. Broken responses follow the existing nurse-only llm_unavailable notification. The transcript and nurse edits survive; the nurse can complete and confirm the report manually.

This preparation is not the session artifact. The team may change the slice or extend it during the session. Do not claim all four members built the prepared code.

## Reproduction and verification

From services/api, run `uv sync --locked`, then `uv run pytest tests/test_ai_failure.py -q`, `uv run pytest -q`, and `uv run ruff check .`.

Nine fake-model conditions: timeout, HTTP 503, invalid JSON, JSON array, JSON null, fields list, missing fields, metadata list and rejected object. Each checks HTTP input success, the nurse WebSocket error sequence, persisted input, unchanged fields, no success audit, unpublished report before confirmation and successful manual completion.

On 2026-11-19, running the new tests without the envelope guard produced 6 failures and 3 passes. With the guard, all 17 API tests passed (8 existing + 9 new). This is automated testing, not a real-model benchmark or external-user session. One existing Starlette/httpx deprecation warning is unrelated to this change.

## About 75 minutes together

Use the official worksheet `docs/walking_skeleton.md` supplied by #75 once available. Preserve it and fill it together; this preparation does not replace it.

1. Before starting: all four join one call, share one screen, and verify each can run the project. Record actual date and attendees; rotate the typist at each Part.
2. Part 1 (10 min): each writes a tool description independently, reads it aloud, then agrees one sentence. Leave all four original sentences in the worksheet.
3. Part 2 (10 min): trace input -> API -> model -> nurse confirmation -> physician report. Each box is explained by a non-author. Identify remaining fake/hard-coded behavior first, then missing second-user behavior; only if neither applies choose an AI failure slice. Confirm or reject this prepared candidate. Agree each person's implementation task and interface in the worksheet; do not pre-assign or invent contributions.
4. Part 3 (30 min): each person builds their agreed piece on their branch. Integrate into `skeleton` in path order; a non-author explains each piece before integration. Run the example after each piece and record actual failures/fixes. Keep author commits.
5. Part 4 (15 min): create the session PR from `skeleton` to main. The actual current steward reviews on screen, leaves a substantive comment, the author responds, then the steward approves and merges. Record exact links. This preparation PR cannot stand in for that shared activity.
6. Part 5 (5 min): record what worked, what was awkward, who had least opportunity, blockers and the change for merge day.

After the session, commit the filled worksheet, add the biggest real decision to DECISIONS.md with chosen/rejected options and human lead, and report the merged session PR to #49. Only then evaluate #77's checkboxes and closure. Perform merge day afterward.

## Presenter explanation

The HTTP call succeeding does not mean its JSON has the shape our code needs. We validate the outer structure before touching report fields. A bad structure becomes the same recoverable error as a timeout. We do not catch every exception, invent model values, or publish an unconfirmed report. Existing valid extraction, source grounding and nurse ownership behavior remain covered by the existing tests.

## Records that humans must supply

Session date/time and all four attendees; four independent sentences; non-author explanations; actual task/branch/commit links; integration results; steward comment and author response; merged session PR; reflection; final decision and evidence link in #49. Leave unknown records pending.
