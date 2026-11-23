# Whisper model comparison for A1 (#6)
- Date: 2026-11-22
- Author: 張棨翔
- Tool / model: Claude Code / Opus 5.5
- PR: (to fill)

## Prompt
Do A1: compare Whisper sizes for latency and CER, including masked speech and medical terms. I record the sentences
myself through a small recording page; then run the comparison and record the decision.

## Output summary
- `eval/stt_sentences.json` (18 fictional triage sentences with tags), `eval/stt_benchmark.py` (same settings as
  `services/stt`, CER without punctuation and with numerals scored as values), `eval/STT_RECORDING.md` (recording
  guide; recordings never committed).
- `eval/metrics.py`: `zh_digits()` with tests, because Whisper writes `122` for 一百二十二 and raw CER counted that
  format difference as errors.
- A local recording page (kept outside the repo) that showed each sentence and saved browser webm files under the
  gitignored `evidence/stt-audio/`. I recorded 36 clips (code N01).
- Results in `docs/cp2/evidence/stt-2026-11-22/` (text only) and a `DECISIONS.md` entry; follow-up cards #88 (GPU
  with CPU fallback) and #89 (medical vocabulary hints with a hallucination check).

Checked: eval tests pass (3); ruff clean on the new files; benchmark ran tiny, base, small and medium on all 36 clips.

## Outcome
- Kept: (to fill)
- Changed: (to fill)
- Rejected (and why): (to fill)
