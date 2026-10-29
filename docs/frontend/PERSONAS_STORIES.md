# Frontend: Personas and User Stories

Status: **draft for the Product Owner (張棨翔) and the team to confirm.** Work items live on the
GitHub Project board; this file records *who* we build for and *why*. It does not list tickets.
Related: [`USER_FLOW.md`](USER_FLOW.md), [`ARCHITECTURE.md`](ARCHITECTURE.md),
[`../SCENARIOS.md`](../SCENARIOS.md), [`../interviews/CP1訪談紀錄.md`](../interviews/CP1訪談紀錄.md).

## Evidence and its limits

Nurse and physician needs come from two CP1 interviews at teaching-hospital EDs. The nurse's "+2–3 min per patient"
is her own estimate, not measured. The physician was asked about a tool idea, so the framing may be leading.
**The patient and admin roles have no interview evidence.** The patient screen scope was set by the team (2026-10-28);
the patient's needs below are assumptions. The admin role exists for the evaluation study, not for clinical use.

## Roles on the first screen (demo)

The first screen shows four buttons (病患, 檢傷護理師, 醫師, 管理者). It is a demo role switch, not a login. Clinical terms stay in
Traditional Chinese as in the handoff glossary.

## Personas

### P-N: 檢傷護理師 (primary user)

- **Who:** triage nurse, 8 years in a teaching-hospital ED (interview 1).
- **Context:** at the 檢傷站, standing or sitting next to the patient, a tablet or monitor within reach. Hands are busy with the
  blood-pressure cuff and pulse oximeter; eyes stay on the patient. Peak hours mean a queue behind the patient.
- **Goal:** keep eye contact and hands on the patient while the paperwork drafts itself; correct and confirm quickly; decide 檢傷級數 herself.
- **Pain today:** handwrite on scrap paper, then re-key into the HIS; 3–4 slips pile up at peak; transcription mistakes; HIS tabs
  are fragmented and typing breaks eye contact.
- **Needs from the UI:** big touch targets, almost no typing, one screen, clear "what is AI draft vs confirmed", fast edit, no surprises.
- **Does not want:** the AI deciding anything clinical, extra steps that make triage slower.

### P-D: 急診醫師

- **Who:** attending ED physician, 10+ years (interview 2).
- **Context:** in the consultation room; the patient is already in front of them. Reads the report on a desktop or tablet.
- **Goal:** see an accurate, complete 主訴 and HPI plus vitals immediately, without re-asking TOCC.
- **Pain today:** 主訴 is only a few words; triage fields still empty when the patient is already in the room; abnormal vitals not flagged.
- **Needs from the UI:** pick the patient from a list, read-only scannable report, flags visible, a clear sign of what the nurse confirmed.
- **Does not want:** to edit nurse data, or to see AI text that looks confirmed when it is not.

### P-P: 病患 (assumption, 待確認)

- **Who:** an adult ED patient or an accompanying family member (SCENARIOS S04, S07 involve family answering).
- **Context:** at or near the 檢傷站, possibly unwell, anxious, masked, older, or a Taiwanese-Mandarin mix speaker.
  Not a power user; may not read small text.
- **Goal (assumed):** tell their story in whichever way is easiest (speaking or typing) and know that it is being recorded.
- **Screen scope (decided 2026-10-28):** voice input and text input, then an ending screen that shows the **就診號** the system assigned. No code entry, no personal information.
- **Needs from the UI:** very large text and buttons, a very visible recording state, plain wording, nothing that looks like medical advice or a triage result.
- **Privacy:** the patient is never asked for a name, 身分證字號 or phone number; the 就診號 is a simulated number given at the end. 就診號 identifies a visit; the prototype does not handle 病歷號 (the permanent record number) because there is no HIS.
- **Deferred (PO, 2026-10-29):** a read-back that **only repeats what the patient said**, so they can tell whether speech recognition
  heard it wrongly. It never shows the AI draft, danger-sign flags or a triage level. Not in scope now.

### P-A: 管理者 / 評估人員 (admin, evaluation mode)

