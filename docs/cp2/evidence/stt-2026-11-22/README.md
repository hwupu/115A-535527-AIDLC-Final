# Whisper model comparison for A1 (2026-11-22)

Output of `eval/stt_benchmark.py` (text only; the recordings stay on the workstation and are not committed). One
team member (code N01) read the 18 fictional sentences in `eval/stt_sentences.json` twice: without a mask (`plain`)
and with a medical mask (`mask`), recorded in Chrome with MediaRecorder (webm/opus, the same format the app sends).
Settings match `services/stt`: faster-whisper 1.2.1, CPU, int8, `language="zh"`, beam 5, VAD, OpenCC s2twp. Not a
user study.

CER ignores punctuation. `cer_digits` also converts Chinese numerals to digits on both sides (Whisper writes `122`
for 一百二十二), so it scores the values rather than the number format.

| Model | CER plain | CER mask | cer_digits plain | cer_digits mask | Median s per clip | RTF |
|---|---|---|---|---|---|---|
| tiny | 0.386 | 0.325 | 0.352 | 0.306 | 0.4 | 0.06 |
| base | 0.297 | 0.268 | 0.222 | 0.198 | 0.6 | 0.10 |
| small | 0.217 | 0.209 | 0.146 | 0.131 | 1.7 | 0.28 |
| medium | 0.180 | 0.147 | 0.102 | 0.069 | 4.7 | 0.74 |

`cer_digits` by tag (both conditions): small / medium — medical 0.112 / 0.087, numbers 0.203 / 0.125, vitals 0.283 /
0.187, symptoms 0.070 / 0.036, tocc 0.056 / 0.028, taiwanese-mix 0.750 / 0.312.

Limits:
- One speaker and 18 sentences per condition. The mask round was recorded second, so its lower CER is probably a
  practice effect; it does not show that masks do not hurt. Next speakers should record the mask round first.
- Every model misheard rare terms: 瘻管 (樓管, 螺管, 卵管, 儒管) and 盤尼西林 (潘尼西林). Follow-up: #89.
- Latency is CPU only; GPU is #88. Clips are about 6 s; RTF 0.74 means a 30 s turn waits about 22 s on medium.
