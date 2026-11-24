# Design rationale - Group1 CP2 candidate

The CP1 interviews identify double handling at triage and incomplete handoff to the physician. The nurse's reported extra 2-3 minutes was an estimate, not an outcome measurement. The user confirmed instructor topic approval on 2026-11-04.

We preserve the existing team's four-role Vue interface and make the API the shared source of truth. Independent browsers must use real persistence; browser-memory mocks cannot demonstrate a real two-person handoff. The physician sees only confirmed reports. Nurses retain correction and the triage decision. A field is explicitly missing, an AI draft, or nurse-confirmed; missing travel history must not become a negative answer.

Every accepted AI field has a literal source quote. This helps checking, but containment alone cannot establish that a quote supports the field label. The small-model experiment exposed this: travel-history statements were put into chief complaint. Manual review is essential, and no clinical use is supported.

Extraction runs on Ollama so the model is a configuration choice: `gemma3:1b` by default, so laptops without a GPU can run it, and `gemma4:e4b` on the workstation GPU for official runs (until 2026-11-21 a CPU Qwen 0.5B adapter filled this role). The v3 adapter asks for copied spans and deterministically converts selected fields; it is not a broad report generator. Remaining UI fields can be entered manually. Whisper processes whole clips after stop, making each WebM decodable. The design sacrifices streaming latency for a thinner reliable end-to-end path.

SQLite avoids a separate database service; SQLAlchemy/Alembic preserve the team's chosen tooling. Every nurse edit stores before/after values. Confirmed encounters are immutable. The evaluation UI reuses audit events rather than inventing a second source of timing truth.

## External-user findings

Four outside-team sessions so far (U01–U04; records in `USER_TEST_PROTOCOL.md`, follow-up #101), with more to follow; U03 is a nurse, U04 a physician, U01 and U02 neither. They worked in pairs on scenario S03 (one at the nurse screen, one as the patient), with the PO as facilitator. Timing and AI accuracy come from the demo database (see `EVALUATION_REPORT.md`); the findings below are the participants' own words and the facilitator's observations, not measured outcomes. Ratings were 5/5/5 three times and 4/5/5 once; with four participants this is encouraging, not a general result.

| Finding (participant's words) | Change |
|---|---|
| A more formal PDF format (U01) | Implemented: the confirmed report prints as an ED-style triage record (#99). Retest 2026-11-24 (U03, U04): more formal, but HIS import matters more |
| Integration with the hospital system (U01, U03) | Not doing: the scope excludes writing to a real HIS. PO decision 2026-11-24: keep copy text, print and JSON download. Asked by U01 and U03, and U03/U04 ranked it above the printout, so it is the main gap for real use |
| Load with several devices at once (U01) | Load test planned (#100); STT currently transcribes one clip at a time |
| Telling the speakers' roles apart (U02) | Planned (#102): the AI labels each transcript line's speaker from its content and the nurse can correct it; voice-based separation (pyannote) stays for later (#9) |
| Accuracy of the summary (U02) | Formal evaluation on held-out cases with a nurse-checked answer key (#45); medical vocabulary hints (#89) |
| Waiting for speech-to-text (U03) | Whisper on the GPU when there is one (#88); load test (#100) |
| Hesitation while the AI draft was generated (51–117 s, facilitator observation, both runs) | Planned (#112): record in 15–20 s parts and show the drafts of each part as soon as it is transcribed |
| Hesitation at the misspelled 瘻管 (毆管, 樓管) in the transcript and the 量測禁忌 draft (facilitator observation, both runs) | Medical vocabulary hints for Whisper (#89) |
| Confirming AI drafts one by one takes long; extra steps may put nurses off (U04, U03) | Planned (#113): confirm the AI drafts of one section at a time; checklist prompts (#87) |
| Suggest the triage level from the TTAS criteria and the chief complaint (U04) | PO wants it (2026-11-24). It changes the rule that the nurse decides 檢傷級數 and the AI never does, so the design and a `DECISIONS.md` entry await team confirmation |
