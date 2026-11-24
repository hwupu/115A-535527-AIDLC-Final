# Interim evaluation report - Group01 CP2

First version: 劉順松, 2026-11-04. Ollama, prompt v5 and Whisper updates: 張棨翔, 2026-11-22. Restructured for the
CP2 submission: 2026-11-24. The full plan is `docs/EVALUATION_PLAN.md`; metric definitions are in `METRICS.md`.

## Question and what this checkpoint can answer

Does the tool reduce duplicate triage documentation and incomplete nurse-to-physician handoff? CP1 found these
problems in two interviews; the nurse's "extra 2-3 minutes" is an estimate, not a measured baseline. At CP2 we can
report technical evidence (does it run, how accurate are the speech and extraction steps on our own cases) and the
first outside-user feedback. We cannot yet report time saved, error-catch rate or nurse-reviewed accuracy.

## What is tested, and the results

| Area | Evidence | Result |
|---|---|---|
| Prototype runs end to end | CI on every PR (web lint/typecheck/test/build; api, stt, llm ruff + pytest; Docker build); `scripts/check.*` | Green on `main`. Unit tests use a fake model; they test our code, not the model |
| Two-person workflow | Playwright test with two independent browser contexts (`apps/web/e2e/workflow.spec.ts`, formerly `cp2.spec.ts`; `evidence/browser-tests.json`) | Nurse confirms, physician sees the confirmed read-only report. Automated, not two real users |
| AI failure handling | `services/api/tests/test_ai_failure.py` (#80): timeout, HTTP 503, invalid or wrongly shaped JSON | The nurse gets an error, the transcript and edits survive, the report can be finished by hand |
| Extraction (prompt suite) | 14 development cases in `eval/cases.json`; raw outputs in `evidence/` | See below |
| Speech to text | 18 fictional sentences read by one team member, with and without a mask (`evidence/stt-2026-11-22/`) | See below |
| Outside users | U01–U04: four people outside the team (U03 a nurse, U04 a physician, U01 and U02 neither) in two runs of scenario S03, questionnaires plus the demo database (`USER_TEST_PROTOCOL.md`) | See below; findings in `DESIGN_RATIONALE.md` |

### Extraction

Current setup: Ollama, temperature 0, prompt v5 (`services/llm/prompts/v5.txt`), every field as `{value, source_span}`
under a JSON Schema. Workstation run 2026-11-22 (`evidence/prompt-v5-2026-11-22/`):

| Model | Prompt | T01–T12 whole cases | Fields correct (T01–T14) | Wrong yes/no, number or date |
|---|---|---:|---:|---:|
| gemma4:e4b (official runs) | v3 | 10/12 | 10/19 (six fields only) | 0 |
| gemma4:e4b | **v5** | **10/12** | **36/43** | **0** |
| gemma3:1b (default on laptops) | v5 | 4/12 | 8/43 | 0 |

gemma3:1b leaves most fields empty; its four passes are the cases whose correct answer is empty. It still gave no
wrong typed value. The 2026-11-22 outputs predate the stricter number, date and home-reading guards added while
reviewing #95; they have not been re-run since.

**Fail → fix → re-run cycles** (the prompt-suite requirement):
1. *T01, v2 → v3 (2026-11-04, Qwen2.5-0.5B on CPU):* v2 returned flat values that the nested validator rejected
   (0/3 fields). v3 asks for copied quotes and converts them in code: 3/3, case passes. Suite: v2 4/12 → v3 8/12
   (`evidence/prompt-v2.jsonl`, `prompt-v3.jsonl`).
2. *v5 first run (2026-11-22, gemma4:e4b):* T13 was cut off at 450 tokens, unmentioned fields were filled with 「無」,
   T14 came back in the wrong shape, the model turned 民國87 into 1997, and T07 took the patient's home reading
   「體溫39度」 as the measured temperature. Fixes: a JSON Schema as Ollama's `format`, 1500 tokens, numbers and dates
   computed in code from the quote, home readings dropped. Re-run: 36/43 fields, no wrong typed value.

### Speech to text

faster-whisper on CPU, int8, the same settings as `services/stt`. Character error rate, digits normalised:

| Model | Plain | Masked | Median s per clip |
|---|---:|---:|---:|
| small (default) | 0.146 | 0.131 | 1.7 |
| medium (official runs) | 0.102 | 0.069 | 4.7 |

One speaker; the masked round was recorded second, so its lower error is probably practice, not evidence that masks
do not matter. Every model misheard rare terms (瘻管, 盤尼西林; follow-up #89).

### Outside users

Two runs of scenario S03, each by a pair (one at the nurse screen, one playing the patient), facilitated by the PO:
U01/U02 on 2026-11-23, U03/U04 on 2026-11-24. Workstation demo, prompt v5, gemma4:e4b, Whisper small. Numbers from
the demo database (session times and audit log); the answer-key comparison was made by the coding assistant and has
not been checked by a nurse.

| Run | Start to confirm | AI draft wait | Nurse edits | AI drafts vs S03 answer key |
|---|---|---|---:|---|
| 2026-11-23 (U01 nurse, U02 patient) | 5 min 02 s | 117 s | 1 | 17 drafted: 14 correct, 2 wrong, 1 doubtful; 3 missing; 0 filled although not said |
| 2026-11-24 (U03 nurse, U04 patient) | 3 min 28 s | 51 s | 1 | 19 drafted: 18 correct, 0 wrong, 1 doubtful; 2 missing; 0 filled although not said |

Ratings (speed, draft visibility, willingness to use): 5/5/5 from three participants, 4/5/5 from one. **Safety
finding:** in the first run STT heard 血壓 as 「斜壓兩」 and the number check took 「兩」, so systolic BP became 2; the
nurse confirmed it and corrected it to 158 eleven seconds later. The long draft waits came from the demo's Ollama
running on the CPU after its container lost the GPU; on the GPU the same draft takes about 1 s.

## What is not tested yet

- **Time saved and edit burden:** no paper-versus-tool comparison has been run. The 30% time and 90% field targets in
  `EVALUATION_PLAN.md` are still hypotheses; this is CP3 work.
- **Accuracy on held-out cases:** all 14 prompt cases are development cases we tuned on, and their answer key has
  not been checked by a nurse (#45).
- **Real speakers:** one team member's voice only. No noise, accent or Taiwanese-mix study beyond 18 sentences.
- **Outside-user sessions:** two runs with four participants and no paper baseline, so the timings show what happened,
  not time saved. The answer-key comparison still needs a nurse's check.
- **Load:** one STT request at a time; several devices at once is untested (#100).
- **Safety:** the guards are tested on selected inputs only. Quote containment does not prove a quote supports the
  field it was put in; the nurse's review is the safeguard. No clinical use is supported.
