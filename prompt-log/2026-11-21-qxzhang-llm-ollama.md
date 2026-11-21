# LLM on Ollama with gemma3:1b, model comparison
- Date: 2026-11-21
- Author: 張棨翔
- Tool / model: Claude Code / Opus 5.5
- PR: (to fill)

## Prompt
Make the app demo-able on the workstation for Nov 23 with the extraction model on Ollama: gemma3:1b first,
gemma4:e4b as the official model once testing is satisfactory.

## Output summary
- llm service: `generate()` calls Ollama `/api/chat` instead of Transformers; torch and transformers removed (image
  207 MB). One warm-up extraction at start and a `/ready` endpoint; Ollama errors return the existing 503.
- docker compose: `ollama/ollama:0.33.2` and a one-shot `ollama-pull` service, models in a volume, `OLLAMA_KEEP_ALIVE`
  24h; `docker-compose.gpu.yml` for NVIDIA; the web waits for llm `/ready`.
- Prompt v4 (examples in the same JSON envelope the code sends, none repeated from the test cases); v3 stays default.
- Ran the 12 dev cases on gemma3:1b, gemma3:4b and gemma4:e4b with v3 and v4; outputs in
  `docs/cp2/evidence/ollama-2026-11-21/`. `DECISIONS.md`: Ollama runtime entry; CP2 model entry accepted.

Checked: llm ruff clean and 8 tests passed; compose config valid with and without the GPU file; on the workstation
Ollama ran on CUDA, `ollama-pull` fetched the model, llm became ready after 83 s and the first extraction then took
0.07 s; switching `LLM_MODEL` to gemma4:e4b worked without code changes. Not yet checked: the full app with a real
microphone (needs #83 as well).

## Outcome
- Kept: (to fill)
- Changed: (to fill)
- Rejected (and why): (to fill)
