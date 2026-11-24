# Prompt v5: draft every report field
- Date: 2026-11-22
- Author: 張棨翔
- Tool / model: Claude Code / Opus 5.5
- PR: #95

## Prompt
In my recorded test, vitals, date of birth, accompaniment and the travel answer stayed empty. Whatever the recording
says should become an AI draft: make prompt v5 for every field.

## Output summary
- `services/llm/prompts/v5.txt`: every field as `{value, source_span}`, examples not taken from the cases.
- `services/llm/app/main.py`: v5 is the default (`LLM_PROMPT_VERSION`); Ollama structured output with a JSON Schema
  for v5; numbers and the date of birth computed from the quote (`zh_digits`, `date_in`); a temperature from a
  sentence about a home reading dropped; output limit 450 → 1500 tokens. Tests for each.
- `eval/`: two full-field cases (T13 = SCENARIOS S01, T14 = synthetic STT-style with invented values; my own
  recording was not used because it may contain my real date of birth), v5 expectations on T01 and T07, scope-aware
  scoring (v3/v4 on six fields; v5 exact for yes/no, numbers and dates, filled-and-grounded for free text).
- Evidence `docs/cp2/evidence/prompt-v5-2026-11-22/`, `DECISIONS.md` entry, `CLAUDE.md`, prompt card, README_CP2.

Iterations, each found by reading the actual outputs: answer cut off at 450 tokens; T14 in the wrong shape (all
fields rejected) → JSON Schema; 民國87 computed as 1997 → dates and numbers from the quote; the home reading in T07
filled as the measured temperature, first with a quote check (the model quoted only 「體溫39度」), then with a sentence
check; 主訴 and onset often omitted → explicit prompt rules.

Checked: llm ruff clean, 13 tests passed; final run gemma4:e4b v5 10/12 on T01–T12, 36/43 fields, no wrong yes/no,
number or date; gemma3:1b v5 8/43, no wrong typed value.

## Outcome
- Kept: original v5 prompt, schema and source-span checks as described above; see the dated review follow-up for additional code guards.
- Changed: review corrections dated 2026-11-24 are recorded below; no human-only verification is implied.
- Rejected (and why): trusting the model calculation without a source-derived guard.


## 2026-11-24 review follow-up (Codex for 劉順松)
- User explicitly requested completion and merger of pending PRs.
- Codex implemented labelled numeric extraction (ambiguous quotes stay empty), home-reading filtering for all vitals and real calendar validation; added fake-model regressions for the review's reproducible failures.
- This entry completes a record of observable artifacts; it does not invent the original author's personal review or a new Gemma experiment. Original recorded model outputs remain unchanged and predate these guard corrections.
- Free-text scoring still measures presence plus accepted grounding, not semantic accuracy. Rerun the real-model suite before attributing the historical 36/43 to this revision.
