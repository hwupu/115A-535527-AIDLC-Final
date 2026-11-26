# Merge Day: Team Worksheet (Group 01)

Instructor's blank original: `docs/references/merge_day_worksheet.md`.

**Requirement status:** this is an asynchronous integration record. It does not establish completion of the required joint session or the non-steward fresh-clone task. Both remain open in #106; a member being on leave does not establish their participation.

**How we did it.** We did not hold merge day as one 60-minute call. The merges it asks for happened as reviewed pull
requests into `main` between 2026-11-21 and 2026-11-26. This record takes each member's **last main feature PR
merged into `main`** and fills in the worksheet from GitHub: the merge commit, who merged it (driver), who
approved it (reviewer), conflicts, and CI on `main` after the merge. Anything we did not do is marked as not done.

---

## Part 0 | Merge plan: the last main feature from each member

| # | PR | What it does (one line) | Author | Ready? | Touches the same files as… |
|---|---|---|---|---|---|
| 1 | #80 (`feat/414551016-skeleton-ai-failure`) | Malformed AI responses are reported as errors instead of crashing or passing as success | 劉順松 | yes, merged | none (5 new or LLM-service files) |
| 2 | #82 (`feat/22-transcript-panel`) | C3 live transcript: timestamps, partial results, follow-scroll | 林均澔 | yes, merged | nurse screen (`apps/web`) |
| 3 | #117 (`feat/88-stt-gpu`) | Whisper runs on the GPU when it works, CPU otherwise | 張棨翔 | yes, merged | `DECISIONS.md` (with #109, #116) |
| 4 | #123 (`fix/restore-87-28`) | Brings the approved #110 (#87 查核表) and #111 (#28 keyboard shortcuts) into `main` | 吳普軒 | yes, merged | nurse screen (`apps/web`), after #109 |

**Merge order** (the order they actually reached `main`):

> 1. #80, 2026-11-21: independent of the others; the AI-failure handling the walking skeleton builds on.
> 2. #82, 2026-11-22: frontend only; updated with `main` first.
> 3. #117, 2026-11-24: STT service and compose files, plus its `DECISIONS.md` entry.
> 4. #123, 2026-11-26: last, because it restores code that was stacked on #109 (merged 2026-11-25).

**Conflicts we expected:** `DECISIONS.md`, because almost every PR adds an entry there.

**What "done" means:** every member's latest feature is on `main`, CI is green after each merge, and the nurse
confirmation → physician report task runs from `README.md` on a fresh clone.

**PRs we closed without merging, and why:** none. #124 (README cover image) and #120 (this record) were approved and
merged by 劉順松 on 2026-11-26 (`0a7abf6`, `924d688`), CI green on both. After that, #125 (CP2 closeout, 劉順松) was
opened and is still open.

---

## Part 1 | Drivers and reviewers

Driver = who merged the PR; reviewer = who approved it with a written review.

| Merge # | Driver | Reviewer |
|---|---|---|
| 1 (#80) | 張棨翔 | 張棨翔 |
| 2 (#82) | 林均澔 | 張棨翔 |
| 3 (#117) | 吳普軒 | 吳普軒 (approved); 劉順松 (commented) |
| 4 (#123) | 吳普軒 | 劉順松 (approved the same code in #110 and #111) |

Three of us drove a merge (張棨翔, 林均澔, 吳普軒); 劉順松 reviewed but did not drive one of these four.

---

## Part 2 | Merge one at a time

| # | PR | Merge commit | Conflicts? (where) | How we resolved them | CI on `main` after merge | App runs on `main`? |
|---|---|---|---|---|---|---|
| 1 | #80 | `8e1fc8b` | no | — | pass (web, api, stt, llm, docker-build) | not recorded |
| 2 | #82 | `d7fb24e` | no (updated with `main` in `378647f`, clean) | — | pass (all five) | not recorded |
| 3 | #117 | `234b417` | `DECISIONS.md`, with #109 and #116 | resolved in #109 (`4c00ace`) and #116 (`6bdf1a8`), keeping both sides' entries | pass (all five) | not recorded |
| 4 | #123 | `47a41f1` | no | — | pass (all five); locally: web lint, typecheck, 93 tests | not recorded |

**Something we had to fix on `main`.** #110 and #111 were approved and merged, but into the stacked branches
`feat/86-patient-guided-questions` and `feat/87-nurse-checklist`, seconds *after* #109 had already merged `feat/86`
into `main` (2026-11-25 00:17–00:18 UTC). So their code never reached `main`, and #87 and #28 stayed open. #122
brought it in on 2026-11-26, was reverted (`d0af760`) while we checked what had happened, and #123 restored it by
reverting the revert. The same thing happened once before: #69 re-sent #66 to `main` (2026-11-04).

---

## Part 3 | The fresh-clone test

| | |
|---|---|
| Who did it | not done yet (must be a non-steward, i.e. not 劉順松) |
| Did the README work without help? | not done yet |
| What was missing from the README? | not done yet |
| Did the main task work end to end? | not done yet |
| Any API key or setup step that only one person knows? | not done yet |

---

## Part 4 | Outcome

**Outcome (2026-11-26):** merged #80, #82, #117 and #123 (each member's last main feature); closed none. Conflicts in
`DECISIONS.md`, resolved by keeping both sides' entries. #110 and #111 missed `main` through a stacked merge and were
restored in #123. Then #124 and #120 (this record) were merged by 劉順松. Fresh-clone test: not done yet. `main` is green (CI passed on every merge commit above). Left for
after CP2: the fresh-clone test if it is not done before E3.

**Team check:**

1. What made merging harder than it needed to be? Almost every PR adds an entry to `DECISIONS.md`, so they conflict
   there (four merge commits on 11/24–11/25); and stacked PRs, which let approved work miss `main` twice (#69, #123).
2. One habit we will change for Phase 3 (吳普軒): once a parent PR merges, retarget the PRs stacked on it to `main`,
   and check the feature is actually on `main`.
3. Could each of us run the prototype and do the main task without help? not recorded yet.

---

## Quick checklist

☐ The merge plan was in `DECISIONS.md` before the session started (a plan was drafted in the Week 12 entry; the
  merges did not follow one session)
☐ All four of us were there (no joint session)
☐ Every open PR was merged or closed with a reason (#120 and #124 merged; #125 opened afterwards and is still open)
☑ Tests were run on `main` after each merge (CI); the app run was not recorded
☐ Someone other than the steward ran the fresh-clone test
☑ The outcome is written under the merge plan
☑ This worksheet is saved (as `docs/cp2/MERGE_DAY.md`)
