# External user testing protocol

Two external-user sessions are required for CP2 design rationale. The two CP1 interviews are discovery evidence, not prototype tests. Recruit representative nurses/physicians with consent, no patient data. Do not invent findings. Four participants took part in two paired task runs (U01–U04 under Sessions below) and more will follow; each new session gets its own record there, copied from the facilitator's form. The Session form below is the blank template.

## Keep the participant's load small (about 15 minutes)

Printable Chinese form (participant page and facilitator page): [`USER_TEST_FORM.md`](USER_TEST_FORM.md).
Scenario cards for the patient role-player, the measured values and the answer key: [`SCENARIO_CARDS.md`](SCENARIO_CARDS.md).

The participant does one task with the tool and answers five short questions. Everything else is observed by the facilitator or read from the system (evaluation mode timing and the audit log), so the participant never fills in a long form. The comparison against paper-then-HIS timing needs a second task, so it is left to the formal evaluation (E9/E10, CP3) rather than these CP2 sessions.

## Before the session (facilitator)

- Pick a fictional scenario (S01, S03 or S04 in `SCENARIO_CARDS.md`) and give a teammate its role-player card to play the patient. The patient answers only from the card and says 「不知道」 or 「沒有」 to anything not on it. The facilitator keeps the measured-values card (read out when the nurse measures) and the answer key (never shown to the nurse).
- Open the admin screen (evaluation mode) and create a run with an API-compatible anonymous participant code (N-01, N-02, …; the API requires N- followed by two digits). U01–U04 below are document session labels, not valid API participant codes; record their actual N-xx mapping from the facilitator, never infer a past mapping; the participant uses the nurse screen on the facilitator's laptop via `localhost`, so no HTTPS is needed.
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
never estimated. Timing, edits and AI draft values come from the demo database (session timestamps and audit log); the comparison with the S03 answer key was done by the coding assistant and still needs a nurse to check it. Follow-up: #101.

### U01 (測試者 A)

- Status: CONDUCTED; questionnaire answers, system records (timing, audit log) and facilitator observations recorded
- Anonymous code / role / outside-team confirmation: U01 / 其他 / confirmed not a team member
- Date / facilitator / consent read and given: 2026-11-23 / 張棨翔 / yes
- Software revision / prompt / model / scenario: demo environment on the workstation (build of the morning of 2026-11-23, commit not recorded) / v5 / gemma4:e4b, Whisper small / S03. U01 operated the nurse screen and U02 played the patient from the S03 card (demo session SIM-000008); this participant: nurse screen operator
- Time to confirm / fields edited / AI drafts correct, wrong, missing, filled although not said: 5 min 02 s (audio 57.9 s; the first AI draft took 117 s) / 1 / of 17 AI drafts against the S03 answer key: 14 correct, 2 wrong (systolic BP 2 instead of 158; history 「感冒」 instead of 洗腎), 1 doubtful (病程 「昨天沒有去洗腎」), missing 3 (主訴, 陪同 rejected by the source check, 血壓部位), filled although not said 0. **Safety finding:** the wrong systolic BP was first confirmed and corrected by the nurse 11 s later; STT heard 血壓 as 「斜壓兩」 and the number check took 「兩」 as the value. The 量測禁忌 quote kept an STT error (毆管 for 瘻管)
- Help needed and where the participant hesitated: hesitated when the transcript and the 量測禁忌 draft showed the STT error for 瘻管 (毆管 on 11-23, 樓管 on 11-24); hesitated while waiting for the AI draft after the transcript appeared. No help needed; task completed (report confirmed)
- Ratings (1–3) and answers to the open questions (4–5), anonymized: 5 / 5 / 5. Q4: 「更正式的 PDF 格式，又或者對接醫院系統。」 Q5: 「有沒有考慮到多台裝置負載的問題」
- Design change proposed / implemented / retest outcome: formal printout → #99 (ED-style printed triage record, implemented; retested on 2026-11-24 with U03/U04, who found it more formal but said getting the data into the HIS matters more than the printout); hospital-system integration → not doing, because the scope excludes writing to a real HIS; PO decision 2026-11-24: keep copy text, print and JSON download as the exports; multi-device load → #100 (load test, not started); facilitator observation: show partial AI drafts as soon as the first part of the transcript is ready instead of all at once (#112); STT misspelling of 瘻管 → #89 (medical vocabulary hints)
- Evidence file and limitations: paper form (to be destroyed after transcription); demo database on the workstation (simulated data only); timing and AI accuracy belong to the run, which the two participants did together (one as nurse, one as patient)

