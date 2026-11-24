# AI Usage Guidelines (Draft v0.3, 2026-11-23, pending team ratification)

v0.1 was the Week 3 plan. v0.2 updated it to how we actually worked in Phase 2 (Weeks 8–11). v0.3 rewrites three rules
so that a teammate can check them from a PR, using the evidence from the Week 12 lab; see "Changes from v0.2" at the
end. Items marked **(proposed)** are new rules the team still has to accept in PR review.

Current code steward: see the rotation schedule in `README.md` (rotates weekly, Monday to Sunday)

## 1. AI tools we use, and what we use each for

| Tool | Who used it in Phase 2 | Used for | NOT used for |
|------|------------------------|----------|--------------|
| Claude Code (Sonnet / Opus) | 吳普軒 (frontend, repo setup, Scrum Master role), 張棨翔 (#67, #68) | Drafting code, tests and docs; first-pass review; Scrum Master facilitation and drafting `DECISIONS.md` / `prompt-log/` entries | Deciding scope, 檢傷級數 logic or evaluation conclusions; secrets |
| Codex desktop | 劉順松 (#73) | Implementing and verifying the CP2 backend, local inference adapters, prompt suite and CP2 documents | Same limits as above |
| Local Whisper (`small`, CPU int8) | in the app | Transcribing simulated triage conversations | Real patient audio; anything outside the local machine |
| Local extraction LLM on Ollama: `gemma3:1b` by default, `gemma4:e4b` for official runs on the workstation (`DECISIONS.md` 2026-11-19, 2026-11-21); Qwen2.5-0.5B on Transformers CPU until 2026-11-21 | in the app | Copying source-supported phrases into selected report fields for the nurse to review | Assigning a triage level; diagnosis or medical advice; writing to a real HIS; inventing unsaid values |

Adding an AI tool or widening the app's AI scope needs a `DECISIONS.md` entry first. The #73 model substitution
showed why: it shipped before the Product Owner had decided.

General rules:
- AI output is a draft. A human teammate reads, understands, and can explain every line before it is committed.
  **(proposed, v0.3)** To make that checkable, a PR changes at most about 400 lines (additions + deletions), not
  counting lock files and generated data-only evidence outputs; eval code and tests do count. A bigger PR says in its
  description why it can't be split, and is reviewed in a call where the author walks through it without using the
  AI. Each commit has one purpose and passes the tests on its own. Staying under 400 lines does not by itself show
  that the author understands the change.
- No secrets, credentials, or identifiable patient data in any AI tool. Local models get only synthetic scenarios and consented teammate recordings.
- **(proposed, v0.3)** Every PR is approved by a human other than the author, and an approval counts only if it has
  a written comment. The comment names at least one thing the reviewer ran or checked, and asks at least one
  question or raises one concern. If the review lists follow-up work, the issues for it are opened and linked before
  the merge. The code steward re-requests review on any empty approval.
- **(proposed)** PR checklist boxes are ticked only after the event happens. AI tools must not tick review, approval or user-testing boxes.
- **(proposed)** An AI agent may run `gh pr review` / `gh pr merge` only on an explicit instruction from the human approver in the same session, under that human's account. The human is accountable for the approval and merge. This amends the 2026-10-08 Scrum Master entry. It first happened with #73 (Claude Code, for 吳普軒) and #74 (Codex, for 劉順松) on 2026-11-19.
- AI agents never record attendance, user-test findings, approvals or a teammate's authorship that did not happen.

## 2. How we will document AI interactions

**What triggers a log entry.** Log an interaction when any of these is true:
- AI-generated or AI-modified code, text, or design ends up in the repo.
- An AI suggestion changes what we decide to build or how.
- AI output was rejected or corrected because it was wrong (record what was wrong).

Trivial uses (typo fixes, explaining a single error message) need no entry.

**Two separate records:**
- **Prompt engineering log** (`prompt-log/`, one entry per interaction): date, author, tool and model, the prompt, a summary of the output, what we kept/changed/rejected, and the PR link. This records *how we worked with the AI*.
- **`DECISIONS.md`**: records *what the team decided and why* (e.g. adopting a library, changing scope, ruling on a disagreement). It is not a transcript; it can link to a prompt-log entry as evidence.

**PR template.** **(proposed, v0.3)** Every PR fills in the "AI assistance" section of the PR template
(`.github/PULL_REQUEST_TEMPLATE.md`, from the Week 12 lab, #96): the tool and model, what it generated, and what the author
changed afterwards. If no AI was used, it says "none". Every commit that is mostly AI-written has an
`Assisted-by: <tool>` or `Co-Authored-By:` trailer. A reviewer doesn't approve a PR whose AI section is empty, or
whose `prompt-log/` entry still says "(to fill)". If a significant choice was made, the "What and why" section links
its `DECISIONS.md` entry, which records what was chosen, why, the alternative rejected, and the human who led it.

## 3. How we will handle disagreements about AI output quality

  - **Decision-maker:** the current code steward (rotates weekly, schedule in `README.md`) makes the final call. If the steward is the author of the disputed change, another teammate designated in `DECISIONS.md` decides instead. Until that designation is recorded, the team decides by majority vote excluding the author.
  - **Evidence required for approval** (the side wanting to keep the AI output supplies it):
    1. Tests pass, or a new test demonstrates the behavior.
    2. The author can explain the code in review without re-prompting the AI.
    3. A comparison against the alternative (human-written or a different AI output) on correctness, readability, and maintenance cost.
    4. Any cited API or library behavior is checked against official documentation.
  - **Resolution:** the steward records the ruling in `DECISIONS.md` (what was chosen, why, alternative rejected, led by). The team follows the ruling; it can be revisited only with new evidence.

## Changes from v0.2 and why (Week 12 lab, 2026-11-23)

Evidence: the 8 PRs merged between Nov 9 and Nov 23 (#73, #74, #75, #80, #81, #82, #84, #85). 6 were mostly
AI-generated (for #81 and #82 we can't tell), 7 got a written review from someone other than the author, and only 4
say what the AI did. These counts are indicators read from GitHub, not direct evidence of how well anyone understood
a change; a written review from a non-author is used as a proxy.

| Rule | Old wording | New wording | Evidence |
|---|---|---|---|
| Saying what the AI did (§2) | "Every PR fills in `.github/PULL_REQUEST_TEMPLATE.md`. If AI contributed, the 'Decision' section names the choice made and the 'Led by' field names the human who owns it." | Every PR fills in the template's "AI assistance" section (or says "none"); mostly AI-written commits have an `Assisted-by` or `Co-Authored-By` trailer; no approval while the AI section is empty or the prompt-log says "(to fill)"; significant choices are linked from "What and why" to `DECISIONS.md` (chosen, why, rejected, human lead) | Only 4 of 8 PRs say what the AI did. #81 and #82 don't say whether AI was used. #84 and #85 were merged with prompt-log outcomes still "(to fill)" |
| Reviews (§1) | "Every PR is approved by a human reviewer other than the author, regardless of who or what wrote the code." | An approval counts only with a written comment that names what was checked and asks a question or raises a concern; follow-up work in a review becomes linked issues before the merge | #84 was approved with an empty comment, like #69–#72 before it. The #85 review listed four risks "to open issues for later", and none were opened |
| Explaining every line (§1) | "AI output is a draft. A human teammate reads, understands, and can explain every line before it is committed." | Keeps the old sentence, and adds: about 400 changed lines (additions + deletions) per PR at most, excluding lock files and data-only evidence outputs but not eval code or tests; bigger PRs explain why and get a walk-through call; one purpose per commit, tests pass at each commit | #73 added 3,589 lines in one commit and #85 changed 823 lines across 25 files, so "can explain every line" could not be checked. Week 12 lecture, small PRs and atomic commits |

## Changes from v0.1 and why

| Change | Evidence from Phase 2 |
|---|---|
| Tool table lists who actually used which tool; Codex added | Commit co-author trailers (Claude) on #54–#72; `prompt-log/2026-11-04-414551016-cp2.md` (Codex) |
| Extraction model and runtime recorded (Ollama; gemma3:1b default, gemma4:e4b official) | #73 shipped a Qwen CPU adapter for a 4 GB-VRAM laptop before the PO decided; #85 moved to Ollama after measuring three models (`docs/cp2/evidence/ollama-2026-11-21/`) |
| Approvals need a substantive comment | Four approvals on #69–#72 had empty bodies; the CP2 rubric does not count them |
| Checklist boxes ticked only after the fact | #73's checklist marked reviews that had not happened |
| AI may merge only on the approver's explicit instruction | #73 (Claude Code, for 吳普軒) and #74 (Codex, for 劉順松) were approved by AI agents on the approver's instruction; v0.1 and the 2026-10-08 entry did not allow this |
| Prompt-log gap acknowledged | Frontend PRs #69–#72 were AI-assisted but have no `prompt-log/` entry. Going forward the PR author adds the entry in the same PR |
