# AI usage guidelines v0.3 (Week 12 lab, Part 3)
- Date: 2026-11-23
- Author: 吳普軒 (phwu)
- Tool / model: Claude Code / Claude Opus 5.5
- PR: the PR that adds this file (branch `docs/ai-guidelines-v0.3`)

## Prompt
Read the Week 12 lab page and slides, explain Part 3, then count the three slide 4 numbers from our PR history and
draft three rules that a teammate can check from a PR. Then: "create a pr and fill in the link".

## Output summary
Claude Code counted the 8 PRs merged Nov 9 to Nov 23 with `gh` (co-author trailers, prompt-log files, review
bodies), drafted the three old/new/evidence rows for the lab submission, and copied them into
`AI_USAGE_GUIDELINES.md` as v0.3, with a "Changes from v0.2" table.

## Outcome
- Kept: the three rules as drafted (saying what the AI did, written reviews with linked follow-ups, about 400 lines
  per PR), all marked (proposed) until the team accepts them in review.
- Changed: the "can someone else explain it" number is a proxy (a written review from someone other than the
  author), because line-by-line understanding can't be read from GitHub. #73 is counted even though it is 3,589
  lines; the team should decide whether to keep it in the count.
- Rejected (and why): putting the PR template change in this PR. The lab treats it as its own item and the steward
  merges it, and one purpose per PR is one of the rules this PR adds.
- Update after 414551016's review (2026-11-23), prompt "address the feedback on #96, then #98": Claude Code
  aligned §2 with #96 (path `.github/PULL_REQUEST_TEMPLATE.md`; significant choices linked from "What and why" to
  `DECISIONS.md` instead of the removed "Decision / Led by" fields), kept the original "explain every line" sentence
  with the 400-line rule added on top (changed lines = additions + deletions; only lock files and data-only evidence
  outputs excluded), and noted that the PR counts are indicators, not evidence of understanding. Rules stay
  (proposed) until the team accepts them.