### U02 (測試者 B)

- Status: CONDUCTED; questionnaire answers, system records (timing, audit log) and facilitator observations recorded
- Anonymous code / role / outside-team confirmation: U02 / 其他 / confirmed not a team member
- Date / facilitator / consent read and given: 2026-11-23 / 張棨翔 / yes
- Software revision / prompt / model / scenario: demo environment on the workstation (build of the morning of 2026-11-23, commit not recorded) / v5 / gemma4:e4b, Whisper small / S03. U01 operated the nurse screen and U02 played the patient from the S03 card (demo session SIM-000008); this participant: patient (S03 card)
- Time to confirm / fields edited / AI drafts correct, wrong, missing, filled although not said: 5 min 02 s (audio 57.9 s; the first AI draft took 117 s) / 1 / of 17 AI drafts against the S03 answer key: 14 correct, 2 wrong (systolic BP 2 instead of 158; history 「感冒」 instead of 洗腎), 1 doubtful (病程 「昨天沒有去洗腎」), missing 3 (主訴, 陪同 rejected by the source check, 血壓部位), filled although not said 0. **Safety finding:** the wrong systolic BP was first confirmed and corrected by the nurse 11 s later; STT heard 血壓 as 「斜壓兩」 and the number check took 「兩」 as the value. The 量測禁忌 quote kept an STT error (毆管 for 瘻管)
- Help needed and where the participant hesitated: hesitated when the transcript and the 量測禁忌 draft showed the STT error for 瘻管 (毆管 on 11-23, 樓管 on 11-24); hesitated while waiting for the AI draft after the transcript appeared. No help needed; task completed (report confirmed)
- Ratings (1–3) and answers to the open questions (4–5), anonymized: 5 / 5 / 5. Q4: 「如果可以辨別對話的角色。」 Q5: 「會比較在意資料摘要的精準度。」
- Design change proposed / implemented / retest outcome: speaker roles → #102 (AI labels each line's speaker from its content, the nurse can correct it; PO decision 2026-11-23), voice-based separation with pyannote kept for later in #9; summary accuracy → #45 (formal evaluation with held-out cases and a nurse-checked answer key), #89 (medical vocabulary hints)
- Evidence file and limitations: paper form (to be destroyed after transcription); demo database on the workstation (simulated data only); timing and AI accuracy belong to the run, which the two participants did together (one as nurse, one as patient)

### U03 (測試者 C)

