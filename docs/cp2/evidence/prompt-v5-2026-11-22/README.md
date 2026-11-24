# Prompt v5: every report field (2026-11-22)

Outputs of `eval/run_prompt_suite.py` for prompts v3, v4 and v5 on `gemma4:e4b` (official runs) and `gemma3:1b`
(default), on the workstation (RTX 3090, Ollama 0.33.2, temperature 0, thinking off for gemma4). Not a user study.

Cases: the twelve development cases T01–T12 plus two full-field cases. T13 is the S01 dialogue from
`docs/SCENARIOS.md`, with its reference values. T14 is a synthetic run-on transcript without speaker labels and with
Arabic digits, written to look like real Whisper output; all its values are invented. Both are development cases
(v5's travel rule was written after looking at T14), not held-out results.

Scoring (`eval/run_prompt_suite.py`): v3 and v4 are scored only on their six fields, so their T01–T12 results match
earlier runs. For v5, yes/no, numbers and the date of birth must match exactly; free-text and list fields count when
filled with a quote the guard accepted; `*_details` are not scored. A filled field that the case does not expect
counts as extra.

| Model | Prompt | T01–T12 whole cases | Fields correct | Omitted | Extra | Wrong yes/no, number or date |
|---|---|---:|---:|---:|---:|---:|
| gemma4:e4b | v3 | 10/12 | 10/19 | 5 | 0 | 0 |
| gemma4:e4b | v4 | 9/12 | 8/21 | 5 | 2 | 0 |
| gemma4:e4b | **v5** | **10/12** | **36/43** | 4 | 3 | **0** |
| gemma3:1b | v3 | 4/12 | 0/10 | 10 | 0 | 0 |
| gemma3:1b | v5 | 4/12 | 8/43 | 32 | 3 | 0 |

What changed during the run, and why:
- First v5 run: the T13 answer was cut off at 450 tokens (raised to 1500), unmentioned fields were filled with "無"
  and an empty quote, and T14 came back in the wrong shape so every field was rejected. v5 now sends a JSON Schema as
  Ollama's `format`, so the model can only answer `{value, source_span}` for known fields (never `triage_level`).
- The model computed 民國87 as 1997. Numbers and the date of birth are now computed in code from the quote
  (民國八十七年五月十四日 → 1998-05-14, 血壓一百二十二，八十 → 122/80); a value the quote cannot support is dropped.
- In T07 the model filled the patient's home reading 「體溫39度」 as the measured temperature. A temperature whose
  sentence mentions a home reading (在家, 早上量, …) is now dropped; T13 keeps the nurse's 38.5, not the patient's
  38.4.
- The three remaining extras are T13 HPI details (location 喉嚨 and the like) backed by real quotes; the answer key did
  not list them. gemma3:1b misses most fields but gave no wrong typed value.
