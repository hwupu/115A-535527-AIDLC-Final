# External user testing protocol

Two external-user sessions are required for CP2 design rationale. The two CP1 interviews are discovery evidence, not prototype tests. Recruit representative nurses/physicians with consent, no patient data. Do not invent findings. Two sessions have been held (U01, U02 under Sessions below) and more will follow; each new session gets its own record there, copied from the facilitator's form. The Session form below is the blank template.

## Keep the participant's load small (about 15 minutes)

Printable Chinese form (participant page and facilitator page): [`USER_TEST_FORM.md`](USER_TEST_FORM.md).
Scenario cards for the patient role-player, the measured values and the answer key: [`SCENARIO_CARDS.md`](SCENARIO_CARDS.md).

The participant does one task with the tool and answers five short questions. Everything else is observed by the facilitator or read from the system (evaluation mode timing and the audit log), so the participant never fills in a long form. The comparison against paper-then-HIS timing needs a second task, so it is left to the formal evaluation (E9/E10, CP3) rather than these CP2 sessions.

## Before the session (facilitator)

- Pick a fictional scenario (S01, S03 or S04 in `SCENARIO_CARDS.md`) and give a teammate its role-player card to play the patient. The patient answers only from the card and says 「不知道」 or 「沒有」 to anything not on it. The facilitator keeps the measured-values card (read out when the nurse measures) and the answer key (never shown to the nurse).
- Open the admin screen (evaluation mode) and create a run with an API-compatible anonymous participant code (N-01, N-02, …; the API requires N- followed by two digits). U01/U02 below are document session labels, not valid API participant codes; record their actual N-xx mapping from the facilitator, never infer a past mapping; the participant uses the nurse screen on the facilitator's laptop via `localhost`, so no HTTPS is needed.
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

- Status: CONDUCTED / STOPPED (reason)
- Anonymous code / role / outside-team confirmation:
- Date / facilitator / consent read and given:
- Software revision / prompt / model / scenario:
- Time to confirm / fields edited / AI drafts correct, wrong, missing, filled although not said:
- Help needed and where the participant hesitated:
- Ratings (1–3) and answers to the open questions (4–5), anonymized:
- Design change proposed / implemented / retest outcome:
- Evidence file and limitations:

## Sessions

Fields marked 待補 were not reported yet; they are filled from the facilitator's form (`USER_TEST_FORM.md` page 2),
never estimated. Follow-up: #101.

### U01 (測試者 A)

- Status: CONDUCTED; questionnaire answers recorded, other fields 待補
- Anonymous code / role / outside-team confirmation: U01 / 待補 / 待補
- Date / facilitator / consent read and given: 待補 / 待補 / 待補
- Software revision / prompt / model / scenario: 待補
- Time to confirm / fields edited / AI drafts correct, wrong, missing, filled although not said: 待補
- Help needed and where the participant hesitated: 待補
- Ratings (1–3) and answers to the open questions (4–5), anonymized: 5 / 5 / 5. Q4: 「更正式的 PDF 格式，又或者對接醫院系統。」 Q5: 「有沒有考慮到多台裝置負載的問題」
- Design change proposed / implemented / retest outcome: formal printout → #99 (ED-style printed triage record, implemented, retest 待補); hospital-system integration → not doing, because the scope excludes writing to a real HIS; multi-device load → #100 (load test, not started)
- Evidence file and limitations: paper form (to be destroyed after transcription); one participant

### U02 (測試者 B)

- Status: CONDUCTED; questionnaire answers recorded, other fields 待補
- Anonymous code / role / outside-team confirmation: U02 / 待補 / 待補
- Date / facilitator / consent read and given: 待補 / 待補 / 待補
- Software revision / prompt / model / scenario: 待補
- Time to confirm / fields edited / AI drafts correct, wrong, missing, filled although not said: 待補
- Help needed and where the participant hesitated: 待補
- Ratings (1–3) and answers to the open questions (4–5), anonymized: 5 / 5 / 5. Q4: 「如果可以辨別對話的角色。」 Q5: 「會比較在意資料摘要的精準度。」
- Design change proposed / implemented / retest outcome: speaker roles → #102 (AI labels each line's speaker from its content, the nurse can correct it; PO decision 2026-11-23), voice-based separation with pyannote kept for later in #9; summary accuracy → #45 (formal evaluation with held-out cases and a nurse-checked answer key), #89 (medical vocabulary hints)
- Evidence file and limitations: paper form (to be destroyed after transcription); one participant

## Measures

Report per participant: time to confirm, edit count, and AI drafts against the scenario card (correct, wrong, missing, filled although not said), plus the three ratings and the open answers. A wrong vital sign, 量測禁忌 or TOCC value is a safety finding even if the nurse caught it. No statistical significance claims with this small sample. Do not mix machine inference latency with human task time. If model failure forces manual entry, include that time.


## 2026-11-24 review boundary

U01/U02 are author-reported questionnaire records. This review did not observe the sessions or independently verify outside-team status, consent, date or scenario. Those fields remain pending in #101. Until the facilitator supplies them, merging these documents does not certify the two qualifying outside-team prototype sessions are fully evidenced. Do not infer task-time improvement from the subjective ratings, or replace missing observations with estimates.