- Status: CONDUCTED; questionnaire answers, system records (timing, audit log) and facilitator observations recorded
- Anonymous code / role / outside-team confirmation: U03 / 護理師 / confirmed not a team member
- Date / facilitator / consent read and given: 2026-11-24（115.11.24） / 張棨翔 / yes
- Software revision / prompt / model / scenario: demo environment on the workstation, build c454933 (includes the printed record, #99) / v5 / gemma4:e4b, Whisper small / S03. U03 operated the nurse screen and U04 played the patient from the S03 card (demo session SIM-000010); this participant: nurse screen operator
- Time to confirm / fields edited / AI drafts correct, wrong, missing, filled although not said: 3 min 28 s (audio 69 s; the AI draft took 51 s) / 1 / of 19 AI drafts against the S03 answer key: 18 correct, 0 wrong, 1 doubtful (發作時間 「昨天」; the card says today), missing 2 (舒張壓, added by the nurse as 92; 血壓部位), filled although not said 0. Confirming the 19 drafts one by one took about 55 s. The 量測禁忌 quote kept an STT error (樓管 for 瘻管)
- Help needed and where the participant hesitated: hesitated when the transcript and the 量測禁忌 draft showed the STT error for 瘻管 (毆管 on 11-23, 樓管 on 11-24); hesitated while waiting for the AI draft after the transcript appeared. No help needed; task completed (report confirmed)
- Ratings (1–3) and answers to the open questions (4–5), anonymized: 4 / 5 / 5. Q4: 「等待輸入時間（語音轉文字檔）、可同步帶入 HIS 系統」 Q5: 「多一份工作，希望可以自動帶入 HIS 會更好」
- Design change proposed / implemented / retest outcome: speech-to-text waiting time → #88 (GPU Whisper), #100 (load test); HIS sync → not doing, because the scope excludes writing to a real HIS (second participant to ask, see U01; on seeing the printout, U03 and U04 said HIS import matters more than printing); "one more task" → see U04 section confirmation; facilitator observation: show partial AI drafts as soon as the first part of the transcript is ready instead of all at once (#112); STT misspelling of 瘻管 → #89 (medical vocabulary hints)
- Evidence file and limitations: paper form (to be destroyed after transcription); demo database on the workstation (simulated data only); timing and AI accuracy belong to the run, which the two participants did together (one as nurse, one as patient)

### U04 (測試者 D)

- Status: CONDUCTED; questionnaire answers, system records (timing, audit log) and facilitator observations recorded
- Anonymous code / role / outside-team confirmation: U04 / 醫師 / confirmed not a team member
- Date / facilitator / consent read and given: 2026-11-24（115.11.24） / 張棨翔 / yes
- Software revision / prompt / model / scenario: demo environment on the workstation, build c454933 (includes the printed record, #99) / v5 / gemma4:e4b, Whisper small / S03. U03 operated the nurse screen and U04 played the patient from the S03 card (demo session SIM-000010); this participant: patient (S03 card)
- Time to confirm / fields edited / AI drafts correct, wrong, missing, filled although not said: 3 min 28 s (audio 69 s; the AI draft took 51 s) / 1 / of 19 AI drafts against the S03 answer key: 18 correct, 0 wrong, 1 doubtful (發作時間 「昨天」; the card says today), missing 2 (舒張壓, added by the nurse as 92; 血壓部位), filled although not said 0. Confirming the 19 drafts one by one took about 55 s. The 量測禁忌 quote kept an STT error (樓管 for 瘻管)
- Help needed and where the participant hesitated: hesitated when the transcript and the 量測禁忌 draft showed the STT error for 瘻管 (毆管 on 11-23, 樓管 on 11-24); hesitated while waiting for the AI draft after the transcript appeared. No help needed; task completed (report confirmed)
- Ratings (1–3) and answers to the open questions (4–5), anonymized: 5 / 5 / 5. Q4: 「語音轉成AI草稿時，有蠻多的需要一個一個確認，希望可以減少一個一個確認的次數（可以一小個區塊來確認）來加快草稿確認時間」 Q5: 「怕導入後會因為多了步驟而減少護理師的使用意願」 Additional comment: 「建議可以依照『急診五級檢傷分類基準』當中聽到的主訴內容來自動填寫檢傷級數，因為護理師填寫主訴的選項之後，就會自動帶入檢傷級數，大差不差，除非可能因為有很多病發症的話，才會多調嚴重一點級數」
- Design change proposed / implemented / retest outcome: confirm AI drafts one section at a time → #113; fewer steps → same card and #87 (checklist prompts); triage level filled in from the chief complaint by the TTAS criteria → PO wants it (2026-11-24); it changes the rule that the nurse decides 檢傷級數 and the AI never does, so the design and a `DECISIONS.md` entry await team confirmation before any work
- Evidence file and limitations: paper form (to be destroyed after transcription); demo database on the workstation (simulated data only); timing and AI accuracy belong to the run, which the two participants did together (one as nurse, one as patient)

## Measures

Report per participant: time to confirm, edit count, and AI drafts against the scenario card (correct, wrong, missing, filled although not said), plus the three ratings and the open answers. A wrong vital sign, 量測禁忌 or TOCC value is a safety finding even if the nurse caught it. No statistical significance claims with this small sample. Do not mix machine inference latency with human task time. If model failure forces manual entry, include that time.


## 2026-11-24 review boundary

U01–U04 are reported by the facilitator (the PO), who supplied outside-team status, consent, roles and observations on 2026-11-24; timing, edits and AI draft values come from the demo database. No one else observed the sessions. The S03 answer-key comparison was made by the coding assistant and still needs a nurse to check it. Do not infer task-time improvement from the ratings or from two runs without a paper baseline, or replace missing observations with estimates.
