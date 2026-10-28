# Frontend: User Flows

Status: **draft.** Diagrams use Mermaid (rendered by GitHub). Personas and stories: [`PERSONAS_STORIES.md`](PERSONAS_STORIES.md).
API calls referenced here: [`API_INTERFACE.md`](API_INTERFACE.md).
Target device: tablet, landscape first (about 1024–1194 px wide), portrait must still work. Default text is large (18 px base, 20 px on tablet).

## 1. Entry: choose a role (demo)

```mermaid
flowchart LR
    A[Open app] --> B[First screen: 4 big buttons]
    B -->|病患| P[Patient view]
    B -->|檢傷護理師| N[Nurse view]
    B -->|醫師| D[Physician view]
    B -->|管理者| M[Admin / evaluation view]
    P -->|切換角色| B
    N -->|切換角色| B
    D -->|切換角色| B
    M -->|切換角色| B
```

The role is the route (`/patient`, `/nurse`, `/doctor`, `/admin`). No login. Switching role never deletes a session.

## 2. Patient: speak or type, then receive a 病歷號

```mermaid
flowchart TD
    P[Patient view: no login, no code entry] --> CH{Choose how to answer}
    CH -->|Voice| R[Tap to start speaking; recording indicator on]
    R --> ST[Tap to stop]
    CH -->|Text| T[Type and send]
    ST --> SENT[Entry is added to the session, labelled as a patient entry]
    T --> SENT
    SENT --> MORE{More to say?}
    MORE -->|Yes| CH
    MORE -->|No| FIN[Tap 完成]
    FIN --> W[System writes the session and allocates the 病歷號]
    W --> END[Ending screen: large 病歷號 and 'tell the nurse']
    END --> NEXT[下一位: clear the screen for the next patient]
```

Rules:
- No ID, name or personal detail is asked for. The 病歷號 is a simulated number the **system** gives at the end (`SIM-######`).
- 完成 is enabled only after at least one entry and when not recording.
- A recording indicator is always visible while recording.
- The patient never sees AI drafts, flags, a triage level or advice.
- Leaving before 完成 means no 病歷號 is issued and the unfinished entries are discarded after a timeout.

## 3. Nurse: triage session (main flow)

```mermaid
flowchart TD
    S[Nurse view] --> NS[Open the patient by the 病歷號 they read out, or pick from the 'ready' list; or start a new session]
    NS --> C{Patient consents?}
    C -->|No| X[Do not record; type into the form manually]
    C -->|Yes| R[Start listening]
    R --> T[Live transcript: nurse speech, patient speech, patient self-entries labelled]
    T --> V[Nurse measures vitals and dictates or types them]
    V --> DR[Draft report: fields marked AI 草稿 / 未提及, each with source sentence]
    DR --> RV[Nurse reviews fields: tap field to see source, edit if wrong]
    RV --> LV[Nurse enters 檢傷級數 herself]
    LV --> CF[Confirm: fields become 護理師已確認]
    CF --> OUT[Copy or print for HIS; report appears in the physician list]
    X --> LV
    OUT --> END[End session]
```

Rules visible in the flow:
- The AI path never reaches 檢傷級數; that node is entered by the nurse only.
- Nothing is saved as confirmed until the nurse confirms.
- The nurse can leave the AI path at any time and finish by typing.

## 4. Nurse: failure and fallback

```mermaid
flowchart TD
    M[Listening] --> E1{Mic permission denied?}
    E1 -->|Yes| F1[Show how to allow the mic; manual form still works]
    M --> E2{Connection to api lost?}
    E2 -->|Yes| F2[Show status banner; keep entered data locally; reconnect and resume]
    M --> E3{STT or LLM slow or down?}
    E3 -->|STT down| F3[Banner; manual form]
    E3 -->|LLM slow or invalid| F4[Transcript still shown; draft appears later or fields stay 未提及]
```

Principle: a failure never blocks triage and never fills fields with guesses. Empty (`未提及`) beats invented.

## 5. Physician: pick from a list, then read

```mermaid
flowchart TD
    D[Physician view] --> L[Patient list: 病歷號, status, time, flag icon; newest first; auto-refresh]
    L --> PK[Pick a patient]
    PK --> Q{Report confirmed by nurse?}
    Q -->|No| W[Show 'not confirmed yet'; refresh by polling]
    Q -->|Yes| RPT[Read-only report: vitals with flags, 主訴, HPI, TOCC, 量測禁忌]
    RPT --> BD[Badges show confirmed or edited per field]
    RPT --> BK[Back to list]
    BK --> L
```

List statuses: `等候中` (patient finished intake, nurse not started), `進行中` (nurse working), `已確認` (confirmed). Only `已確認` reports open fully.

## 6. Admin: evaluation mode

```mermaid
flowchart TD
    M[Admin view] --> SC[Scenario list with dev / held-out label]
    SC --> RUN[Create run: scenario, anonymous participant code]
    RUN --> GO[Start timer; participant works on the nurse screen]
    GO --> LOG[Live event log: edits, errors, level entered]
    LOG --> FIN[Stop run: record end time and nurse-entered result]
    FIN --> EXP[Export run: JSON / CSV with model, prompt version, Whisper model]
    FIN --> SC
```

Evaluation controls live only on this route, so the nurse working screen stays clean. The participant code is anonymous (no names).

## Screen-by-screen summary

| Screen | Primary user | Route | Key content |
|---|---|---|---|
| Role select | all | `/` | four big role buttons, demo notice |
| Patient | patient | `/patient` | voice input, text input, recording indicator, ending screen with 病歷號 |
| Nurse session | nurse | `/nurse` | recorder, transcript, draft form, vitals, level entry, confirm |
| Physician | physician | `/doctor` | patient list (by 病歷號), read-only confirmed report |
| Admin | evaluator | `/admin` | scenario picker, timer, event log, export |
