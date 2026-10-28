# Frontend: User Flows

Status: **draft.** Diagrams use Mermaid (rendered by GitHub). Personas and stories: [`PERSONAS_STORIES.md`](PERSONAS_STORIES.md).
Target device: tablet, landscape first (about 1024–1194 px wide), portrait must still work.

## 1. Entry: choose a role (demo)

```mermaid
flowchart LR
    A[Open app] --> B[First screen: 3 big buttons]
    B -->|病患| P[Patient view]
    B -->|檢傷護理師| N[Nurse view]
    B -->|醫師| D[Physician view]
    P -->|切換角色| B
    N -->|切換角色| B
    D -->|切換角色| B
```

The role is the route (`/patient`, `/nurse`, `/doctor`). No login. Switching role never deletes a session.

## 2. Nurse: triage session (main flow)

```mermaid
flowchart TD
    S[Nurse view] --> NS[Start new session]
    NS --> C{Patient consents?}
    C -->|No| X[Do not record; type into the form manually]
    C -->|Yes| R[Start listening]
    R --> T[Live transcript appears]
    T --> V[Nurse measures vitals and dictates or types them]
    V --> DR[Draft report: fields marked AI 草稿 / 未提及, each with source sentence]
    DR --> RV[Nurse reviews fields: tap field to see source, edit if wrong]
    RV --> LV[Nurse enters 檢傷級數 herself]
    LV --> CF[Confirm: fields become 護理師已確認]
    CF --> OUT[Copy or print for HIS; report available to physician view]
    X --> LV
    OUT --> END[End session]
```

Rules visible in the flow:
- The AI path never reaches 檢傷級數; that node is entered by the nurse only.
- Nothing is saved as confirmed until the nurse confirms.
- The nurse can leave the AI path at any time and finish by typing.

## 3. Nurse: failure and fallback

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

## 4. Physician: read the report

```mermaid
flowchart TD
    D[Physician view] --> L[Pick current patient / session]
    L --> Q{Report confirmed by nurse?}
    Q -->|No| W[Show 'not confirmed yet'; auto-refresh by polling]
    Q -->|Yes| RPT[Read-only report: vitals with flags, 主訴, HPI, TOCC, 量測禁忌]
    RPT --> BD[Badges show confirmed or edited per field]
```

## 5. Patient (待確認 scope)

```mermaid
flowchart TD
    P[Patient view] --> N1[Plain-language notice: recorded to help the nurse write the record]
    N1 --> C{Agree?}
    C -->|Yes| S[Show recording on / off]
    C -->|No| X[Tell the nurse; nurse continues without recording]
    S --> CH[Optional: read back own info and flag what is wrong]
```

## Screen-by-screen summary

| Screen | Primary user | Route | Key content |
|---|---|---|---|
| Role select | all | `/` | three big role buttons, demo notice |
| Patient | patient | `/patient` | notice, recording state, optional read-back |
| Nurse session | nurse | `/nurse` | recorder, transcript, draft form, vitals, level entry, confirm |
| Physician report | physician | `/doctor` | read-only confirmed report |
| Evaluation mode | evaluator | later | scenario picker, timer, event log (not on the first screen) |
