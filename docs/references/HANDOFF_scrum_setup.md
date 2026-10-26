> **Historical source (2026-10-27).** The live backlog is the GitHub Project board (https://github.com/users/hwupu/projects/3); §7.4–7.6 here are superseded by it, by `docs/ROADMAP.md` (2-week sprints from Week 9, Week 15 buffer, CP2 Nov 23, CP3 Dec 14) and by `README.md` (roles). FastAPI is decided. Do not update this file; update the live docs instead.

# HANDOFF：AI 語音檢傷問診輔助系統 — Scrum 專案建置交接文件

> **Audience:** another AI agent (or human) who will set up and run this project using Scrum.
> **Written:** 2026-10-26 · **Updated:** 2026-10-27 (Group 1, web stack, owners, backlog, scenarios, metrics) · **Course:** CSIC30216 AI-in-the-Loop in Software Project Cycle (NYCU, Fall 2026)
> **Language note:** Course submissions are in English and team-internal communication is in Chinese (see §0.5). Medical/clinical terms keep their **Traditional Chinese (台灣)** form because the product must follow Taiwan's hospital workflow and terminology. Use the glossary in §6 and do not "translate away" these terms in UI, prompts, data schemas, or test data.

---

## 0. TL;DR

We are building a **web application** (browser only; no native iPhone app, no WebView) that **listens to the nurse–patient conversation at an emergency department triage station (急診檢傷站), transcribes it, and drafts a structured triage report** (主訴, 現在病史 HPI, TOCC, 量測禁忌 etc.). The **nurse reviews, corrects, and confirms**; the **nurse decides 檢傷級數**. The AI never decides triage level and never writes to the HIS without nurse confirmation.

Your job: set up the GitHub repo, Scrum process, backlog, and sprint plan so the team of 4 can build, evaluate, and document this across the semester.

---

## 0.5 Language & Communication Policy (team decision)

| Context | Language |
|---|---|
| **Anything submitted to the class** (CP1/CP2+ documents, evaluation report, demo materials, slides, E3 uploads) | **English** |
| **Communication within the group** (LINE, Google Meet, standups, retros, messages to teammates) | **繁體中文（台灣）** |
| **GitHub Projects** (board cards, descriptions, status notes) | **繁體中文（台灣）** |
| **README** | Primarily **English**; Chinese is OK |
| **Commit messages** | Primarily **English**; Chinese is OK |

Rules for the receiving agent:
- When you write to teammates (summaries, standup prompts, board items, explanations), use **繁體中文（台灣）** with Taiwan usage (e.g., 軟體、程式、檔案、資料庫、介面、品質), not Mainland terms.
- When you write anything that will be **submitted to the course**, write it in **English**, keeping the Chinese clinical terms from §6 as they are (e.g., 主訴, 現在病史, TOCC).
- Don't mix languages within one deliverable beyond the clinical terms. If a Chinese working document later becomes a submission, produce a separate English version.
- **Not specified by the team (ask, default shown):** issue/PR titles and review comments (default: Chinese, since they feed GitHub Projects and are team-internal), PR/issue template wording (default: bilingual headings), code identifiers and code comments (default: English identifiers; Chinese comments OK). Record the answer in `DECISIONS.md`.

---

## 1. Project Context

### 1.1 Team (4 members)

| Name | Student ID |
|---|---|
| 吳普軒 (Wu Pu-Hsuan) | 314553047 |
| 張棨翔 (Chang Chi-Hsiang) | 414551004 |
| 劉順松 (Liu Shun-Sung) | 414551016 |
| 林均澔 (Lin Chun-Hao) | 112550026 |

- Group number: **Group 1** (submission file name is probably `Group01_CP1`; confirm the exact format with the course page/TAs)
- Repository: https://github.com/hwupu/115A-535527-AIDLC-Final
- Roles to assign (do **not** assume; ask the team): Product Owner, Scrum Master, **code steward** (course requirement, recorded in `DECISIONS.md`).

### 1.2 Course constraints (source: https://csic30216-fall26.denniswang.net/project/cp1/)

CP1 deliverables (5% of grade, team grade, one PDF/zip `GroupXX_CP1` on E3):
1. Team charter
2. Problem statement with evidence (≥2 people outside the team)
3. Initial interaction design sketch
4. Draft evaluation plan
5. Repo link with: branch protection on `main`, `.github/PULL_REQUEST_TEMPLATE.md`, `DECISIONS.md` (≥1 real entry), current code steward recorded in `DECISIONS.md`

Notes:
- The CP1 page is **inconsistent about the due date** (Oct 25 vs Oct 12). Today (2026-10-27) is already past both dates; confirm the submission status with the team.
- **Known calendar (from the team):** this week is **Week 8** (Mon Oct 26 – Sun Nov 1). The **DEMO is in Week 16 on Mon Dec 21, 2026**.
- **Other checkpoints (CP2+) are unknown to this document.** Fetch https://csic30216-fall26.denniswang.net/project/ and the calendar/assignments pages, then add them to §7.6.
- Rubric philosophy: *specific, honest, grounded in evidence.* Claims beyond evidence are penalized; admitting uncertainty is not.

### 1.3 Problem (summary of CP1)

At the 急診檢傷站, the 檢傷護理師 must take history (TOCC, 主訴, 量測禁忌) while operating the blood-pressure cuff and pulse oximeter and watching the patient. They cannot type, so they handwrite on scrap paper and re-key into the HIS after the patient leaves.

Evidence (2 interviews, see `docs/interviews/CP1訪談紀錄.md`):
- **Triage nurse (8 yrs, teaching hospital ED):** double handling; self-estimated +2–3 min/patient; queue backs up; 3–4 slips pile up at peak so the HIS has no data meanwhile; occasional transcription errors; HIS has fragmented fields/tabs and typing breaks eye contact.
- **Attending ED physician (10+ yrs):** 主訴 arrives as a few words ("發燒、腹痛"), lacking onset/character/associated symptoms; physician re-asks TOCC and HPI; triage fields sometimes still empty when patient is in the room, so abnormal vitals go unflagged.

**Known evidence limits (keep honest in all docs):** both interviews are from teaching-hospital EDs; the physician was asked about a tool idea (possible leading framing); the 2–3 min figure is the nurse's estimate, not measured. Interview notes contain stray `[cite: 1]` markers that must be removed/verified before they are used as evidence.

---

## 2. Product Vision & Boundaries

**Vision:** Let the 檢傷護理師 keep hands and eyes on the patient while the system drafts the paperwork.

**Human–AI boundary (non-negotiable):**

| AI may | Human (護理師) must |
|---|---|
| Transcribe speech (Whisper) | Review every field |
| Split conversation into structured fields (Gemma-4) | Correct errors and confirm before saving |
| Draft 主訴 / HPI, flag danger signs (e.g., 發燒, TOCC risk) | **Decide 檢傷級數** |
| — | Make all clinical decisions (physician) |

The AI **must not** assign 檢傷級數, give diagnosis/medical advice, or auto-write into a real HIS.

**Out of scope (for now):** real HIS integration, real patient data, 掛號 workflow automation, diagnosis support, 出院 (discharge) summaries (earlier brainstorm idea, not chosen).

---

## 3. Technical Baseline

**Platform:** web app only (desktop or tablet browser at the triage station). No native iPhone app and no WebView.

| Area | Decision / status |
|---|---|
| Package manager | **pnpm** (workspace) |
| Frontend | **Vue 3** + **Tailwind CSS** + **shadcn** (the Vue port is *shadcn-vue*; confirm). Vite + TypeScript recommended |
| Backend / API | **TBD**, proposal: Python **FastAPI** (Whisper and Gemma tooling are Python-first); WebSocket for audio in / draft updates out |
| Speech-to-text | **Whisper** (e.g., faster-whisper); verify Mandarin, Taiwanese-accented Mandarin, masks, and medical terms |
| LLM | **Gemma-4**; serving runtime TBD (Ollama / vLLM / llama.cpp). **Spike needed**: GPU availability, latency |
| Orchestration | **docker-compose**; proposed services: `web`, `api`, `stt`, `llm`. One command (`docker compose up`) must start everything |
| Persistence | MVP: SQLite or JSON per session; **audio not stored by default** (§4) |
| CI | GitHub Actions: lint, typecheck, test, build, docker build (answers the team's "ci/cd?" question) |

Proposed flow (confirm with the team):

```
Browser (Vue)                API (FastAPI)              stt            llm (Gemma-4)
 mic → MediaRecorder  ──audio chunks (WebSocket)──▶  Whisper ──text──▶  extract → JSON
 live transcript ◀────────────── transcript ─────────┘                    │
 editable draft form ◀──────────── draft fields (+source_span, status) ◀──┘
 nurse edits/confirms ──confirm──▶ session saved ──▶ physician read-only view (2nd browser)
```

Web-specific notes:
- `getUserMedia` requires a **secure context** (`https://` or `localhost`). A demo from a second device needs HTTPS (reverse proxy / self-signed cert); plan this early (backlog P4).
- Prepare an **offline demo fallback** (pre-recorded audio fixtures) in case the room has no GPU/network.
- Real-time incremental drafting is a stretch goal; the MVP can draft after each pause or at end of conversation.

Unclear items from the team's early notes: "RAG?" (spike B8), "NDR? Solo?" (abbreviations unclear; ask the team), and the actual state of earlier FE/BE/LLM prototypes (verify in the repo before planning).

Design suggestions (not decided; log in `DECISIONS.md`):
- Output schema = strict JSON validated against a schema, rendered as an editable form (schema in `SCENARIOS.md`).
- Every field stores `source_span` (transcript excerpt) so the nurse can verify quickly.
- Each field has a state: `未提及` / `AI 草稿` / `護理師已確認`. **Empty is better than invented.**
- Dates of birth are spoken in the 民國 calendar; store ISO date and display 民國.
- Prefer local inference for privacy; document the choice.

---

### 3.1 Target structured report (from 醫院檢傷問診病人查核表)

1. **TOCC 篩檢:** 發燒/咳嗽/感冒症狀；旅遊史 (Travel, 過去兩個月內，國內/國外)；職業 (Occupation)；接觸史 (Contact)；群聚史 (Cluster)
2. **生理量測評估:** 量測禁忌 (e.g., 洗腎瘻管、開刀患側 → 不可量血壓/打針)；若有則「禁止治療」手圈；生命徵象 (血壓、脈搏、血氧；values may be dictated by nurse)
3. **主訴深度詢問:** 主訴 (Chief Complaint) + 現在病史 (HPI): 發作時間、疼痛性質、伴隨症狀 etc.
4. **其他:** 出生年月日、家屬陪同、行動能力 (步行/輪椅)
5. **護理專業評斷:** 檢傷級數 — **human-only field**
6. **行政動線:** 引導至掛號區 — checklist item, not AI-generated

Standard question script (keep verbatim in test scenarios):
- 請問目前有發燒、咳嗽或感冒症狀嗎？
- 過去兩個月內，有去過國內或國外旅遊嗎？
- 請問您的兩隻手都可以量血壓嗎？
- 請問這次是哪裡不舒服來掛急診呢？
- 請問您的出生年月日是？
- 請問今天有家屬陪同過來嗎？
- 您目前走路可以嗎？還是需要幫您安排輪椅？

---

## 4. Privacy, Ethics, Safety Guardrails

- **No real patient data** in the repo, prompts, logs, or demos. Evaluation uses **simulated patients (模擬情境)**. Say this explicitly in evaluation docs.
- If real recordings are ever considered: requires informed consent, IRB/ethics consultation, and compliance with Taiwan's **個人資料保護法 (PDPA)** and hospital policy. Do not proceed without team + instructor sign-off. *(Do not give legal conclusions; flag and escalate.)*
- Test data must be synthetic; never include real names, 身分證字號, 病歷號.
- LLM output is a **draft**; UI must visibly label it as AI-generated until nurse-confirmed.
- Never let prompts embed instructions to "infer triage level."
- Log model/version and prompt version for every evaluation run (reproducibility).

---

## 5. Evaluation Plan & Testing Metrics

Test/demo scenarios are in `SCENARIOS.md`. The CP1 draft plan stays the same in spirit (structured observation with nurses on simulated scenarios); numbers below are **proposals to finalize after the pilot (Week 13)**.

### 5.1 Principles
1. **Success is about the nurse, not only the model.** Course rubric: measure what happens for users (time, edits, trust), not just output quality.
2. **Evaluate in layers** so errors can be localized: STT, then extraction, then end-to-end with nurses.
3. **Safety-weighted.** A fabricated vital sign or a missed 量測禁忌 matters far more than a vague HPI. Report safety fields separately; never hide them in an average.
4. **Small n: show raw counts.** Report "9/10 scenarios" and per-item results, medians and ranges, not p-values or "95% accuracy" from tiny samples.
5. **Avoid fooling ourselves:** hold-out scenarios, nurse-written references, and at least some hard cases (`SCENARIOS.md` §2 split).

### 5.2 Metrics

| Layer | Metric | How | Proposed target (provisional) |
|---|---|---|---|
| STT | **CER** (character error rate; use CER, not WER, for Chinese) | Whisper output vs. human transcript | report only; set after S4 baseline |
| STT | Medical-term recall (e.g., 洗腎瘻管, 血氧, 瘻管, 胸悶) | key-term list per scenario | report only |
| Extraction | Categorical fields (TOCC yes/no, 量測禁忌 side, wristband, mobility) accuracy | exact match vs. reference | ≥ 90% |
| Extraction | Vitals exact match (BP, HR, SpO₂, temp) | numeric exact | ≥ 95%, **0 fabricated** |
| Extraction | HPI **key-element recall** (onset, location, quality, severity, associated symptoms) | rubric checklist per scenario, scored by a human (LLM judge only as a secondary aid) | ≥ 80% |
| Safety | **Fabrication rate**: field filled but never said | count over all fields | **0 for vitals/量測禁忌/TOCC**; low elsewhere |
| Safety | **Critical omission**: missed 量測禁忌, positive TOCC, or danger-sign phrase | count | 0 in dev set; report in held-out |
| Safety | **Boundary violations**: AI outputs a triage level or advice | automated check on all outputs | **0** |
| Error propagation | Extraction on **gold transcript** vs. on **Whisper transcript** | run both | gap shows how much STT hurts |
| Latency | Time from end of speech to field appearing (p50/p95); end-of-conversation to complete draft | harness + frontend logs | to be set with nurse (target: no waiting at the station) |
| Human outcome | **Documentation time** with tool vs. paper-then-HIS, same scenarios, counterbalanced order | observation timer | ≥ 30% less (nurse's own estimate of the problem is 2–3 min/patient) |
| Human outcome | **Edit burden**: number of fields changed before confirm; time-to-confirm | frontend event log | report; lower is better |
| Human–AI | **Error catch rate**: in some runs, inject known wrong values into the draft; do nurses notice? | seeded errors | ≥ 80%; guards against automation bias |
| Perception | 3–5 item survey: trust, would-use, perceived workload (SUS-lite or NASA-TLX-lite) + 1 interview question | post-session | report; quotes |

### 5.3 Minimum evidence threshold (proposal)
Skeptic-proof minimum: **≥ 3 nurses × ≥ 6 scenarios each** (or ≥ 10 scenarios overall), showing (a) the time saving, (b) zero boundary violations and zero fabricated vitals/量測禁忌, and (c) most nurses say they would use the draft. Adjust after the pilot and **say honestly** if recruitment falls short.

### 5.4 Method & timing
Structured observation: nurse role-plays with a team member as patient using scripted scenarios, once with paper-then-HIS entry and once with the tool (order counterbalanced). Pilot with the campus nurse in Week 13, runs in Week 14, analysis in Week 15 (see §7.5).

### 5.5 Test hygiene
- Keep prompts tuned on **dev scenarios only**; held-out scenarios are looked at only for evaluation. Once a scenario has been used to tune, it becomes dev. Have the nurse write fresh ones if needed.
- Log model version, prompt version, Whisper model, and git commit with every run (reproducible results).
- Record fixtures from teammates reading scripts, plus noisy/masked variants. Synthetic data only; no real patient information.

---

## 6. Glossary (中英對照 — keep Chinese in UI and data)

| 中文 | English | Notes |
|---|---|---|
| 急診 / 急診室 | Emergency Department (ED) | |
| 檢傷 / 檢傷分類 | Triage | |
| 檢傷站 | Triage station | |
| 檢傷護理師 | Triage nurse | primary user |
| 檢傷級數 | Triage level / acuity | Taiwan uses **TTAS (台灣檢傷與急迫度分級量表)**, 5 levels; **human-only decision**. Verify current official level names with the nurse; do not hardcode from memory. |
| 主訴 | Chief Complaint (CC) | |
| 現在病史 | History of Present Illness (HPI) | onset, quality, associated symptoms |
| TOCC | Travel / Occupation / Contact / Cluster | 旅遊史、職業、接觸史、群聚史 |
| 生命徵象 | Vital signs | 血壓 (BP)、脈搏 (HR)、血氧 (SpO₂)、體溫 |
| 量測禁忌 | Measurement contraindication | e.g., 洗腎瘻管側、開刀患側 |
| 「禁止治療」手圈 | "No treatment" wristband | applied when a limb must not be punctured/measured |
| 洗腎瘻管 | Dialysis fistula | |
| 患側 | Affected side | |
| 掛號 | Registration | after triage |
| 病歷 | Medical record | |
| 院內醫療資訊系統 (HIS) | Hospital Information System | |
| 電子病歷 (EMR) | Electronic medical record | |
| 主治醫師 | Attending physician | second stakeholder |
| 家屬陪同 | Accompanying family | |
| 輪椅 | Wheelchair | |
| 發燒 / 咳嗽 / 呼吸道症狀 | Fever / cough / respiratory symptoms | |
| 模擬情境 | Simulated scenario | evaluation setting |

When adding terms, get them reviewed by a nurse/physician contact; mark unverified ones `(待確認)`.

---

## 7. Scrum Setup — What To Do

> Principle: **propose, then confirm with the team.** Don't assign roles or commit dates on their behalf. Log process decisions in `DECISIONS.md`.

### 7.1 Repository hygiene (verify first; CP1 rubric items)

- [ ] Branch protection on `main` (require PR, ≥1 approval, no force-push; **TAs must be able to see it**; add TAs as collaborators if the repo is private)
- [ ] `.github/PULL_REQUEST_TEMPLATE.md` (checklist: linked issue, tests, reviewed, DECISIONS.md updated if design choice, no real patient data)
- [ ] `DECISIONS.md` with a **real** first entry + **current code steward** named
- [ ] `docs/` with CP1 submission, interview notes (cleaned), this handoff, and `SCENARIOS.md` (test/demo scenarios)
- [ ] Issue templates: user story, bug, spike, evaluation task
- [ ] Labels: `story`, `bug`, `spike`, `eval`, `docs`, `ai-safety`, `blocked`, `needs-pairing`, size labels (`S/M/L`)
- [ ] GitHub Projects board with **exactly three columns: `Todo` → `In Progress` → `Done`** (team decision; keep it simple). Cards are written in 繁體中文. Code review happens in the GitHub PR, so a card stays in `In Progress` until its PR is merged. Use a `Sprint` field/iteration (weekly) and an `Owner` field instead of extra columns
- [ ] CI (lint + tests) if feasible; resolves team's open "ci/cd?" question

`DECISIONS.md` entry format (ADR-lite):
```
## YYYY-MM-DD — <Decision title>
- Status: proposed | accepted | superseded
- Context:
- Options considered:
- Decision:
- Consequences / risks:
- Decided by:
```

### 7.2 Scrum roles (propose; team confirms)

- **Product Owner:** owns backlog priority and the nurse/physician voice. Suggest someone who manages stakeholder contact.
- **Scrum Master:** facilitates events, removes blockers.
- **Developers:** all four members.
- **Code steward:** course-required role; reviews merges and guards `main`. **Team decision: the code steward rotates weekly** (schedule in §7.6). Update "Current code steward" in `DECISIONS.md` at every handover, because the course checks it.
- PO and SM are not yet assigned; ask the team. They may be fixed or rotated, and should be recorded either way.

**Area leads (stated by the team).** Each member leads one area. "Area lead" means *accountable for the area's design, quality, and unblocking others*, not necessarily writing every line.

| Person | Area lead for |
|---|---|
| 吳普軒 | Frontend; also CI, `.env` handling, and the README quickstart |
| 張棨翔 | LLM, backend/API, STT, docker-compose |
| 劉順松 | Audit (audit log, data retention) and metrics (evaluation measurements) |
| 林均澔 | Scenarios and write-up (English documents) |

Working agreements (proposal; confirm):
1. **Owner and reviewer:** each item in §7.4 has an *Owner* (does the work) and a *Pair/Review* person. The area lead reviews everything in their area.
2. **Clear issues:** write issues in 繁體中文 with a goal, hints/links, acceptance criteria, and a size. Break any L item into smaller pieces where possible. Label items that need a second person `needs-pairing`.
3. **Pairing:** schedule pairing sessions (60 min, screen share on Google Meet) wherever areas touch: backend↔frontend (API contract), backend↔metrics (audit log format), scenarios↔LLM (reference reports).
4. **Review turnaround:** reviewers respond within 24 h and explain *why*, not just what to change.
5. **Bus factor:** 張棨翔 holds most of the backend/LLM knowledge; he writes `docs/architecture.md` in S2, and by the end of S2 at least one other member must be able to run `docker compose up` from scratch and run the eval harness.
6. **Learning log:** a short 繁中 note per person per sprint (what I did / what I learned / what blocked me), which also feeds the retrospective.
7. **Don't hide problems:** blockers raised in the daily LINE standup are never penalized; ask early.

### 7.3 Cadence (adapt to semester calendar)

- **Sprint length:** 1 week or 2 weeks. Recommend **1-week sprints** (Mon–Sun), aligned with the *weekly meeting* (Google Meet) and the **weekly code steward rotation**; the team has not formally chosen sprint length, so confirm it.
- **Events:** Sprint Planning (≤1h), async Daily Standup in LINE (3 lines: done / next / blocked), Sprint Review (demo to a nurse/TA when possible), Retrospective (≤30 min).
- **Communication:** LINE group (daily), Google Meet (weekly). Response-time norm: **TBD by team** (suggest 24h).
- **Definition of Done (team):** PR reviewed & approved by ≥1 other member → merged to `main` → tests pass → `DECISIONS.md` updated if design choice → no real patient data → demo-able.
- **Definition of Ready:** story has acceptance criteria, estimate, and no unresolved dependency.

### 7.4 Product backlog (web app)

Sizes: S ≤ ½ day, M ≈ 1–2 days, L ≈ 3–5 days. *Owner* does the work; *Pair/Review* supports or reviews. Area leads are in §7.2. Item assignments are proposals unless marked "stated"; confirm with the team.

**Load warnings:** 張棨翔 leads four areas and 吳普軒 leads the whole frontend plus CI/`.env`/README. Use the **scope levers** below early if either falls behind.

**Epic P: Platform & infra**

| ID | Story | Owner | Pair/Review | Sprint | Size |
|---|---|---|---|---|---|
| P1 | pnpm monorepo skeleton (`apps/web`, `services/api`, `services/stt`, `services/llm`); `docker compose up` starts all with stubs | 張棨翔 | review: 吳普軒 | S1 | M |
| P2 | GitHub Actions CI: lint, typecheck, test, build, docker build *(stated: 吳普軒)* | 吳普軒 | review: 張棨翔 | S1 | S |
| P3 | `.env` handling, dev/demo compose profiles, English README quickstart *(stated: 吳普軒)* | 吳普軒 | review: 張棨翔 | S2 | S |
| P4 | HTTPS/secure context so mic works from a second device (demo) | 張棨翔 | review: 吳普軒 | S4 | S |
| P5 | Demo environment (machine/GPU, offline fallback with pre-recorded audio) | 張棨翔 + 吳普軒 | 劉順松, 林均澔 | S7 | M |

**Epic A: Speech-to-text**

| ID | Story | Owner | Pair/Review | Sprint | Size |
|---|---|---|---|---|---|
| A1 | Spike: Whisper model size, latency, CER on Taiwan Mandarin, masks, medical terms. 張棨翔 designs the spike, 劉順松 measures CER/latency, 林均澔 supplies test audio | 張棨翔 | 劉順松, 林均澔 | S1–S2 | M |
| A2 | STT service: audio chunk → transcript (zh-TW) | 張棨翔 | — | S2 | M |
| A3 | Chunked/streaming transcription with timestamps | 張棨翔 | — | S3 | M |
| A4 | Spike: speaker separation (nurse/patient/family) needed? | 張棨翔 | 劉順松 (measures effect) | S4 | S |
| A5 | Medical-term list + post-correction dictionary (terms from scenarios and nurse input) | 林均澔 | review: 張棨翔 | S5 | M |

**Epic B: LLM extraction**

| ID | Story | Owner | Pair/Review | Sprint | Size |
|---|---|---|---|---|---|
| B1 | Report JSON schema v0 (from `SCENARIOS.md` §1) agreed with FE and a nurse | 張棨翔 | review: 吳普軒, 林均澔 | S1 | S |
| B2 | Spike: Gemma-4 serving in docker-compose (runtime, GPU, latency) | 張棨翔 | — | S1 | M |
| B3 | Prompt v1: transcript → schema JSON in 繁中, `未提及` handling | 張棨翔 | — | S2 | M |
| B4 | Schema validation + retry/repair; `source_span` per field | 張棨翔 | — | S3 | M |
| B5 | Spike: is RAG needed? Log decision | 張棨翔 | — | S3 | S |
| B6 | Incremental drafting as the conversation grows *(stretch; see levers)* | 張棨翔 | — | S4 | L |
| B7 | Prompt/model version tags + eval-run logging (format agreed with metrics) | 張棨翔 | pair: 劉順松 | S4 | S |
| B8 | Danger-sign **flag suggestions** (thresholds from nurse, collected by 林均澔); automated "no triage level" guard test | 張棨翔 | 林均澔, 劉順松 | S5 | M |
| B9 | Vitals parsing from dictation incl. self-corrections and number formats | 張棨翔 | — | S5 | M |

**Epic C: Frontend (Vue + Tailwind + shadcn)**

| ID | Story | Owner | Pair/Review | Sprint | Size |
|---|---|---|---|---|---|
| C1 | App shell, routing, tablet/desktop layout, 繁中 UI | 吳普軒 | — | S1 | M |
| C2 | Recording UI: mic permission, start/stop, level meter, connection status | 吳普軒 | — | S2 | M |
| C3 | Live transcript panel | 吳普軒 | — | S3 | M |
| C4 | Editable draft form with per-field status (`未提及` / `AI 草稿` / `護理師已確認`) | 吳普軒 | — | S3 | L |
| C5 | Click a field → highlight its `source_span` in the transcript | 吳普軒 | — | S4 | M |
| C6 | Confirm & export (copy text/JSON, print) for manual paste into HIS | 吳普軒 | — | S4 | S |
| C7 | 量測禁忌 callout + 「禁止治療」手圈 reminder; danger-flag display as *suggestion* style | 吳普軒 | — | S5 | M |
| C8 | Physician read-only view, synced to confirmed report (second browser/tab) | 吳普軒 | — | S6 | M |
| C9 | Ergonomics: large touch targets, minimal typing, keyboard shortcuts | 吳普軒 | — | S6 | S |
| C10 | Evaluation mode: scenario picker, timer, event log feeding the audit log (event format agreed with 劉順松) | 吳普軒 | pair: 劉順松 | S6 | M |

**Epic D: Session API & audit** (audit is 劉順松's area)

| ID | Story | Owner | Pair/Review | Sprint | Size |
|---|---|---|---|---|---|
| D1 | Session API: create session, WebSocket (audio in, transcript/draft out), confirm endpoint | 張棨翔 | — | S2 | L |
| D2 | **Audit log**: persist sessions and every nurse edit (who/what/when, AI value vs. confirmed value) in SQLite; format used by the metrics | 劉順松 | review: 張棨翔 | S4 | M |
| D3 | **Data retention**: no audio stored by default; delete-session endpoint; retention note for the privacy checklist (§4) | 劉順松 | review: 張棨翔 | S5 | S |
| D4 | Physician view updates on confirm (polling is fine; pub/sub optional) | 張棨翔 | pair: 吳普軒 | S6 | M |

**Epic E: Metrics, scenarios & evaluation** (metrics: 劉順松; scenarios: 林均澔)

| ID | Story | Owner | Pair/Review | Sprint | Size |
|---|---|---|---|---|---|
| E1 | Finalize 10+ scenarios and reference reports; **nurse reviews** | 林均澔 | review: 吳普軒 | S1–S3 | M |
| E2 | Record audio fixtures (clean, masked, noisy variants) | 林均澔 + all | — | S3–S4 | M |
| E3 | `docs/metrics.md`: precise definitions for every metric in §5.2 (formulas, field normalization rules, how "未提及" is scored) | 劉順松 | review: 林均澔, nurse for HPI rubric | S2–S3 | M |
| E4 | Eval harness part 1 (metrics): load references, per-field metric functions, CER, fabrication/omission/boundary checks, unit tests | 劉順松 | guidance: 張棨翔 | S4 | M |
| E5 | Eval harness part 2 (pipeline): run STT → LLM, collect outputs, write the run log | 張棨翔 | pair: 劉順松 | S4 | M |
| E6 | Analysis scripts: time-to-confirm, edit burden, latency p50/p95 from the audit log; seeded-error tooling for the error-catch-rate test | 劉順松 | review: 吳普軒 | S5–S6 | M |
| E7 | Baseline protocol: paper-then-HIS timing in simulation (counterbalanced) | 劉順松 | review: 林均澔 | S5 | S |
| E8 | Recruit nurses; consent/briefing script; observation sheet; survey | 林均澔 | 吳普軒 | S4–S6 | M |
| E9 | **Pilot** with campus nurse; change list | all | — | S6 | M |
| E10 | **Evaluation sessions** | all | — | S7 | L |
| E11 | Results analysis (numbers, plots) | 劉順松 | review: 林均澔 | S8 | M |

**Epic F: Process, docs & write-up** (write-up: 林均澔)

| ID | Story | Owner | Pair/Review | Sprint | Size |
|---|---|---|---|---|---|
| F1 | Repo hygiene (§7.1), first `DECISIONS.md` entries (rotation, language, stack, area leads) | 吳普軒 (Week 8 steward) | review: 張棨翔 | S1 | S |
| F2 | Clean interview notes (remove `[cite: 1]` markers), consider 1–2 more interviews | 林均澔 | review: 吳普軒 | S1–S2 | S |
| F3 | Course checkpoint submissions in **English** (CP2+ per course site): 林均澔 drafts, every member reviews their own area | 林均澔 | all | as due | M |
| F4 | Final evaluation write-up in English (uses E11 results) | 林均澔 | review: 劉順松, steward | S8 | M |
| F5 | `docs/architecture.md` (diagram, how to run, how to debug) | 張棨翔 | review: 吳普軒 + one member who must be able to follow it | S2 | S |
| F6 | Demo script + rehearsals (`SCENARIOS.md` §4): 林均澔 leads the script, everyone rehearses | 林均澔 | all | S8–S9 | M |

**Scope levers (cut in this order if 張棨翔's or 吳普軒's load, or the schedule, slips):**
1. B6 incremental drafting → draft only after each pause or at end of conversation.
2. D4 pub/sub → polling every few seconds.
3. A4 speaker separation → skip; rely on the LLM and the nurse.
4. P4 HTTPS → demo from `localhost` on a single machine.
5. C10 evaluation mode → use a stopwatch and a spreadsheet; E6 then works from the spreadsheet.
6. C9 ergonomics and the print part of C6 → defer.
7. B5 RAG spike → default to "no RAG" and log it.
Protect: B3/B4 (core extraction), C4/C5 (review UI), E4 (metrics harness), D2 (audit log), and the boundary guard test (B8).

**Key risks:** concentration of backend/LLM/STT/infra knowledge in one person; frontend load on one person; GPU/hardware for Gemma-4 and Whisper (B2/A1 spikes first); STT quality on Taiwanese-accented speech and masks; demo reliability (fallback fixtures); nurse availability (start recruiting by S4); scope creep (HIS integration, diagnosis support stay out of scope).

### 7.5 Sprint plan (weekly sprints, Week 8 → DEMO Week 16)

S1 is short (today is Tue Oct 27). 張棨翔's S1 priority order: B2 spike, then P1, then B1; 劉順松 measures CER/latency for A1 and 林均澔 supplies test audio. Checkpoint deadlines beyond CP1 are unknown; add a CP task to the relevant sprint once known. Keep ~20% buffer since velocity is unknown.

| Sprint | Week (dates) | Goal | Items | Exit criteria |
|---|---|---|---|---|
| S1 | 8 (Oct 26–Nov 1) | Foundations & decisions | P1, P2, B1, B2, A1, C1, E1 (start), F1, F2 | `docker compose up` runs web+api stubs; schema v0 agreed; Whisper/Gemma spike results in `DECISIONS.md` |
| S2 | 9 (Nov 2–8) | Walking skeleton | A2, B3, C2, D1, P3, F5, E3 (start) | scenario S01 works end-to-end: speak → transcript → draft JSON → shown in UI; at least one other member can run the whole stack from scratch |
| S3 | 10 (Nov 9–15) | Reviewable draft | A3, B4, B5, C3, C4, E1 done, E2 start, E3 done | nurse can edit fields; JSON always valid on dev scenarios; 10 scenarios nurse-reviewed |
| S4 | 11 (Nov 16–22) | Traceability & harness | B6, B7, C5, C6, D2, E2, E4, E5, A4, P4, E8 (start) | harness reports baseline metrics on all fixtures; first numbers logged; recruiting begun |
| S5 | 12 (Nov 23–29) | Safety & hard cases | A5, B8, B9, C7, D3, E6 (start), E7 | safety tests pass (no fabricated vitals, no triage level, 量測禁忌 caught); baseline protocol ready |
| S6 | 13 (Nov 30–Dec 6) | Multi-user & pilot | C8, C9, C10, D4, E6 (finish), E8 (finish), E9 | pilot with campus nurse done; prioritized change list |
| S7 | 14 (Dec 7–13) | Evaluation runs | E10, P5, blocker bug fixes | minimum-evidence data collected (§5.3) |
| S8 | 15 (Dec 14–20) | Freeze & analysis | E11, F3, F4, F6 | feature freeze; analysis done; write-up drafted; demo rehearsed twice |
| S9 | 16 (Dec 21–27) | **DEMO Mon Dec 21** | F6 (demo), final polish, final docs | demo-ready `main`; final English documents submitted |

### 7.6 Code steward rotation schedule (weekly)

Week N starts on Monday; the handover happens at the weekly meeting (or by Monday at the latest). The order is a **proposal** that differs from the CP1 listing order: 吳普軒 and 張棨翔 hold the evaluation, freeze, and demo weeks (14–16) because the frontend and backend they lead are what the demo depends on. **Confirm or reorder with the team.**

| Week | Dates (Mon–Sun) | Code steward | Notes |
|---|---|---|---|
| 8 | Oct 26 – Nov 1 | 吳普軒 | Current week; record in `DECISIONS.md` |
| 9 | Nov 2 – Nov 8 | 劉順松 | Walking-skeleton week |
| 10 | Nov 9 – Nov 15 | 林均澔 | |
| 11 | Nov 16 – Nov 22 | 張棨翔 | |
| 12 | Nov 23 – Nov 29 | 劉順松 | |
| 13 | Nov 30 – Dec 6 | 林均澔 | Pilot week |
| 14 | Dec 7 – Dec 13 | 吳普軒 | Evaluation runs |
| 15 | Dec 14 – Dec 20 | 張棨翔 | Feature freeze; protect `main` for the demo |
| 16 | Dec 21 – Dec 27 | 吳普軒 | **DEMO Mon Dec 21**; steward ensures `main` is demo-ready |

Counts: 吳普軒 3 (Weeks 8, 14, 16), 張棨翔 2 (11, 15), 劉順松 2 (9, 12), 林均澔 2 (10, 13).

Rotation rules (proposed; confirm):
1. At each handover, the outgoing steward updates "Current code steward" in `DECISIONS.md` via a PR and gives a short 繁體中文 handover note (open PRs, risks, anything broken) in the LINE group.
2. Members may swap weeks by agreement; update the table and `DECISIONS.md` in the same PR.
3. The steward may not be the sole approver of their own PR; another member must review it.
4. Week 15 onward: only bug fixes and demo-critical changes merge to `main`.
5. If the actual DEMO date or week numbering changes, regenerate this table (Week N Monday = Oct 26 + 7×(N−8)).
6. **Second reviewer for sensitive PRs:** any PR touching CI, docker-compose, branch protection, or the DB/schema also needs the relevant area lead (吳普軒 for CI, 張棨翔 for docker-compose and DB/schema, 劉順松 for the audit-log format). The outgoing steward gives a 15-minute walkthrough of the steward checklist (PR template items, CI green, `DECISIONS.md` updated, no real patient data, no secrets).

---

## 8. Open Items / Needs Human Input

1. Group number (`GroupXX`) and CP1 submission status (due-date conflict Oct 25 vs Oct 12 on the course page).
2. **CP2+ requirements and dates** — fetch from the course site; update §7.5 and §7.6.
3. Role assignments: PO and SM; confirm the **rotation order** in §7.6 and sprint length.
4. Charter gaps: tie-break rule for disagreements, response-time norm.
5. Evaluation numbers: time-saving target, accuracy target, minimum #nurses/#scenarios, evaluation dates, nurse recruitment route.
6. Name the specific HIS/EMR (if known) for the "existing tools" argument.
7. More than 2 interviews if possible; clean `[cite: 1]` artifacts from interview notes and make sure notes reflect what interviewees actually said.
8. Verify the real state of any earlier FE/BE/LLM code and what "done" means; confirm the backend language (proposal: FastAPI).
9. Confirm TTAS level naming and any hospital-specific form with a nurse before encoding anything.
10. Ethics/consent path if any real audio is ever proposed.
11. Language details not yet decided (§0.5): issue/PR wording, templates, code comments.
12. Confirm the item-level assignments in §7.4 (area leads are stated by the team; the items inside each area are proposals), especially who recruits nurses (E8, proposed: 林均澔) and who owns the term list (A5, proposed: 林均澔). Confirm the steward order in §7.6.
13. Confirm `shadcn` means *shadcn-vue*, the GPU/hardware available for Gemma-4 + Whisper, and the demo environment.
14. Check whether 張棨翔's and 吳普軒's workloads are realistic before S2; use the scope levers in §7.4 early rather than late.
15. Metric targets in §5 are provisional; finalize after the Week 13 pilot, with a nurse's input on danger-flag thresholds.

---

## 9. Instructions to the Receiving Agent

1. **Read this whole file, then inspect the repo** before creating anything; don't duplicate what exists.
2. **Ask before assuming** on roles, dates, and numeric targets (§8). Offer a recommended default plus one-line rationale.
3. **Never fabricate** evidence, interview content, metrics, or clinical facts. Mark unknowns `TBD` / `(待確認)`.
4. **Follow the language policy in §0.5**: English for course submissions, 繁體中文（台灣）for teammates and GitHub Projects; README and commits primarily English.
5. **Keep Chinese medical terms** as in §6 in code identifiers' display strings, UI, prompts, fixtures, and docs.
6. **Honor the human–AI boundary** (§2) in every design, prompt, and test.
7. **Respect the area leads (§7.2 and §7.4):** route work and questions to the right lead, write issues with a clear goal, hints, acceptance criteria, and size, and split L items into smaller pieces; label items needing a second person `needs-pairing`.
8. **Log every non-trivial decision** in `DECISIONS.md` and name who decided.
9. Prefer small PRs linked to issues; follow the PR template; keep `main` green.
10. Output of your first pass should be: (a) repo hygiene checklist status, (b) proposed role/cadence for team confirmation, (c) GitHub issues (cards in 繁體中文, board columns Todo / In Progress / Done) for the backlog in §7.4, (d) the weekly sprint plan and steward rotation from §7.5–7.6, adjusted to any newly found checkpoint dates, with the first `DECISIONS.md` entries for the rotation and language policy.
