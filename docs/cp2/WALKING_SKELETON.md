# Walking Skeleton: Team Worksheet
## One session, all four of you together | about 75 minutes | one worksheet per team

> **Group 01 note.** The prototype already runs end to end, so we take Route 2. The AI-failure slice was merged
> before the session (#80) and cannot count again, so Parts 3 and 4 use the CP2 record in #120: each member adds
> their own part on one branch, and the steward reviews the one PR. Lines left blank are for that member to fill.
> **Review limitation (2026-11-26, 劉順松, Codex-assisted):** this document-only PR is an interim record, not evidence that the required joint technical slice or four-person session happened. The proposed substitution needs instructor acceptance. Blank participant entries remain uncompleted; merging this record does not complete the walking-skeleton requirement. Tracking: #106.
> Instructor's blank original: `docs/references/walking_skeleton_worksheet.md`.

**What this is.** A single working session where your team gets the thinnest possible version of your tool running from input to output, together. It does not need to be good. It needs to **run**, and all four of you need to have had your hands on it.

**What this is not.** It is not a list of things to finish. If you only complete Parts 1 to 4, that is a good session. Your teamwork during these 75 minutes matters more than how much code you end up with.

**When.** First of the two team sessions, before merge day and before you submit CP2: by **[DATE]**. Pick a time when all four of you can be together, in the same room or on one call where you can share a screen.

**Already have something running?** Good. Part 2 has a route for you: you trace the path together, then build the next thin slice.

**What you hand in (for CP2).**
1. This worksheet, filled in and saved in your repo as `docs/walking_skeleton.md`
2. A link to the **merged pull request** from this session

*Companion pages: `team_sessions_guide.md` (what both team sessions are for) and `merge_day_worksheet.md` (the next session).*

**Before you start (5 minutes, everyone).** Each of you will build a piece, so make sure **everyone can clone the repo and run the project on their own machine**. You will also need **one shared screen** for connecting the pieces (Part 3b) and for the review (Part 4). API keys stay in environment variables. Never paste a key into the worksheet, the PR or a chat.

---

## How to use this worksheet

- **One person types** into this file while everyone talks. Swap the typist at each Part.
- Answers can be short. A sentence is fine.
- ★ marks the parts to protect if time runs short. Parts without a ★ can be shortened or skipped. Write "skipped, no time" and move on; that is a fine answer.
- If something blocks you, **do not hide it**. Write it in Part 5. A blocker found now is the point of this session.

---

## Part 1 ★ | Say what the tool does in one sentence (10 min)

Take turns: each person writes their own sentence **alone for 2 minutes**, then read all four aloud and agree on one.

> Our tool helps **[who]** to **[do what]** by **[how, in plain words]**.

| | Sentence |
|---|---|
| Person A (吳普軒) | Our tool helps triage nurses to type less during intake by listening to the conversation and pre-filling fields with quotes from it, while the nurse still decides 檢傷級數. |
| Person B (張棨翔) | |
| Person C (劉順松) | |
| Person D (林均澔) | |
| **Agreed sentence** | |

**Did all four sentences match?** ☐ Yes ☐ Mostly ☐ No

If they did not match, that is a useful finding. Write down the difference you had to settle:

> 

---

## Part 2 ★ | Draw the path and split the work (10 min)

**1. Draw the path (3 min).** On a whiteboard, paper or shared screen, draw the shortest path from **what the user gives the tool** to **what the tool gives back**. Three to five boxes is plenty.

```
[Patient and nurse speak] -> [STT: transcript] -> [LLM: draft fields with quotes] -> [Nurse checks and confirms] -> [Physician reads the report]
```

(The API stores each step; the nurse decides 檢傷級數, the AI never does.)

**2. Check where you are.** *Can we do our main task from start to finish today, on one machine, without faking anything?*

☐ **No (Route 1).** Decide the smallest piece of this path that would count as "it runs" (one example going through). Cut everything else. Today you build that.

☑ **Yes (Route 2).** Your skeleton already walks. First **trace it (about 5 min):** for each box, someone **who did not write it** opens the code and explains it in a minute. Mark any box only its author could explain, and anything still hard-coded or faked. Then choose **the next thin slice** to build today, the first of these that applies:
1. something on the path that is still **faked or hard-coded**
2. **the second person:** CP2 needs a prototype "two people can use together"; if only one user can use it, connect the second
3. **one failure state** for the AI call (a time-out or a broken reply), with a test that uses a fake model (Week 11)

**Our goal for today** (one example, going in as ____, coming out as ____; or, Route 2: the slice we chose):

> Route 2. Nothing on the path is faked any more, and the second user (physician) and the AI failure state (#80) are
> already merged. So today's slice is the CP2 record in #120: each member adds their own part to the shared documents
> on one branch, and the steward reviews it.

**3. Split the building (with the hand-offs agreed).** Give each person, or each pair, **one building task**: usually one box, or one connection between boxes. Before anyone starts, agree **what each piece receives and returns** (for example "the model step receives the ticket text and returns `{category, summary}`"). This is what lets the pieces connect in Part 3.

| Person or pair | Building task | Receives | Returns | Branch name |
|---|---|---|---|---|
| 張棨翔 | CP2 status refresh after #114–#119 (`docs/cp2/README.md` item 7, report §7) | `main` after #119 | commit on the #120 branch | `docs/cp2-status-refresh` (#120) |
| 吳普軒 | Week 8 steward entry, merge-day record (`MERGE_DAY.md`, outcome in `DECISIONS.md`), these worksheet lines | `main` after #123 | commits on the #120 branch | `docs/cp2-status-refresh` (#120) |
| 劉順松 | | | | `docs/cp2-status-refresh` (#120) |
| 林均澔 | | | | `docs/cp2-status-refresh` (#120) |

Hand-off agreed: everyone commits to the one branch `docs/cp2-status-refresh`; pull before you edit, and add new
entries to `DECISIONS.md` without rewriting anyone else's.

**Route 2 trace, one box each (explained by someone who did not write it):**

> LLM extraction, explained by: 
>
> API and report storage, explained by: 
>
> Frontend screens (written by 吳普軒), explained by: 
>
> STT, explained by 吳普軒: `services/stt` receives the whole recorded clip at `POST /transcribe` and returns the
> transcript. It runs faster-whisper (`small` by default, `WHISPER_MODEL`) in Chinese with `beam_size=5` and a VAD
> filter that skips silence. At start-up it uses the GPU if a one-second silent test works (float16), otherwise the
> CPU (int8), and the reply says which device was used.

**Route 2 only: boxes only their author could explain** (these become a pairing or review task after today):

> Frontend boxes (patient, nurse and physician screens): mostly written by 吳普軒 alone. Follow-up: a teammate pairs
> with 吳普軒 on the next frontend change.

**Things we are leaving out on purpose today:**

> New features and code changes (#120 is documents only); the fresh-clone test, which belongs to merge day.

---

## Part 3 ★ | Build your piece, then connect them together (30 min)

**3a. Build (20 min, separately).** Each person or pair builds their task on their own branch, using the hand-offs from Part 2. AI tools are fine, but **you must be able to explain what you keep**. Stuck for about five minutes? **Fake it at your edge:** return a hard-coded answer in the agreed format so the others are not blocked, and write down what you faked.

**3b. Connect (10 min, together, one shared screen).** Bring the pieces into one branch (`skeleton`), **one piece at a time, in path order**. For each piece:
1. **Someone who did not write it** reads it and says in one or two sentences what it does. The author corrects them if needed
2. Merge it into `skeleton` and **run the example through**
3. If the connection fails, fix it together: usually the hand-off format did not match

| Piece | Built by | Explained by | Connected? (yes / with a fix / not yet) | What we had to fix at the connection |
|---|---|---|---|---|
| CP2 status refresh (`b50103d`) | 張棨翔 | | yes | rebased onto `main` after #123, no conflicts |
| Week 8 steward entry (`f39a093`) | 吳普軒 | | yes | none |
| Merge-day record (`338c2df`) and worksheet lines | 吳普軒 | | yes | none |
| | 劉順松 | | | |
| | 林均澔 | | | |

**Where did it first run end to end?** (a time, or "not yet")

> The prototype already ran end to end before the session (demonstrated in the Week 12 lab). The #120 record: not yet
> (open until every member's part is in).

**What did we fake or stub?** (it is fine to fake things; write them down so you do not forget)

> Nothing faked. Merge day was recorded from GitHub history (each member's last feature PR) instead of one joint
> session; `MERGE_DAY.md` says so.

---

## Part 4 ★ | Open the pull request together (15 min)

1. Open **one pull request** from your `skeleton` branch to `main` (it keeps everyone's commits, so all four of you show in the history), using your PR template. Fill in **"What this PR does"** in your own words, with the **author reading it aloud**.
2. The **current code steward** reviews it **on screen with everyone watching**. The steward leaves at least one real comment: a question, a concern, or a specific suggestion. "Looks good" on its own does not count.
3. The author responds to the comment (answers it or changes the code).
4. The steward approves and merges.

If your team is changing stewards, the incoming steward approves this one as their first action. If you are unsure whose turn it is, check `DECISIONS.md`.

| | |
|---|---|
| Link to the merged PR | https://github.com/hwupu/115A-535527-AIDLC-Final/pull/120 (open) |
| Steward who reviewed | 劉順松 (Week 12 steward), Codex-assisted repository review; not an on-screen joint-session review |
| Steward's comment (copy it here) | |
| How the author answered | |

**Add one line to `DECISIONS.md`** about the biggest choice you made today (for example, what you cut, what you faked, or a hand-off format you agreed):

> Proposed: the Route 2 slice is the shared CP2 record in #120 (one branch, everyone's part), not new code, because
> the path, the second user and the AI failure state were already merged.

---

## Part 5 | Team check (5 min)

Answer these together, honestly. Nobody is graded on how good the answers sound.

1. **What worked well in how we worked together today?**

   > From my perspective, using pull requests, written reviews and CI results made our contributions easier to trace. We also kept unfinished requirements visible instead of treating every merged PR as a completed team activity.

2. **What was hard or awkward?** (for example: one person doing most of the typing, long silences, disagreeing about direction, tool problems)

   > 

3. **Who had the least chance to contribute, and what would help next time?** (Route 2: was there a box only one person could explain? What will we do about it?)

   > 吳普軒: the frontend boxes were written mostly by 吳普軒 alone, so only 吳普軒 could explain them; next time a
   > teammate pairs with 吳普軒 on a frontend change.

4. **What is the one thing we will do differently in the next team session** (merge day)?

   > 

5. **Blockers we found** (technical or otherwise) and who will follow up:

   > #110 (#87) and #111 (#28) were approved but missed `main` through a stacked merge; fixed in #123 (吳普軒). The
   > fresh-clone test is still to do (a non-steward, before E3).

---

## Quick checklist (for you, not for grading)

☐ All four of us were present for the session
☐ All four of us built a piece, and each piece was explained by someone who did not write it
☐ We have one agreed sentence about what the tool does
☐ The pieces connected and something ran from input to output (Route 2: the new slice works), even if some parts were faked
☐ The PR was reviewed by the steward with at least one real comment, and merged
☐ We saved this worksheet as `docs/walking_skeleton.md` and added a line to `DECISIONS.md`

If you could not tick all of these, that is okay. Write what happened in Part 5 and submit what you have.

