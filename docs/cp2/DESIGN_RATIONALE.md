# Design rationale - Group01 CP2

The CP1 interviews identify double handling at triage and incomplete handoff to the physician. The nurse's reported extra 2-3 minutes was an estimate, not an outcome measurement.

We preserve the existing team's four-role Vue interface and make the API the shared source of truth. Independent browsers must use real persistence; browser-memory mocks cannot demonstrate a real two-person handoff. The physician sees only confirmed reports. Nurses retain correction and the triage decision. A field is explicitly missing, an AI draft, or nurse-confirmed; missing travel history must not become a negative answer.

Every accepted AI field has a literal source quote. This helps checking, but containment alone cannot establish that a quote supports the field label. The small-model experiment exposed this: travel-history statements were put into chief complaint. Manual review is essential, and no clinical use is supported.

Extraction runs on Ollama so the model is a configuration choice: `gemma3:1b` by default, so laptops without a GPU can run it, and `gemma4:e4b` on the workstation GPU for official runs (until 2026-11-21 a CPU Qwen 0.5B adapter filled this role). Prompt v5 (default since 2026-11-22) drafts every report field the transcript states, each as `{value, source_span}` under a JSON Schema; numbers and the date of birth are computed in code from the quoted span and dropped if the quote cannot support them. Fields the transcript does not state stay empty for the nurse to fill in. Whisper processes whole clips after stop, making each WebM decodable. The design sacrifices streaming latency for a thinner reliable end-to-end path.

SQLite avoids a separate database service; SQLAlchemy/Alembic preserve the team's chosen tooling. Every nurse edit stores before/after values. Confirmed encounters are immutable. The evaluation UI reuses audit events rather than inventing a second source of timing truth.

## Decisions shaped by the Week 12 cross-team review (Group 03, 2026-11-23)

In the Week 12 lab, Group 03 used our prototype (Track A, our main task ran end to end) and set it up from our README on
a fresh Mac. All four findings became issues for Phase 3; the full record is our Week 12 lab submission.

| Finding (Group 03) | Change |
|---|---|
| The patient screen asks nothing, so travel history, the arm that can't be used for blood pressure, birth date and who came along stay 未提及 unless someone brings them up | Patient screen asks fixed questions one at a time (#86, PO decision 2026-11-22) |
| Everything needs a tap; at triage the nurse often has one hand on the patient | One-hand keyboard shortcuts on the nurse and doctor screens (#28) |
| The README had two different quick starts and never mentioned Ollama | One quick start in `README.md` that lists Ollama (#97, done in #103) |
| The doctor can't see the conversation or what the AI first wrote | Doctor details view: full transcript and the AI draft next to the nurse's value (#27) |

Strength they named: every AI field shows the sentence it came from, and the report can't be saved while any AI draft
is unconfirmed. We keep both.

## Decisions shaped by user feedback (outside-team sessions)

Two outside-team sessions so far, both with nurses (U01 護理師 A, U02 護理師 B; records in `USER_TEST_PROTOCOL.md`, follow-up #101). So far only the questionnaire answers are recorded; the date, scenario, timing, edits, AI draft accuracy and observations are still to be filled in from the facilitator's forms, so the findings below are the participants' own words, not measured outcomes. Both rated all three items 5 of 5; with two participants this is encouraging, not a general result.

| Finding (participant's words) | Change |
|---|---|
| A more formal PDF format (U01) | Implemented: the confirmed report prints as an ED-style triage record (#99); retest pending |
| Integration with the hospital system (U01) | Not doing: the scope excludes writing to a real HIS; the nurse prints or copies the report |
| Load with several devices at once (U01) | Load test planned (#100); STT currently transcribes one clip at a time |
| Telling the speakers' roles apart (U02) | Planned (#102): the AI labels each transcript line's speaker from its content and the nurse can correct it; voice-based separation (pyannote) stays for later (#9) |
| Accuracy of the summary (U02) | Formal evaluation on held-out cases with a nurse-checked answer key (#45); medical vocabulary hints (#89) |
