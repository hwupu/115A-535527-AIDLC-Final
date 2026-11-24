# Merge Day: Team Worksheet
## One session, all four of you together | about 60 minutes (plus ~15 minutes of steward prep) | one worksheet per team

**What this is.** A team session to get `main` clean and running before you submit CP2: every open pull request merged or closed, conflicts resolved together, and the prototype running from beginning to end on a fresh copy.

**What this is not.** It is not a sprint to add features. **Nothing new goes in today.** If someone finishes a feature during the session, it waits for the next pull request after merge day.

**When.** After the walking skeleton and **before you submit CP2** (Monday, November 23, end of day): by **[MERGE DATE]**. Leave time to fix what it uncovers. All four of you, in the same room or on one call with one shared screen.

**What you hand in (for CP2).**
1. The **merge plan entry in `DECISIONS.md`** (Part 0), with its **outcome** added at the end (Part 4)
2. This worksheet, saved in your repository as `docs/merge_day.md`

**How to use it.** One person types into this file while everyone talks; swap the typist at each part. ★ marks the parts to protect if time runs short. If you run out of time, write down what is left, and hand in what you have.

---

## Part 0 ★ | The steward's merge plan (before the session, ~15 min, the current code steward)

Write this as a new entry in `DECISIONS.md` **before** the session, so everyone can read it first.

**List every open branch and pull request:**

| # | Branch / PR | What it does (one line) | Author | Ready? (yes / needs work / close it) | Touches the same files as… |
|---|---|---|---|---|---|
| 1 | | | | | |
| 2 | | | | | |
| 3 | | | | | |
| 4 | | | | | |

**Merge order** (and why this order: for example "small and independent first", "the shared data model before the features that use it"):

> 1.
> 2.
> 3.

**Conflicts we expect** (which files, between which PRs):

> 

**What "done" means today** (one sentence: what must run end to end?):

> 

**PRs we will close without merging, and why:**

> 

---

## Part 1 | Agree the plan (5 min)

Read the steward's plan together. Change the order if someone sees a problem. Then decide who **drives** (types) for each merge: rotate so at least three of you drive.

| Merge # | Driver | Reviewer on screen |
|---|---|---|
| 1 | | |
| 2 | | |
| 3 | | |
| 4 | | |

---

## Part 2 ★ | Merge one at a time (about 35 min)

For **each** pull request, in plan order:

1. **Update it with `main`** (`git pull origin main` on the branch, or "Update branch" on GitHub)
2. **Conflicts? Resolve them together.** Read both sides out loud. If an AI tool proposes a resolution, the driver explains what it keeps and what it drops **before** you accept it. If nobody can explain it, resolve that part by hand
3. **Run the tests and the app** on the branch
4. **Review and merge** (the reviewer on screen approves, with at least one real comment if they have one)
5. **Run the tests and the app again on `main`**. Only then go to the next one

| # | PR | Conflicts? (where) | How we resolved them | Tests after merge (pass / fail) | App runs on `main`? |
|---|---|---|---|---|---|
| 1 | | | | | |
| 2 | | | | | |
| 3 | | | | | |
| 4 | | | | | |

**If something breaks on `main`:** stop merging. Fix it now (one small PR), or revert the last merge (`git revert -m 1 <merge commit>`) and write down why. Do not stack more merges on a broken `main`.

---

## Part 3 ★ | The fresh-clone test (10 min)

Someone who is **not** the steward:

1. Clones the repository into a **new folder** (`git clone <repo> merge_day_check`)
2. Follows **only the README** to install and run it
3. Does the **main task** of your tool from start to finish

| | |
|---|---|
| Who did it | |
| Did the README work without help? (yes / partly / no) | |
| What was missing from the README? | |
| Did the main task work end to end? | |
| Any API key or setup step that only one person knows? | |

Fix small README gaps now. Anything bigger becomes an issue.

---

## Part 4 ★ | Record the outcome (5 min)

**Add the outcome under the steward's merge plan in `DECISIONS.md`:**

> **Outcome ([date]):** merged #__, #__, #__; closed #__ because __. Conflicts in __, resolved by __. Fresh-clone test by __: [worked / worked after fixing __]. `main` is [green / not yet green because __]. Left for after CP2: issues #__, #__.

**Team check** (honestly, in a line each):

1. What made merging harder than it needed to be? (for example: long-lived branches, big PRs, two people editing the same file)
2. One habit we will change for Phase 3:
3. Could each of us run the prototype and do the main task without help? If not, who will practise with whom before CP2?

---

## Quick checklist (for you, not for grading)

☐ The merge plan was in `DECISIONS.md` before the session started
☐ All four of us were there
☐ Every open PR was merged or closed with a reason
☐ Tests and the app were run on `main` after each merge
☐ Someone other than the steward ran the fresh-clone test
☐ The outcome is written under the merge plan
☐ This worksheet is saved as `docs/merge_day.md`
