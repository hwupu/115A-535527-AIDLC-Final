# CP2 work log

Owner: 劉順松 / 414551016 / Group1

2026-11-04: User confirmed the project topic is approved and authorized local CP2 implementation. E3 submission remains with the user after team review. Work branch: feat/414551016-cp2-integration. Existing frontend stack from origin/feat/62-patient-and-admin integrated locally without committing; remote main unchanged. External user sessions and human review must not be invented.

## Provenance and operations

- Local base: 2ac0997764cd66ef16361bd1111b3fa334689024; integrated frontend tip: 68fbbec5d751dd01317a269551fa6207d71bfb8a. Integration was uncommitted; merge staging was cleared with mixed reset while retaining all files for review.
- Read Group1_CP1.pdf (4 pages), repository policies and frontend API contract. CP1 is discovery context, not CP2 user-test evidence.
- Installed project-local uv, per-service environments, pnpm dependencies and project-local Chromium. No .env contents were printed or packaged.
- Implemented API, database migration, tests, inference adapters, recording, source protection, confirmed JSON export, evaluation metrics, startup/check/package/report scripts.
- Actual failures: nested model shape, correction/semantic mistakes, PyAV 19 decode incompatibility, initial tiny/base transcription errors, recorder stop/audio ordering, old test expecting nested v2 after default changed to v3. Corrections are reflected in source/tests and limitations.
- Browser checks cover independent contexts, portrait/landscape, real typed-model extraction and synthetic-microphone Whisper; screenshots are automated technical evidence, not human participants.
- Prompt suite: v2 4/12 vs v3 8/12 whole-case passes. No held-out or clinical claim. Exact per-case evidence retained.
- Technical verification and report/package generation are logged under evidence/ and submission/. No commit/push, approval, main merge or E3 upload performed.
