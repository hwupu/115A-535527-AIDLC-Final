# Transcript timestamps from Whisper (#8)
- Date: 2026-11-22
- Author: 張棨翔
- Tool / model: Claude Code / Opus 5.5
- PR: (to fill)

## Prompt
Fix the gap found while reviewing #82: in real-API mode every transcript line shows "—" because the api stores
`start: 0, end: 0`. Keep Whisper's timing and continue it across recordings in a session.

## Output summary
- stt: `/transcribe` also returns `duration` (seconds of audio; defaults to 0 for older callers).
- api: a recorded line gets `start`/`end` from Whisper's first and last segment plus the session's offset
  (`audio_seconds`, the audio recorded before it), so a second recording continues the timeline. Typed lines stay
  0/0 and keep showing "—". Segment fields without timing are read defensively.
- `services/api/tests/test_transcript_timestamps.py`: one typed line and two recordings.

Checked: api ruff clean and 23 tests passed; stt 3 passed; the new test fails on `main` (all 0/0) and passes with the
change; one real recording through the stt service returned `duration` 8.82 and a segment at 0.66–8.66 s. Not done:
streaming partial results while the nurse is still speaking (the other half of #8).

## Outcome
- Kept: (to fill)
- Changed: (to fill)
- Rejected (and why): (to fill)
