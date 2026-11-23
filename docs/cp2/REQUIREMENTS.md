# CP2 evidence matrix

Source: published CP2 page, https://csic30216-fall26.denniswang.net/project/cp2/ (checked 2026-11-19).

- **Mon 2026-11-23, Week 12 lab:** peer review. The prototype must be demonstrable when we arrive.
- **Sun 2026-11-29, end of day:** E3 deadline. One zip per group named `GroupXX_CP2` (ours: `Group01_CP2`), all deliverables plus the repository link as a plain-text file. Build with `python3 scripts/package-cp2.py`.
- Team sessions (TA material, 2026-11-19): walking skeleton first, then merge day, both before submission. Worksheets: `docs/walking_skeleton.md`, `docs/merge_day.md`.
- Grading is on evidence, not claims. Honest gaps cost nothing.

Status as of 2026-11-19. Update this table in the same PR that adds the evidence.

## Deliverables and rubric (100 points)

| # | Deliverable | Points | Evidence in repo | Status |
|---|---|---:|---|---|
| 1 | Working prototype two people can use together | 15 | #73 (merged); `README_CP2.md`; `scripts/start-cp2.sh` / `.ps1`; CI green | Runs on macOS and Windows. Needs a rehearsed demo before Nov 23 |
| 2 | Design rationale incl. findings from ≥2 user sessions with people outside the team | 10 | `DESIGN_RATIONALE.md`; `USER_TEST_PROTOCOL.md` | Partial: 2 sessions held (U01, U02), more planned; roles, timing and AI accuracy still to be filled in (#101) |
| 3 | Updated evaluation report, honest about what is untested | 10 | `EVALUATION_REPORT.md`; `evidence/` | Draft done; add user-session results when held |
| 4 | System prompt (`CLAUDE.md`) and prompt documentation card | 5 | `services/llm/prompts/v3.txt`; `PROMPT_CARD.md`; pointer in `CLAUDE.md` | Done; model choice pending PO (see `DECISIONS.md`) |
| 5 | AI usage guidelines refined from the Week 3 draft | 4 | `AI_USAGE_GUIDELINES.md` v0.2 draft + change log | Draft; team must ratify |
| 6 | Prompt test suite: ≥10 cases, typical + edge, ≥1 fail→fix→re-run | 6 | `eval/cases.json` (12); `evidence/prompt-v2.jsonl` → `prompt-v3.jsonl` (T01) | Done |
| 7 | `DECISIONS.md` complete through Phase 2, cross-referenceable with PRs | 10 | `DECISIONS.md` | Partial: steward handovers Weeks 9–11 and model decision pending |
| 8 | Contributor graph: substantive code from all four | 15 | [graph](https://github.com/hwupu/115A-535527-AIDLC-Final/graphs/contributors); `COLLABORATION.md` | **Not met for 林均澔; 劉順松 has 1 of 2 PRs** |
| 9 | Walking skeleton: merged PR + `docs/walking_skeleton.md` | (in 10 "team sessions") | worksheet in repo | **Not held yet** (must come before merge day) |
| 10 | Merge day: merge plan + outcome in `DECISIONS.md`, `docs/merge_day.md` | (in 10 "team sessions") | worksheet in repo | **Not held yet** |
| — | Review quality and code steward role | 15 | PR reviews; `DECISIONS.md` | Partial: approvals without comments do not count |

Product = rows 1–6 (50). Collaboration = 8, review quality, 7, team sessions 9–10 (50).

## Per-student minimums (checked individually)

At least 2 merged PRs with substantive code, at least 2 steward approvals each with a substantive comment, and code steward at least once, recorded in `DECISIONS.md`.

Counted from GitHub on 2026-11-19 (PRs merged into `main`):

| Member | Merged code PRs | Approvals with a comment | Steward recorded in `DECISIONS.md` |
|---|---|---|---|
| 吳普軒 (hwupu) | 8 (#54 #55 #56 #69 #70 #71 #72 #74) | 3 (#67 #68 #73) | Yes (Week 8) |
| 張棨翔 (XiangLibra) | 2 (#67 #68) | 3 (#54 #55 #56) | No (Week 11 per schedule) |
| 劉順松 (414551016) | 1 (#73) | 1 (#74) | No (Week 9 per schedule) |
| 林均澔 (junlinwk) | 0 | 0 (4 approvals on #69–#72 have empty bodies) | No (Week 10 per schedule) |

"Substantive" is the instructor's call; #67 (uv projects) and #68 (healthcheck fix) are small. Re-count before submission.
