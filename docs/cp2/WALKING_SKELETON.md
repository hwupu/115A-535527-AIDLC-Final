# Walking Skeleton: Team Worksheet
## One session, all four of you together | about 75 minutes | one worksheet per team

> **Group 01 note.** The prototype already runs end to end, so we take Route 2. The AI-failure slice was merged
> before the session (#80) and cannot count again, the CP2 record in #120 is documentary work only. As clarified by 張棨翔 in the #126 comment, it is not the new technical slice required by Parts 3 and 4. Lines left blank are for that member to fill.
> #120 was approved and merged by 劉順松 on 2026-11-26 (`924d688`); lines added after that go in follow-up PRs.
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
| Person B (張棨翔) | Our tool helps emergency triage nurses to write the triage record once and give the doctor a complete handoff by turning the nurse–patient conversation into a draft report that the nurse checks and confirms. |
| Person C (劉順松) | |
| Person D (林均澔) | Our tool helps triage nurses to finish intake records faster by turning the spoken conversation into a quoted draft that the nurse checks. |
| **Agreed sentence** | |

**Did all four sentences match?** ☐ Yes ☐ Mostly ☐ No (not verified; Person C and the agreed sentence are still blank in this version)

If they did not match, that is a useful finding. Write down the difference you had to settle:

> A prior draft said "All agreed", but the complete four-person sentence record is not present; team confirmation remains required.

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

> Route 2. The second user and the prior AI-failure work (#80) are already merged. #120 is an interim documentary record, not a new technical slice. The next thin code slice and its joint implementation still need to be selected and recorded. This follows 張棨翔's comment on #126; #80 cannot count again.

**3. Split the building (with the hand-offs agreed).** Give each person, or each pair, **one building task**: usually one box, or one connection between boxes. Before anyone starts, agree **what each piece receives and returns** (for example "the model step receives the ticket text and returns `{category, summary}`"). This is what lets the pieces connect in Part 3.

| Person or pair | Building task | Receives | Returns | Branch name |
|---|---|---|---|---|
| 張棨翔 | CP2 status refresh after #114–#119 (`docs/cp2/README.md` item 7, report §7) | `main` after #119 | commit on the #120 branch | `docs/cp2-status-refresh` (#120) |
| 吳普軒 | Week 8 steward entry, merge-day record (`MERGE_DAY.md`, outcome in `DECISIONS.md`), these worksheet lines | `main` after #123 | commits on the #120 branch | `docs/cp2-status-refresh` (#120) |
| 劉順松 | Week 12 steward review and merge of #120 and #124; requirement-status notes (`MERGE_DAY.md`, these worksheet lines, `DECISIONS.md`, prompt log) | #120 and #124 heads after #123 | `963acfa` on the #120 branch; merge commits `0a7abf6` (#124) and `924d688` (#120) on `main` | `docs/cp2-status-refresh` (#120) |
| 林均澔 | Week 10 steward entry in `DECISIONS.md` (no pull requests that week) and the header line about the missing Week 10 record; these worksheet lines | `main` after #117 | merged as #119 (`7a31046`) on 2026-11-25, before #120; these lines in a follow-up PR on top of #126 | `docs/week10-steward` (#119), not the #120 branch |

Hand-off agreed: everyone commits to the one branch `docs/cp2-status-refresh`; pull before you edit, and add new
entries to `DECISIONS.md` without rewriting anyone else's.

**Route 2 trace, one box each (explained by someone who did not write it):**

The LLM/API explanations below were initially AI-assisted drafts; 張棨翔 subsequently reported those explanations in the #126 comment. That report is preserved as the source; this review did not observe a live session.

> LLM extraction (written by 張棨翔), explained by 劉順松: `services/llm` receives the transcript at `POST /extract`
> and sends it to Ollama (`gemma3:1b` by default, `LLM_MODEL`) with prompt `v5`, marked as untrusted text and
> constrained to a JSON schema. For v5, numbers and the date of birth are recomputed from the quoted text instead of
> trusting the model; a value that cannot be computed is dropped. A guard then keeps only allowed fields whose quote
> appears word for word in the transcript, and rejects anything like a 檢傷級數, diagnosis or medication advice. If
> Ollama fails or the reply is broken, it returns 503 and the nurse types the fields by hand.
>
> API and report storage (written by 劉順松), explained by 張棨翔: `services/api` keeps each visit as one row in
> SQLite (`data/triage.sqlite`, `DATABASE_URL`) and every action in a separate `audit_events` table. A visit goes
> `intake` (patient) → `ready` → `in_progress` (nurse claims it) → `confirmed`. Text and audio from the WebSocket
> go to the STT and LLM services; AI values are saved as `AI 草稿` and never overwrite a field the nurse edited or
> confirmed. Confirmation is refused while any draft is unconfirmed; the nurse's 檢傷級數 is stored with it, the report
> is then read-only, and the physician reads it at `GET /sessions/{sid}/report`.
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
| Steward review notes (`963acfa`) | 劉順松 | | yes | none; merged #124 and #120 into `main`, CI green on both |
| Week 10 steward entry (#119, `7a31046`) | 林均澔 | | yes, merged into `main` separately before #120 | none |

**Where did it first run end to end?** (a time, or "not yet")

> The prototype already ran end to end before the session (demonstrated in the Week 12 lab). The #120 record: merged into `main`
> on 2026-11-26 at 21:44 (+08:00) by 劉順松 (`924d688`), CI green. 林均澔's lines were still blank at merge.

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
| Link to the merged PR | https://github.com/hwupu/115A-535527-AIDLC-Final/pull/120 (merged 2026-11-26, `924d688`) |
| Steward who reviewed | 劉順松 (Week 12 steward), Codex-assisted repository review; not an on-screen joint-session review |
| Steward's comment (copy it here) | 本次明確查核、審查與合併並核對五份文件變更、GitHub 審查與 main 整合歷史，並修正過早勾選的合併完成欄。核准作為 CP2 的階段性真實紀錄。重要限制：文件型 slice 尚無教師同意可取代技術 walking skeleton 的紀錄；非同步合併不等於四人共同 session，其他成員空白欄與 non-steward fresh-clone 仍待完成。以上既有缺口保留在文件並追蹤 #106，本次核准不宣稱活動或課程要求已全數完成；待本 head CI 全綠後合併。 |
| How the author answered | No reply on the PR: it was approved and merged in the same minute. The limitations the comment lists are kept in this worksheet and tracked in #106. |

**Add one line to `DECISIONS.md`** about the biggest choice you made today (for example, what you cut, what you faked, or a hand-off format you agreed):

> #120 was approved as an interim documentary record only. 張棨翔 clarified in #126 that it is not the walking-skeleton technical slice; a new thin code slice and its actual joint activity remain to be recorded in #106.

---

## Part 5 | Team check (5 min)

Answer these together, honestly. Nobody is graded on how good the answers sound.

**劉順松 - individual perspective, Codex-assisted draft for team confirmation. These answers describe repository work and proposed next steps; they are not minutes of an unverified joint session.**

1. **What worked well in how we worked together today?**

   > 劉順松: From my perspective, using pull requests, written reviews and CI results made our contributions easier to trace. We also kept unfinished requirements visible instead of treating every merged PR as a completed team activity.

   > 張棨翔: each of us added our own part on one shared branch with a clear rule (pull before you edit; add
   > `DECISIONS.md` entries without rewriting anyone else's), so nothing conflicted. The backend boxes were explained
   > by someone who did not write them (劉順松 explained the LLM service, 張棨翔 the API), so the backend is not
   > known by only one person.

2. **What was hard or awkward?** (for example: one person doing most of the typing, long silences, disagreeing about direction, tool problems)

   > 劉順松: Stacked branches made integration confusing: #110 and #111 had been merged into their parent branches, but their changes did not reach `main` until #123. We also needed to distinguish completed implementation from unfinished collaboration records.

   > 張棨翔: it was hard to get all four of us together at one time, so much of the work happened separately and the
   > on-screen explanations and review were thin. The #120 documents are a record, not the code slice the session
   > asks for, so we still need to build one thin code slice together. The frontend boxes could only be explained by
   > 吳普軒, and 林均澔's parts were still blank at merge.

3. **Who had the least chance to contribute, and what would help next time?** (Route 2: was there a box only one person could explain? What will we do about it?)

   > 吳普軒: the frontend boxes were written mostly by 吳普軒 alone, so only 吳普軒 could explain them; next time a
   > teammate pairs with 吳普軒 on a frontend change.

   > 劉順松: We have not established who had the least opportunity to contribute. Frontend knowledge was concentrated with 吳普軒. Next time, I propose explaining the nurse-confirmation-to-physician-report flow myself, with 吳普軒 checking my explanation, so another member can understand and maintain that path.

4. **What is the one thing we will do differently in the next team session** (merge day)?

   > 林均澔: the author replies to the steward's comment before the PR is merged (#120's comment got no reply).

   > 劉順松: Before each merge, we will check that the PR targets `main`; after merging, we will verify that the intended feature actually appears and works on `main`. This is my proposed next-session practice, pending team agreement.

5. **Blockers we found** (technical or otherwise) and who will follow up:

   > #110 (#87) and #111 (#28) were approved but missed `main` through a stacked merge; fixed in #123 (吳普軒). The
   > fresh-clone test is still to do (a non-steward, before E3).

   > 劉順松: Integration of #110/#111 was corrected in #123. My closeout changes are in #125, with review requested from 吳普軒. A real non-steward still needs to follow only the README and complete nurse confirmation -> physician report; the team must confirm the tester. The joint technical slice, participant explanations and joint-session records remain unverified. The team and #106 coordinator need to arrange completion or seek instructor approval for a specific alternative.

---

## Quick checklist (for you, not for grading)

☐ All four of us were present for the session
☐ All four of us built a piece, and each piece was explained by someone who did not write it
☐ We have one agreed sentence about what the tool does
☐ The pieces connected and something ran from input to output (Route 2: the new slice works), even if some parts were faked
☐ The PR was reviewed by the steward with at least one real comment, and merged
☐ We saved this worksheet as `docs/walking_skeleton.md` and added a line to `DECISIONS.md`

If you could not tick all of these, that is okay. Write what happened in Part 5 and submit what you have.
