# Frontend: Personas and User Stories

Status: **draft for the Product Owner (張棨翔) and the team to confirm.** Work items live on the
GitHub Project board; this file records *who* we build for and *why*. It does not list tickets.
Related: [`USER_FLOW.md`](USER_FLOW.md), [`ARCHITECTURE.md`](ARCHITECTURE.md),
[`../SCENARIOS.md`](../SCENARIOS.md), [`../interviews/CP1訪談紀錄.md`](../interviews/CP1訪談紀錄.md).

## Evidence and its limits

Nurse and physician needs come from two CP1 interviews at teaching-hospital EDs. The nurse's "+2–3 min per patient"
is her own estimate, not measured. The physician was asked about a tool idea, so the framing may be leading.
**The patient role has no interview evidence.** Everything about the patient is an assumption and is marked 待確認.

## Roles on the first screen (demo)

The first screen shows three buttons (病患, 檢傷護理師, 醫師). It is a demo role switch, not a login. Clinical terms stay in
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
- **Needs from the UI:** read-only, scannable report, flags visible, a clear sign of what the nurse confirmed.
- **Does not want:** to edit nurse data, or to see AI text that looks confirmed when it is not.

### P-P: 病患 (assumption, 待確認)

- **Who:** an adult ED patient or an accompanying family member (SCENARIOS S04, S07 involve family answering).
- **Context:** stands or sits at the 檢傷站, possibly unwell, anxious, masked, older, or a Taiwanese-Mandarin mix speaker.
  Not a power user; may not read small text.
- **Goal (assumed):** know that they are being recorded and why; be able to say no; check that the information about them is right.
- **Needs from the UI:** a plain-language notice, a very visible recording state, large text, nothing that looks like medical advice or a triage result.
- **Open (待確認):** whether a patient-facing screen is in scope for the final demo or only a consent/recording indicator.

## User stories

Format: *As a ⟨role⟩, I want ⟨goal⟩ so that ⟨reason⟩.* "Hard rule" lines are product boundaries, not options.

### Nurse

| ID | Story |
|---|---|
| US-N1 | As a nurse, I want to start and stop listening with one big control so that my hands stay on the patient. |
| US-N2 | As a nurse, I want to see the transcript appear as we talk so that I can confirm the system heard the right thing. |
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
| US-D1 | As a physician, I want to open the confirmed triage report for the current patient so that I do not re-ask what was already asked. |
| US-D2 | As a physician, I want 主訴 and HPI with onset, character and associated symptoms, and flagged vitals, so that I can work from a full picture. |
| US-D3 | As a physician, I want to see what the nurse confirmed and what was edited so that I know how far to trust each field. **Hard rule: read-only.** |

### Patient (待確認)

| ID | Story |
|---|---|
| US-P1 | As a patient, I want to be told clearly that the conversation is being recorded and drafted, and to decline, so that I stay in control. |
| US-P2 | As a patient, I want to see recording is on or off at a glance so that I know when I am being heard. |
| US-P3 | As a patient, I want to check the information about me and say what is wrong so that the record is correct. **Hard rule: no triage level, diagnosis or advice shown.** |

### Cross-cutting (evaluation)

| ID | Story |
|---|---|
| US-E1 | As an evaluator, I want a mode that picks a scenario, times the task and logs edits so that we can measure documentation time and edit burden. |

## Non-goals for the frontend

No real HIS integration, no real patient data, no login or accounts, no diagnosis or triage suggestions, no native app.
