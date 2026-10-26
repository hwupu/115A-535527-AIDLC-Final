# Evaluation Plan (Draft, AI Voice Triage Assistant)

> Provisional. Targets are proposals to finalize after the Week 13 pilot, with a
> nurse's input. Source: `docs/references/HANDOFF_scrum_setup.md` §5. Simulated
> scenarios only (`docs/SCENARIOS.md`); no real patient data. The earlier
> discharge-summary plan is in `docs/archive/discharge-summary/`.

## Problem grounding

- **Who:** emergency-department triage nurses (檢傷護理師); second stakeholder is the attending physician.
- **Today:** the nurse takes history while operating the BP cuff and pulse oximeter, so they handwrite on scrap paper and re-key into the HIS after the patient leaves.
- **Evidence (2 interviews, `docs/interviews/`):** double handling (nurse's own estimate +2–3 min/patient, not measured); slips pile up at peak so the HIS lacks data; transcription errors; the physician receives a very short 主訴 and re-asks TOCC and HPI.
- **Limits to state honestly:** both interviews are from teaching-hospital EDs; the physician was asked about a tool idea (possible leading framing); the 2–3 min figure is an estimate. Remove the stray `[cite: 1]` markers before using the notes as evidence.

## Human–AI boundary

AI may transcribe, split the conversation into fields, draft 主訴/HPI, and flag
danger signs as suggestions. The nurse reviews every field, confirms before
saving, and decides 檢傷級數. The AI must not assign a triage level, give
diagnosis or advice, or write to a real HIS. Empty (`未提及`) is better than invented.

## Principles

1. Success is about the nurse (time, edits, trust), not only model output.
2. Evaluate in layers: STT, then extraction, then end-to-end with nurses.
3. Safety-weighted: report safety fields separately, never inside an average.
4. Small n: report raw counts (e.g. 9/10), medians and ranges, not p-values.
5. Dev vs held-out scenarios; nurse-written references; some hard cases.

## Metrics

| Layer | Metric | Provisional target |
|---|---|---|
| STT | CER; medical-term recall | report only, set after the S2 baseline |
| Extraction | categorical fields exact match | ≥ 90% |
| Extraction | vitals exact match | ≥ 95%, 0 fabricated |
| Extraction | HPI key-element recall (human-scored) | ≥ 80% |
| Safety | fabrication rate | 0 for vitals / 量測禁忌 / TOCC |
| Safety | critical omission | 0 on dev set; report held-out |
| Safety | boundary violations (triage level or advice output) | 0 |
| Error propagation | gold transcript vs Whisper transcript | report gap |
| Latency | speech end to field shown (p50/p95) | set with nurse |
| Human outcome | documentation time vs paper-then-HIS, counterbalanced | ≥ 30% less |
| Human outcome | edit burden, time-to-confirm | report |
| Human–AI | error catch rate on seeded errors | ≥ 80% |
| Perception | 3–5 item survey + 1 interview question | report, quotes |

## Minimum evidence threshold (proposal)

≥ 3 nurses × ≥ 6 scenarios each (or ≥ 10 scenarios overall) showing time saving,
zero boundary violations and zero fabricated vitals/量測禁忌, and most nurses
saying they would use the draft. Say so honestly if recruitment falls short.

## Method and timing

Nurse role-plays with a teammate as patient on scripted scenarios, once with
paper-then-HIS and once with the tool (order counterbalanced). Pilot Week 13,
runs Week 14, analysis Weeks 14–15. CP3 is due Dec 14, so data collection must
finish by about Dec 11; Week 15 is buffer.

## Test hygiene

- Tune prompts on dev scenarios only; a scenario used for tuning becomes dev.
- Log model, prompt version, Whisper model, and git commit for every run.
- Synthetic data only; audio fixtures need speaker consent (see `docs/SCENARIOS.md` §5).
