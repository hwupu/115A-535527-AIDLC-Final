# Whisper on the GPU first, CPU fallback (#88)
- Date: 2026-11-24
- Author: 張棨翔
- Tool / model: Claude Code / Opus 5.5
- PR: (this PR)

## Prompt
Use the GPU as much as possible on the workstation demo; machines without a GPU keep using the CPU.

## Output summary
- `services/stt`: `WHISPER_DEVICE=auto` tries CUDA float16, checks it with 1 s of silence, falls back to CPU int8;
  `/transcribe` reports the device. CUDA libraries only in images built with `docker-compose.gpu.yml`
  (`STT_GPU=1`). Four new tests for the device choice.
- `DECISIONS.md` and `docs/cp2/evidence/stt-2026-11-24-gpu/`: GPU benchmark (small 0.18 s, medium 0.3 s per clip).
- Found while testing: the demo Ollama container had lost the GPU (`Failed to initialize NVML`) and ran on the CPU
  (51 s per draft); restarting it brought the draft to 1.2 s. Recorded as an operations note.

## Outcome
- Kept: CPU int8 behaviour unchanged for machines without a GPU.
- Changed: —
- Rejected (and why): making the CUDA libraries part of every image (about 1 GB more for Mac and Windows users).
