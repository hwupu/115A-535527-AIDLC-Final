# Design rationale - Group1 CP2 candidate

The CP1 interviews identify double handling at triage and incomplete handoff to the physician. The nurse's reported extra 2-3 minutes was an estimate, not an outcome measurement. The user confirmed instructor topic approval on 2026-11-04.

We preserve the existing team's four-role Vue interface and make the API the shared source of truth. Independent browsers must use real persistence; browser-memory mocks cannot demonstrate a real two-person handoff. The physician sees only confirmed reports. Nurses retain correction and the triage decision. A field is explicitly missing, an AI draft, or nurse-confirmed; missing travel history must not become a negative answer.

Every accepted AI field has a literal source quote. This helps checking, but containment alone cannot establish that a quote supports the field label. The small-model experiment exposed this: travel-history statements were put into chief complaint. Manual review is essential, and no clinical use is supported.

Extraction runs on Ollama so the model is a configuration choice: `gemma3:1b` by default, so laptops without a GPU can run it, and `gemma4:e4b` on the workstation GPU for official runs (until 2026-11-21 a CPU Qwen 0.5B adapter filled this role). The v3 adapter asks for copied spans and deterministically converts selected fields; it is not a broad report generator. Remaining UI fields can be entered manually. Whisper processes whole clips after stop, making each WebM decodable. The design sacrifices streaming latency for a thinner reliable end-to-end path.

SQLite avoids a separate database service; SQLAlchemy/Alembic preserve the team's chosen tooling. Every nurse edit stores before/after values. Confirmed encounters are immutable. The evaluation UI reuses audit events rather than inventing a second source of timing truth.

## External-user findings

Two outside-team sessions so far (U01, U02; records in `USER_TEST_PROTOCOL.md`, follow-up #101), with more to follow. So far only the questionnaire answers are recorded; participant roles, scenario, timing, edits, AI draft accuracy and observations are still to be filled in from the facilitator's forms, so the findings below are the participants' own words, not measured outcomes. Both rated all three items 5 of 5; with two participants this is encouraging, not a general result.

| Finding (participant's words) | Change |
|---|---|
| A more formal PDF format (U01) | Implemented: the confirmed report prints as an ED-style triage record (#99); retest pending |
| Integration with the hospital system (U01) | Not doing: the scope excludes writing to a real HIS; the nurse prints or copies the report |
| Load with several devices at once (U01) | Load test planned (#100); STT currently transcribes one clip at a time |
| Telling the speakers' roles apart (U02) | Planned (#102): the AI labels each transcript line's speaker from its content and the nurse can correct it; voice-based separation (pyannote) stays for later (#9) |
| Accuracy of the summary (U02) | Formal evaluation on held-out cases with a nurse-checked answer key (#45); medical vocabulary hints (#89) |
