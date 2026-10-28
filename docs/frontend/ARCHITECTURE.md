# Frontend Architecture (Draft Proposal)

Status: **proposal for the team to confirm.** Backend, safety and data model are in [`../ARCHITECTURE.md`](../ARCHITECTURE.md);
this file covers only `apps/web`. Stories and flows: [`PERSONAS_STORIES.md`](PERSONAS_STORIES.md), [`USER_FLOW.md`](USER_FLOW.md).
Items marked 待確認 need a team decision (record it in `DECISIONS.md`).

## 1. Goals and constraints

- Web app, tablet first (landscape about 1024–1194 px), portrait and desktop must also work.
- Hands-free for the nurse: few taps, no required typing, large targets.
- The UI must make the human–AI boundary obvious: AI content is labelled until confirmed; no triage level from the AI.
- The frontend never calls `stt` or `llm` directly; it talks only to `services/api` (REST + WebSocket).
- All UI text in 繁體中文（台灣）; clinical terms follow the glossary in the handoff.
- Simulated data only; a "demo / simulated data" banner is always visible.

## 2. Stack

| Concern | Choice | Status |
|---|---|---|
| Framework | Vue 3 (`<script setup>`, TypeScript) + Vite | decided |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite`) | in use |
| Components | shadcn-vue (copy-in components over Reka UI) | 待確認 (not added yet) |
| Routing | vue-router, role = route | in use |
| State | Pinia for session state; local component state otherwise | 待確認 |
| Server types | hand-written TS types mirroring the report schema first; generate from the api's OpenAPI once stable | 待確認 |
| Tests | Vitest + Vue Test Utils for logic and components; Playwright for the main nurse flow with audio fixtures | 待確認 |
| Package/Node | pnpm workspace, Node 24 LTS | decided |

## 3. Routes and roles

```
/          role select (demo; no login)
/patient   patient view
/nurse     nurse session screen
/doctor    physician read-only report
```

A role is just a route; there is no authentication in the prototype (stated as a limitation in reports). Role definitions
(label, description, path) live in one file, `src/roles.ts`, so the first screen and the headers stay in sync.

## 4. Proposed source layout

```
apps/web/src/
  main.ts, router.ts, style.css
  roles.ts                   role list used by the first screen and headers
  views/                     one file per route (thin; compose components)
    RoleSelectView.vue
    NurseSessionView.vue     later
    DoctorReportView.vue     later
    PatientView.vue          later
  components/
    recorder/                mic button, level meter, connection status
    transcript/              live transcript panel, highlight of source_span
    report/                  FieldRow, FieldStatusBadge, section cards (TOCC, 量測, 主訴, HPI), flags
    common/                  big buttons, banners, dialogs
  composables/
    useSession.ts            session lifecycle, WebSocket, reconnect
    useRecorder.ts           MediaRecorder / getUserMedia
    useReport.ts             field edits, confirm, audit events sent to api
  stores/                    Pinia (session, report, ui)
  api/                       REST client, WebSocket message types, schema types
  i18n/                      zh-TW strings (single locale for now)
```

Rule of thumb: views wire things together, composables own side effects (audio, network), components are presentational.

## 5. Data and state

Each report field is `{ value, status, source_span, source }` (backend doc §4). `status` is `未提及 | AI 草稿 | 護理師已確認`.

- **Single source of truth:** the api holds session state; the store mirrors it. The browser may buffer edits during a disconnect and replay them.
- **Field updates** arrive over the WebSocket as events (transcript segment, field update, error); user edits go out as events and are audited by the api.
- **`triage_level`** exists only as a nurse input control in the UI. There is no code path that fills it from AI data; a test asserts this.
- **Dates** are stored as ISO and displayed in 民國.
- **No persistence of audio** in the browser or on disk by default.

## 6. Nurse screen layout (tablet landscape)

```
┌───────────────────────────────────────────────────────────────┐
│ header: role · session · connection status · 切換角色           │
├───────────────────────────┬───────────────────────────────────┤
│ Recorder + level meter    │ Report (scrolls, sections)        │
│ ───────────────────────── │  TOCC · 量測禁忌 · Vitals            │
│ Live transcript           │  主訴 · HPI · Flags (suggestions)   │
│ (tap a field → highlight  │  ─ field status badges ─            │
│  its source sentence)     │                                   │
├───────────────────────────┴───────────────────────────────────┤
│ sticky bar: 檢傷級數 (nurse input) · 確認並儲存 · 複製／列印        │
└───────────────────────────────────────────────────────────────┘
```

- Portrait / narrow: transcript collapses into a drawer or tab above the report; the sticky bar stays at the bottom.
- Touch targets at least 48 px; no hover-only interactions; the primary control is reachable with one hand.
- AI status is conveyed by label and icon as well as colour (not colour alone).
- Page must not require the keyboard to complete the main path.

## 7. Audio and network

- `getUserMedia` + `MediaRecorder`, chunks sent over WebSocket to the api. A secure context is required (`localhost`, or HTTPS from a second device).
- Handle permission denied, device not found and tab backgrounding with visible, actionable messages.
- WebSocket: auto reconnect with backoff; resume by `session_id`; show status in the header.
- Offline demo fallback: a "play fixture audio" control (dev/demo profile only) feeds a recorded scenario through the same path.
- Exact audio format and chunking are 待確認 with the backend/STT owner after spike A1.

## 8. Safety in the UI

1. AI content always carries a visible label until the nurse confirms it.
2. Flags are styled as suggestions ("建議留意"), never as findings or orders.
3. Confirm is a deliberate action; unconfirmed fields are listed before confirming.
4. Nothing resembling advice, diagnosis or a triage level is rendered from AI output.
5. The physician view is read-only and shows confirmed versus edited per field.
6. Frontend tests cover: no triage level from AI, status badge transitions, and the confirm gate.

## 9. Accessibility and localisation

- `lang="zh-Hant"`, semantic landmarks, visible focus, sufficient contrast, scalable text.
- All strings in `i18n/` (zh-TW only for now) so wording can be reviewed with a nurse in one place.
- Large-text mode and keyboard shortcuts are stretch items (deferred).

## 10. Build, run, test

- Local: `pnpm dev` (or `pnpm dev:all` with the services). Compose: `dev` profile serves Vite, `demo` serves the built app via nginx.
- CI: `pnpm lint`, `pnpm typecheck`, `pnpm build` (already in `.github/workflows/ci.yml`); add `pnpm test` when tests exist.
- API base is `/api`, proxied to the api service (Vite dev server and nginx).

## 11. Open questions

| # | Question | Default if unresolved |
|---|---|---|
| 1 | Is a patient screen in scope for the demo, and what is on it? | consent notice and recording indicator only |
| 2 | Adopt shadcn-vue? | yes, add components as needed |
| 3 | Pinia or composables only? | Pinia for session and report |
| 4 | Generate API types from OpenAPI? | hand-written until the schema stabilises |
| 5 | How does the physician pick the patient (list, session code, latest)? | latest confirmed session, then a short list |
| 6 | Where do the evaluation-mode controls live? | separate route, not on the first screen |
