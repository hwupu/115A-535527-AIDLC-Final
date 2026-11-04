# Design rationale - Group1 CP2 candidate

The CP1 interviews identify double handling at triage and incomplete handoff to the physician. The nurse's reported extra 2-3 minutes was an estimate, not an outcome measurement. The user confirmed instructor topic approval on 2026-11-04.

We preserve the existing team's four-role Vue interface and make the API the shared source of truth. Independent browsers must use real persistence; browser-memory mocks cannot demonstrate a real two-person handoff. The physician sees only confirmed reports. Nurses retain correction and the triage decision. A field is explicitly missing, an AI draft, or nurse-confirmed; missing travel history must not become a negative answer.

Every accepted AI field has a literal source quote. This helps checking, but containment alone cannot establish that a quote supports the field label. The small-model experiment exposed this: travel-history statements were put into chief complaint. Manual review is essential, and no clinical use is supported.

For a 4GB-VRAM development machine, a CPU Qwen 0.5B adapter is implemented as a reviewable validation proposal. The planned Gemma-4 runtime remains unimplemented. The v3 adapter asks for copied spans and deterministically converts selected fields; it is not a broad report generator. Remaining UI fields can be entered manually. Whisper processes whole clips after stop, making each WebM decodable. The design sacrifices streaming latency for a thinner reliable end-to-end path.

SQLite avoids a separate database service; SQLAlchemy/Alembic preserve the team's chosen tooling. Every nurse edit stores before/after values. Confirmed encounters are immutable. The evaluation UI reuses audit events rather than inventing a second source of timing truth.

## External-user findings - required, not yet available

No CP2 external-user session was conducted by this automated run. Consequently this document does NOT yet satisfy the course requirement of findings from at least two such sessions. Complete USER_TEST_PROTOCOL.md, then add observed problems, changes made and any retest. Developer/browser tests and CP1 interviews cannot fill this section.
