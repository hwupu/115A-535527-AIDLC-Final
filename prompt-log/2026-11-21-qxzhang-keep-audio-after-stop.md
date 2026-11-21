# Keep the recording that arrives after recording.stop (#83)
- Date: 2026-11-21
- Author: 張棨翔
- Tool / model: Claude Code / Opus 5.5
- PR: (to fill)

## Prompt
Fix #83: real-API recordings produce no transcript because the api drops the audio that arrives after
`recording.stop`. Fix it in the backend and add a regression test.

## Output summary
Found while reviewing #81. `MediaRecorder.onstop` runs after the nurse screen has sent `recording.stop`, and the api
WebSocket dropped any audio received while `recording` was false. The socket now expects one final blob after a stop
(`awaiting_final`), cleared by the next start or once that blob arrives; audio outside a recording is still ignored.
`services/api/tests/test_recording_audio.py` covers stop-then-audio, audio-then-stop, a repeated stop, a second
stray blob and audio without a recording.

Checked: the new tests fail on `main` (3 failed / 2 passed) and pass with the fix (5 passed); full api suite 13
passed, eval 2 passed, ruff clean. Not yet checked with a real microphone and Whisper in the browser.

## Outcome
- Kept: (to fill)
- Changed: (to fill)
- Rejected (and why): (to fill)
