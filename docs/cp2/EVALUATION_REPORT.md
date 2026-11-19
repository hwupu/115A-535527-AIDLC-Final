# Interim evaluation report - Group1 CP2

Prepared for team review by 劉順松 (414551016), 2026-11-04. This is an interim technical report, not evidence of external-user benefit or full course compliance.

## Question and evidence boundary

Does the tool reduce duplicate triage documentation and incomplete nurse-to-physician handoff? CP1 identified these problems through two external interviews. This run tests technical feasibility only. No nurse/physician prototype sessions were conducted. Human time saving, satisfaction, repeated questions, error catch rate and nurse-reviewed HPI recall are NOT MEASURED. The 30% time-saving and 90% field targets remain hypotheses.

## Prototype and machine verification

The candidate integrates upstream Vue workflows and adds persistent sessions, audit, confirmation, physician report polling, export, local model and speech services. Independent browser contexts test the human-role workflow automatically using synthetic data; this is not two real users. Unit tests explicitly mock hardware/model transport and are reported separately from actual-model runs. Exact check counts/status are stored in evidence/checks.json and browser-tests.json after the final run.

## Actual prompt experiment

Twelve synthetic DEVELOPMENT cases (eval/cases.json) cover typical input, missing information, measured vs self-reported temperature, restrictions/correction, prompt injection, triage requests, mobility and empty input. They have developer-written expected outputs and are not clinically validated or held out. Case T11 deliberately skips inference for empty input.

Model: Qwen/Qwen2.5-0.5B-Instruct, Transformers CPU float32. No claim is made for the originally planned Gemma-4. Prompt hashes, raw outputs, rejection details and times are saved in prompt-v2.jsonl and prompt-v3.jsonl.

| Version | Whole cases passing | Interpretation |
|---|---:|---|
| v2 | 4/12 | Mostly abstention/safety cases; nested JSON shape often wrong |
| v3 | 8/12 | Raw quote interface plus deterministic adapter improves normal extraction; still insufficient for the 90% target |

T01 is the recorded revision cycle: v2 returned flat values, which the nested validator rejected, yielding 0/3 compared fields correct. v3 asks for copied phrases and grounds them in code, yielding 3/3 and a case pass. This is a genuine machine failure→change→retest, not a fabricated user finding.

Remaining v3 failures: T02 and T12 misclassify travel statements as chief complaint; T03 expresses the symptom differently from the strict reference; T06 returns invalid output on correction. Whole-case pass is not field accuracy and includes successful abstentions. Source containment does not prevent wrong semantic labels. Failures remain in the evidence rather than being deleted.

## Actual speech experiment

Windows Hanhan generated one fictional sentence: 從昨天開始發燒，咳嗽，沒有旅遊史。 No human voice was recorded. CPU int8 Whisper tiny and base produced incorrect travel-history text; small produced the intended content with punctuation differences. See stt-synthetic.json, stt-base.json, stt-small.json and synthetic-fever.wav. PyAV 19 failed the decoder interface; pinning av>=14,<17 fixed it. One synthetic TTS clip cannot establish real accent/noise/mask accuracy or throughput. small is the candidate default, not a clinically validated choice.

## External testing still required

Conduct at least two sessions before CP2, using USER_TEST_PROTOCOL.md. Record baseline/tool time, actual errors and handoff questions, observed design friction and resulting changes. Do not claim 30% improvement without these data. Formal larger evaluation remains CP3 work.

## Limits and next actions

Team must ratify/replace the small-model adapter, validate more fields and scenarios, test actual consenting speakers, review safety/clinical wording and complete collaborative PR evidence. Docker daemon was unavailable during initial inspection; container configuration/build status must be reported separately from the tested Windows path. Authentication, real HIS writes, clinical advice and automated triage remain out of scope.
