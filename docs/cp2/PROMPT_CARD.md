# Prompt documentation card

- Where the system prompt is: `services/llm/prompts/v3.txt` (in use), loaded by `services/llm/app/main.py`. `CLAUDE.md` is the coding agent's policy and links here; it is not sent to the product model.

- Owner: 劉順松 / Group1. Status: local CP2 proposal pending team review.
- Task: copy source-supported phrases from synthetic triage transcripts into six selected fields; nurse reviews them before saving.
- Actual model (since 2026-11-21): served by local Ollama (`/api/chat`, temperature 0, `format: json`, max 450 tokens, thinking turned off for thinking models), no hosted API/key. `gemma3:1b` by default; `gemma4:e4b` for official runs on the workstation. Results: `docs/cp2/evidence/ollama-2026-11-21/`.
- Earlier model (2026-11-04 to 2026-11-21): Qwen/Qwen2.5-0.5B-Instruct on Transformers CPU float32; `evidence/prompt-v2.jsonl` and `prompt-v3.jsonl` are its results. Never attribute those to Gemma.
- Prompts: services/llm/prompts/v1.txt (initial), v2.txt (nested field output, baseline failure), v3.txt (raw quotes + validated deterministic adapter; default), v4.txt (v3 with examples in the JSON envelope the code sends and none taken from the test cases).
- v3 fields: chief_complaint, hpi.onset, tocc.travel, measurement.vitals.temp_c, measurement.restrictions, patient.mobility. Other fields are manual for now.
- Boundaries: no triage assignment, diagnosis, treatment or patient identifiers. Transcript is untrusted data. No inference from unmentioned facts. No direct HIS write.
- Validation: JSON parse, field allowlist, exact source containment, boundary pattern guard, API value-type checks, nurse confirmation. There is no semantic entailment guarantee. Invalid JSON yields an explicit failure with manual entry available.
- Prompt tests: 12 synthetic DEVELOPMENT cases; no held-out performance claim. v2 and v3 raw outputs/failures, prompt hashes and timing in evidence/. T01 failed v2 shape validation and passed v3 after changing the interface to copied quotes.
- Known failures: correction case, semantic field misclassification, inconsistent wording; small models have limited reliability. gemma3:1b returns no fields for most cases (4/12, all of them the cases whose answer is empty). v3's examples repeat T01, T04 and T10, which inflates v3 scores. Source grounding can still support the wrong field. No automatic clinical flags are claimed.
- Privacy: audio in memory; simulated transcripts in local database; active session deletion removes linked active records. SQLite/free pages, exported JSON and backups are not securely erased automatically.
- Human control: nurse can clear/change any draft, manually enter omitted fields and select the level. Doctor reads only the confirmed report. No authentication; localhost-only prototype.
- Reproduction: see README_CP2.md and eval/run_prompt_suite.py. First-run model download time is separate from warm inference. Empty case T11 skips the model and is labelled accordingly.