- **Who:** a team member running the evaluation sessions with nurses (pilot in Week 13, runs in Week 14).
- **Context:** sits beside the participant, on a laptop or tablet; needs to run many scenarios consistently and not disturb the nurse.
- **Goal:** pick a scenario, start a timed run, record what happens (time, edits, errors caught), and export the results.
- **Pain if missing:** timings and edit counts collected by hand are inconsistent and cannot be audited.
- **Needs from the UI:** a scenario list with split labels (dev / held-out), start / stop, a live event log, export, and a clear
  separation so evaluation controls never appear on the nurse's working screen.
- **Does not want:** to change clinical content, or to see real patient data.

## User stories

Format: *As a ⟨role⟩, I want ⟨goal⟩ so that ⟨reason⟩.* "Hard rule" lines are product boundaries, not options.

### Nurse

| ID | Story |
|---|---|
| US-N0 | As a nurse, I want to open a patient by the 就診號 they read out, or from the list of patients who finished intake, so that I start from what they already told the system. |
| US-N1 | As a nurse, I want to start and stop listening with one big control so that my hands stay on the patient. |
| US-N2 | As a nurse, I want to see the transcript appear as we talk so that I can confirm the system heard the right thing. Anything the patient entered themselves (voice or text) appears labelled as a patient entry. |
| US-N3 | As a nurse, I want a structured draft (TOCC, 量測禁忌, 主訴, HPI) filled from the conversation so that I do not handwrite and re-key. |
| US-N4 | As a nurse, I want each field to show whether it is 未提及, AI 草稿 or 護理師已確認 so that I never mistake a draft for fact. |
| US-N5 | As a nurse, I want to click a field and see the sentence it came from so that I can verify it in seconds. |
| US-N6 | As a nurse, I want to correct any field quickly (tap, pick, short text) so that fixing is faster than typing from scratch. |
| US-N7 | As a nurse, I want to dictate or enter measured vitals separately from what the patient reported so that the record reflects measurements. |
| US-N8 | As a nurse, I want danger signs and 量測禁忌 shown as suggestions so that I notice them, while I stay the one who decides. |
| US-N9 | As a nurse, I want to enter 檢傷級數 myself, with nothing pre-filled so that the decision is mine. **Hard rule: the AI never suggests or fills it.** |
| US-N10 | As a nurse, I want to confirm the report and copy or print it so that I can enter it into the HIS by hand. **Hard rule: no HIS write.** |
| US-N11 | As a nurse, I want to keep working (type into the form) when audio or AI fails so that triage is never blocked. |

### Physician

| ID | Story |
|---|---|
| US-D0 | As a physician, I want a list of patients (by 就診號) waiting or recently triaged, with status, so that I can pick the right one. |
| US-D1 | As a physician, I want to open the confirmed triage report for the patient I picked so that I do not re-ask what was already asked. |
| US-D2 | As a physician, I want 主訴 and HPI with onset, character and associated symptoms, and flagged vitals, so that I can work from a full picture. |
| US-D3 | As a physician, I want to see what the nurse confirmed and what was edited so that I know how far to trust each field. **Hard rule: read-only.** |

### Patient (待確認)

| ID | Story |
|---|---|
| US-P1 | As a patient, I want to start right away without typing any ID or personal details so that I can begin quickly. |
| US-P2 | As a patient, I want to speak my answer with one big button so that I do not have to type when I feel unwell. |
| US-P3 | As a patient, I want to type my answer instead so that I can use the system in a noisy place or when speaking is hard. |
| US-P4 | As a patient, I want to see at a glance whether I am being recorded so that I know when I am being heard. |
| US-P5 | As a patient, I want to receive my 就診號 at the end so that I can tell the nurse who I am without giving personal details. **Hard rule: the patient screen never shows a triage level, diagnosis or advice.** |

### Admin (evaluation mode)

| ID | Story |
|---|---|
| US-A1 | As an admin, I want to pick a scenario (and see whether it is dev or held-out) so that each participant runs the same set. |
| US-A2 | As an admin, I want to start and stop a timed run so that documentation time is measured the same way every time. |
| US-A3 | As an admin, I want a live log of events (field edits, errors, level entered) so that I can compute edit burden and error-catch rate. |
| US-A4 | As an admin, I want to export run results with model, prompt version and Whisper model recorded so that every number is reproducible. |
| US-A5 | As an admin, I want evaluation controls on their own screen so that they never distract the nurse. |

## Non-goals for the frontend

No real HIS integration, no real patient data and no personal information (the 就診號 is simulated), no login or accounts (roles are a demo switch), no diagnosis or triage suggestions, no native app.
