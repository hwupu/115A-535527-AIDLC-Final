# External user testing protocol - not yet conducted

Two external-user sessions are required for CP2 design rationale. The two CP1 interviews are discovery evidence, not prototype tests. Recruit representative nurses/physicians with consent, no patient data. Do not invent findings. These forms are blank templates and must remain marked NOT CONDUCTED until actual sessions occur.

## Keep the participant's load small (about 15 minutes)

Printable Chinese form (participant page and facilitator page): [`USER_TEST_FORM.md`](USER_TEST_FORM.md).
Scenario cards for the patient role-player, the measured values and the answer key: [`SCENARIO_CARDS.md`](SCENARIO_CARDS.md).

The participant does one task with the tool and answers five short questions. Everything else is observed by the facilitator or read from the system (evaluation mode timing and the audit log), so the participant never fills in a long form. The comparison against paper-then-HIS timing needs a second task, so it is left to the formal evaluation (E9/E10, CP3) rather than these CP2 sessions.

## Before the session (facilitator)

- Pick a fictional scenario (S01, S03 or S04 in `SCENARIO_CARDS.md`) and give a teammate its role-player card to play the patient. The patient answers only from the card and says 「不知道」 or 「沒有」 to anything not on it. The facilitator keeps the measured-values card (read out when the nurse measures) and the answer key (never shown to the nurse).
- Open the admin screen (evaluation mode) and create a run with an anonymous code (U01, U02, …); the participant uses the nurse screen on the facilitator's laptop via `localhost`, so no HTTPS is needed.
- Note the software revision, prompt version and model.

## Consent (read aloud, about 30 seconds)

> 這是課堂專題的原型測試，大約 15 分鐘。病人和病例都是虛構的，請不要提到任何真實病人或醫院的資訊。您說的話會即時轉成文字給系統用，錄音不會保存；紀錄只用代號，不會有您的名字。您隨時可以停止。可以開始嗎？

## Task (about 8 minutes)

The nurse interviews the patient **in their own words and order**, as they would at triage, records with the tool, then reviews the AI drafts, edits what is wrong and confirms. The facilitator starts and finishes the timer in evaluation mode, stays silent, and helps only if asked (and writes down that help was needed). Stop on participant request; report a stopped or failed task rather than excluding it.

## After the task: five questions only (about 5 minutes)

Three ratings, 1 = 非常不同意, 5 = 非常同意:

1. AI 草稿讓我更快完成檢傷紀錄。
2. 我很容易看出哪些是 AI 草稿、哪些已經確認。
3. 如果工作中有這個工具，我會想用。

Two open questions (write down the answer in the participant's words):

4. 用起來最卡、最想改的是哪裡？
5. 如果明天就上線，您最擔心什麼？

If the participant is a physician, add one question after they read the confirmed report: 「發作時間和 TOCC 看得清楚嗎？還需要再問病人什麼？」

## What the facilitator records (no extra work for the participant)

- From the system: time to confirm (evaluation mode), fields the nurse edited (audit log), and each AI draft compared with the scenario card: correct, wrong, missing, or filled although not said.
- Observed: where the participant hesitated or needed help, and the questions they asked and in what order (useful for #86 and #87).

## Session form (repeat once for each session)

- Status: NOT CONDUCTED
- Anonymous code / role / outside-team confirmation:
- Date / facilitator / consent read and given:
- Software revision / prompt / model / scenario:
- Time to confirm / fields edited / AI drafts correct, wrong, missing, filled although not said:
- Help needed and where the participant hesitated:
- Ratings (1–3) and answers to the open questions (4–5), anonymized:
- Design change proposed / implemented / retest outcome:
- Evidence file and limitations:

## Measures

Report per participant: time to confirm, edit count, and AI drafts against the scenario card (correct, wrong, missing, filled although not said), plus the three ratings and the open answers. A wrong vital sign, 量測禁忌 or TOCC value is a safety finding even if the nurse caught it. No statistical significance claims with this small sample. Do not mix machine inference latency with human task time. If model failure forces manual entry, include that time.
