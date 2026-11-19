# Prompt documentation card

- Owner: 劉順松 / Group1. Status: local CP2 proposal pending team review.
- Task: copy source-supported phrases from synthetic triage transcripts into six selected fields; nurse reviews them before saving.
- Actual model: Qwen/Qwen2.5-0.5B-Instruct, local Transformers, CPU float32, deterministic greedy generation, max 450 new tokens, no hosted API/key. Model files downloaded from the named Hugging Face repository without remote code execution.
- Planned model in CP1: Gemma-4; not implemented or benchmarked by this work. Never attribute these results to it.
- Prompts: services/llm/prompts/v1.txt (initial), v2.txt (nested field output, baseline failure), v3.txt (raw quotes + validated deterministic adapter).
- v3 fields: chief_complaint, hpi.onset, tocc.travel, measurement.vitals.temp_c, measurement.restrictions, patient.mobility. Other fields are manual for now.
- Boundaries: no triage assignment, diagnosis, treatment or patient identifiers. Transcript is untrusted data. No inference from unmentioned facts. No direct HIS write.
- Validation: JSON parse, field allowlist, exact source containment, boundary pattern guard, API value-type checks, nurse confirmation. There is no semantic entailment guarantee. Invalid JSON yields an explicit failure with manual entry available.
- Prompt tests: 12 synthetic DEVELOPMENT cases; no held-out performance claim. v2 and v3 raw outputs/failures, prompt hashes and timing in evidence/. T01 failed v2 shape validation and passed v3 after changing the interface to copied quotes.
- Known failures: correction case, semantic field misclassification, inconsistent wording; small model has limited reliability. Source grounding can still support the wrong field. No automatic clinical flags are claimed.
- Privacy: audio in memory; simulated transcripts in local database; active session deletion removes linked active records. SQLite/free pages, exported JSON and backups are not securely erased automatically.
- Human control: nurse can clear/change any draft, manually enter omitted fields and select the level. Doctor reads only the confirmed report. No authentication; localhost-only prototype.
- Reproduction: see README_CP2.md and eval/run_prompt_suite.py. First-run model download time is separate from warm inference. Empty case T11 skips the model and is labelled accordingly.
