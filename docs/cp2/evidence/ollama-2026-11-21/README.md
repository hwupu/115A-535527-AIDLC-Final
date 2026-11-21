# Ollama model comparison (2026-11-21)

Actual outputs of `eval/run_prompt_suite.py` on the twelve development cases in `eval/cases.json`, one file per
prompt and model. Same pipeline as the 2026-11-04 snapshot (quote grounding, `guard`, `eval/metrics.py`); only the
runtime changed from Transformers to Ollama. Not a user study.

Setup: workstation with an RTX 3090 (24 GB), Ollama 0.33.2 in Docker on CUDA, `temperature 0`, `num_predict 450`,
`format: json`. Run from the `feat/llm-ollama-gemma3` branch before it was committed, so `git_commit` reads
`uncommitted`.

| Model | v3 | v4 | Median seconds per case |
|---|---|---|---|
| gemma3:1b | 4/12 | 4/12 | 0.1 |
| gemma3:4b | 9/12 | 9/12 | 1.3 |
| gemma4:e4b | 8/12 | 7/12 | 5–7 |

For reference, Qwen2.5-0.5B on Transformers CPU scored v3 8/12 (`../prompt-v3.jsonl`).

Notes for reading these numbers:
- gemma3:1b answers `{"fields":{}}` for almost every case; its four passes are the cases whose correct answer is
  empty (T07, T08, T09, T11). It fails mostly because the transcript is sent as JSON
  (`{"untrusted_transcript": ...}`) while the v3 examples are plain text; a one-off test sending plain text reached
  6/12, but that variant is not committed.
- v3's examples are identical to T01, T04 and T10, so v3 scores are inflated for every model. v4 uses examples that
  do not appear in the cases.
- The first request after Ollama loads a model took 38–89 s; later requests take the times above.
