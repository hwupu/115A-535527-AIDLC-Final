# AI-in-the-Loop Discharge Summary Drafting Assistant

## Potential Topic

This project explores a physician-in-the-loop tool that uses a locally deployed
Ollama model to draft discharge summaries from synthetic or properly
de-identified clinical records.

The tool will provide source-linked draft sections and flag missing information.
Physicians remain responsible for reviewing, editing, rejecting, and approving
all content. The AI does not make diagnoses, prescribe medication, determine
discharge readiness, or write directly to a production medical record.

## Goal

Reduce the time clinicians spend locating and summarizing record information
while preserving accuracy, traceability, and human clinical oversight.

## Repository Documents

- `AI_USAGE_GUIDELINES.md` — team rules for AI use
- `EVALUATION_PLAN.md` — problem grounding, success metrics, and safety checks
- `DECISIONS.md` — significant team decisions
- `prompt-log/` — records of AI-assisted work that enters the repository
