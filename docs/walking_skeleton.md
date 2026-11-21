# Walking Skeleton: Team Worksheet
## One session, all four of you together | about 75 minutes | one worksheet per team

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
| Person A | |
| Person B | |
| Person C | |
| Person D | |
| **Agreed sentence** | |

**Did all four sentences match?** ☐ Yes ☐ Mostly ☐ No

If they did not match, that is a useful finding. Write down the difference you had to settle:

> 

---

## Part 2 ★ | Draw the path and split the work (10 min)

**1. Draw the path (3 min).** On a whiteboard, paper or shared screen, draw the shortest path from **what the user gives the tool** to **what the tool gives back**. Three to five boxes is plenty.

```
[User input] -> [ ... ] -> [ ... ] -> [Output the user sees]
```

**2. Check where you are.** *Can we do our main task from start to finish today, on one machine, without faking anything?*

☐ **No (Route 1).** Decide the smallest piece of this path that would count as "it runs" (one example going through). Cut everything else. Today you build that.

☐ **Yes (Route 2).** Your skeleton already walks. First **trace it (about 5 min):** for each box, someone **who did not write it** opens the code and explains it in a minute. Mark any box only its author could explain, and anything still hard-coded or faked. Then choose **the next thin slice** to build today, the first of these that applies:
1. something on the path that is still **faked or hard-coded**
2. **the second person:** CP2 needs a prototype "two people can use together"; if only one user can use it, connect the second
3. **one failure state** for the AI call (a time-out or a broken reply), with a test that uses a fake model (Week 11)

**Our goal for today** (one example, going in as ____, coming out as ____; or, Route 2: the slice we chose):

> 

**3. Split the building (with the hand-offs agreed).** Give each person, or each pair, **one building task**: usually one box, or one connection between boxes. Before anyone starts, agree **what each piece receives and returns** (for example "the model step receives the ticket text and returns `{category, summary}`"). This is what lets the pieces connect in Part 3.

| Person or pair | Building task | Receives | Returns | Branch name |
|---|---|---|---|---|
| | | | | |
| | | | | |
| | | | | |
| | | | | |

**Route 2 only: boxes only their author could explain** (these become a pairing or review task after today):

> 

**Things we are leaving out on purpose today:**

> 

---

## Part 3 ★ | Build your piece, then connect them together (30 min)

**3a. Build (20 min, separately).** Each person or pair builds their task on their own branch, using the hand-offs from Part 2. AI tools are fine, but **you must be able to explain what you keep**. Stuck for about five minutes? **Fake it at your edge:** return a hard-coded answer in the agreed format so the others are not blocked, and write down what you faked.

**3b. Connect (10 min, together, one shared screen).** Bring the pieces into one branch (`skeleton`), **one piece at a time, in path order**. For each piece:
1. **Someone who did not write it** reads it and says in one or two sentences what it does. The author corrects them if needed
2. Merge it into `skeleton` and **run the example through**
3. If the connection fails, fix it together: usually the hand-off format did not match

| Piece | Built by | Explained by | Connected? (yes / with a fix / not yet) | What we had to fix at the connection |
|---|---|---|---|---|
| | | | | |
| | | | | |
| | | | | |
| | | | | |

**Where did it first run end to end?** (a time, or "not yet")

> 

**What did we fake or stub?** (it is fine to fake things; write them down so you do not forget)

> 

---

## Part 4 ★ | Open the pull request together (15 min)

1. Open **one pull request** from your `skeleton` branch to `main` (it keeps everyone's commits, so all four of you show in the history), using your PR template. Fill in **"What this PR does"** in your own words, with the **author reading it aloud**.
2. The **current code steward** reviews it **on screen with everyone watching**. The steward leaves at least one real comment: a question, a concern, or a specific suggestion. "Looks good" on its own does not count.
3. The author responds to the comment (answers it or changes the code).
4. The steward approves and merges.

If your team is changing stewards, the incoming steward approves this one as their first action. If you are unsure whose turn it is, check `DECISIONS.md`.

| | |
|---|---|
| Link to the merged PR | |
| Steward who reviewed | |
| Steward's comment (copy it here) | |
| How the author answered | |

**Add one line to `DECISIONS.md`** about the biggest choice you made today (for example, what you cut, what you faked, or a hand-off format you agreed):

> 

---

## Part 5 | Team check (5 min)

Answer these together, honestly. Nobody is graded on how good the answers sound.

1. **What worked well in how we worked together today?**

   > 

2. **What was hard or awkward?** (for example: one person doing most of the typing, long silences, disagreeing about direction, tool problems)

   > 

3. **Who had the least chance to contribute, and what would help next time?** (Route 2: was there a box only one person could explain? What will we do about it?)

   > 

4. **What is the one thing we will do differently in the next team session** (merge day)?

   > 

5. **Blockers we found** (technical or otherwise) and who will follow up:

   > 

---

## Quick checklist (for you, not for grading)

☐ All four of us were present for the session
☐ All four of us built a piece, and each piece was explained by someone who did not write it
☐ We have one agreed sentence about what the tool does
☐ The pieces connected and something ran from input to output (Route 2: the new slice works), even if some parts were faked
☐ The PR was reviewed by the steward with at least one real comment, and merged
☐ We saved this worksheet as `docs/walking_skeleton.md` and added a line to `DECISIONS.md`

If you could not tick all of these, that is okay. Write what happened in Part 5 and submit what you have.

