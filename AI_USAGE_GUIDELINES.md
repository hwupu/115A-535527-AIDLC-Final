# AI Usage Guidelines (Draft v0.1)

Current code steward: see `DECISIONS.md` (rotates weekly)

## 1. What AI tools we plan to use, and what we will use each for

| Tool | Used for | NOT used for |
|------|----------|--------------|
| Claude Code | Drafting code and tests, explaining unfamiliar code, refactoring suggestions, first-pass code review | Merging or pushing to `main`; architecture decisions; writing the evaluation results or interpreting user data; anything touching secrets or credentials |
| Local models (Whisper for speech-to-text, Gemma-4 for field extraction; runtime TBD) | Transcribing simulated triage conversations and drafting structured, source-linked report fields for the nurse to review | Receiving real patient data or identifiable audio; assigning a triage level (檢傷級數); diagnosis or medical advice; writing to a real HIS; inventing values that were not said |

Whisper and Gemma-4 are approved for the prototype under the scope in `DECISIONS.md` (2026-10-27). Any additional AI tool or a material expansion of scope requires a new `DECISIONS.md` entry first.

General rules:
- AI output is a draft. A human teammate reads, understands, and can explain every line before it is committed.
- No secrets, credentials, or identifiable patient data are pasted into Claude Code or any public AI service.
- Local models may receive only synthetic scenarios and consented teammate recordings inside the approved local environment. Local use does not remove the need for consent and privacy review.
- Every PR is approved by a human reviewer other than the author, regardless of who or what wrote the code.

## 2. How we will document AI interactions

**What triggers a log entry.** Log an interaction when any of these is true:
- AI-generated or AI-modified code, text, or design ends up in the repo.
- An AI suggestion changes what we decide to build or how.
- AI output was rejected or corrected because it was wrong (record what was wrong).

Trivial uses (typo fixes, explaining a single error message) need no entry.

**Two separate records:**
- **Prompt engineering log** (`prompt-log/`, one entry per interaction): date, author, tool and model, the prompt, a summary of the output, what we kept/changed/rejected, and the PR link. This records *how we worked with the AI*.
- **`DECISIONS.md`**: records *what the team decided and why* (e.g. adopting a library, changing scope, ruling on a disagreement). It is not a transcript; it can link to a prompt-log entry as evidence.

**PR template.** Every PR fills in `.github/PULL_REQUEST_TEMPLATE.md`. If AI contributed, the "Decision" section names the choice made and the "Led by" field names the human who owns it. Significant decisions are also copied to `DECISIONS.md`.

## 3. How we will handle disagreements about AI output quality

  - **Decision-maker:** the current code steward (rotates weekly, see `DECISIONS.md`) makes the final call. If the steward is the author of the disputed change, another teammate designated in `DECISIONS.md` decides instead. Until that designation is recorded, the team decides by majority vote excluding the author.
  - **Evidence required for approval** (the side wanting to keep the AI output supplies it):
    1. Tests pass, or a new test demonstrates the behavior.
    2. The author can explain the code in review without re-prompting the AI.
    3. A comparison against the alternative (human-written or a different AI output) on correctness, readability, and maintenance cost.
    4. Any cited API or library behavior is checked against official documentation.
  - **Resolution:** the steward records the ruling in `DECISIONS.md` (what was chosen, why, alternative rejected, led by). The team follows the ruling; it can be revisited only with new evidence.
