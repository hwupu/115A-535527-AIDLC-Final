# Group01 - Checkpoint 2 submission

**AI voice triage assistant** | CSIC30216 AI-in-the-Loop in Software Project Cycle, NYCU, Fall 2026

吳普軒 314553047 · 張棨翔 414551004 · 劉順松 414551016 · 林均澔 112550026

Repository: https://github.com/hwupu/115A-535527-AIDLC-Final

## Where to start

1. **Read the report:** [`Group01_CP2_Report.md`](Group01_CP2_Report.md) (PDF in the zip). Its sections 1–10 follow
   the deliverables table below, with the key results and links.
2. **Run the prototype:** follow 快速開始 in the repository [`README.md`](../../README.md). One script starts
   everything on macOS/Linux (`./scripts/start.sh --setup`) or Windows (`./scripts/start.ps1 -Setup`); you need
   Node 24, pnpm, Python 3.12, uv and Ollama. Then open http://localhost:5173, use the nurse screen in one browser and
   the physician screen in another.
3. **Check the details** in the files listed below.

Paths are from the repository root. In the zip, the repository files are under `repository/`.

## Deliverables

| # | Deliverable | Where |
| --- | --- | --- |
| 1 | Working prototype two people can use together | The repository; run steps in `README.md` (快速開始) |
| 2 | Design rationale, with at least two user tests outside the team | `docs/cp2/DESIGN_RATIONALE.md`; sessions in `docs/cp2/USER_TEST_PROTOCOL.md` (form: `USER_TEST_FORM.md`, scenarios: `SCENARIO_CARDS.md`) |
| 3 | Updated evaluation report | `docs/cp2/EVALUATION_REPORT.md` (metric definitions: `docs/cp2/METRICS.md`; plan: `docs/EVALUATION_PLAN.md`) |
| 4 | System prompt and prompt documentation card | `CLAUDE.md` (coding agent); `services/llm/prompts/v5.txt` (the product's model); `docs/cp2/PROMPT_CARD.md` |
| 5 | AI usage guidelines, updated from Week 3 | `AI_USAGE_GUIDELINES.md` (v0.3, with the changes from v0.1 and v0.2) |
| 6 | Prompt test suite: 10+ cases, one fail → fix → re-run cycle | `eval/cases.json` (14 cases), `eval/run_prompt_suite.py`; raw outputs in `docs/cp2/evidence/` |
| 7 | `DECISIONS.md`, up to date | `DECISIONS.md` |
| 8 | GitHub contributor graph | https://github.com/hwupu/115A-535527-AIDLC-Final/graphs/contributors; screenshot `docs/cp2/CONTRIBUTOR_GRAPH.png` |
| 9 | Walking skeleton pull request | Worksheet `docs/cp2/WALKING_SKELETON.md`; merged PR linked in the report |
| 10 | Merge-day activity in `DECISIONS.md` | Merge plan and outcome in `DECISIONS.md`; worksheet `docs/cp2/MERGE_DAY.md` |

The course asks for the worksheets at `docs/walking_skeleton.md` and `docs/merge_day.md`. We keep course files in
`docs/cp2/`; the instructor's blank originals are in `docs/references/`.

## Readiness and remaining requirements

The walking skeleton, merge day and fresh-clone test were completed at the four-person meeting on 2026-11-26, 21:30–23:12 (+08:00). The remaining gaps are listed in the report.
The machine-readable status is `SUBMISSION_STATUS.json`; evidence and next actions are in
`CLOSEOUT_STATUS.md`. 
Do not infer completion from the absence of a temporary table column.

## Other files in this folder

- `evidence/`: raw outputs of real runs (prompt suite, Whisper benchmark, browser tests), each folder with a README.
- `_package.py`: builds the E3 zip (below).

## Building the zip (team)

1. Commit everything, then export the report to `docs/cp2/Group01_CP2_Report.pdf` and save the contributor graph
   screenshot as `docs/cp2/CONTRIBUTOR_GRAPH.png` (both stay out of git).
2. Run `python3 docs/cp2/_package.py`. It writes `submission/Group01_CP2.zip`, taken from the last commit, and warns
   about unfinished requirements, blank worksheets and unresolved report placeholders. A warning about a real gap must not be suppressed; `--strict` refuses a final-ready package while any gap remains.
3. Upload `Group01_CP2.zip` to E3 under "CP2" by Sunday, November 29, end of day.
