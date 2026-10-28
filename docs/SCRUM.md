# Scrum Process (Draft)

Plan and dates: `docs/ROADMAP.md`. **The backlog lives only on the GitHub Project board** (issues, owners, sprints); it is not copied into any doc. Team roles and area leads: `README.md`.

Decision record: `DECISIONS.md` (2026-10-08, 2026-10-27). Items marked **TBD** are still open.

## Roles

| Role | Who | Notes |
|---|---|---|
| Scrum Master | AI agent (Claude Code) | Facilitates and records; no decision authority |
| Product Owner | 張棨翔 | Orders the backlog, accepts or rejects work, voice of the nurse/physician |
| Code steward | Rotates weekly (schedule in `README.md`) | Final call on AI-output disputes; cannot be sole approver of own PR |
| Developers | All four members | Own and can explain every line they commit |

Area leads and their duties: see `README.md` (single source). Area leads reassign tickets within their area when someone is overloaded.

## What the AI Scrum Master does

- Drafts the sprint plan from the backlog and proposes a sprint goal for the team to confirm.
- Prepares the check-in summary: what changed, what is blocked, what is at risk.
- Keeps the board up to date from PRs and issues (status, sprint, owner), and points out overloaded members so area leads can reassign.
- Prepares review and retrospective notes, including AI-related issues (wrong output, rework).
- Reminds the team of process rules: PR template, prompt-log entries, `DECISIONS.md` entries, Git LFS check.

## What it must not do

- Decide scope, priorities, or acceptance; settle disagreements.
- Assign or reassign tickets on its own. It may suggest; the area lead or the team decides.
- Merge or push to `main`, or approve PRs.
- Record a decision on its own. It drafts the entry; a human confirms it.

## Cadence

- Sprint length: **2 weeks** (Mon–Sun). S0 = Week 8 (setup), S1 = Weeks 9–10, S2 = 11–12, S3 = 13–14, Week 15 = buffer, Week 16 = demo. Dates in `docs/ROADMAP.md`
- Sprint Planning on the first Monday of each sprint; mid-sprint check at the weekly Google Meet; Review and Retrospective on the last day
- Check-ins: async daily standup in LINE (done / next / blocked); weekly Google Meet
- Code steward still rotates weekly, independent of sprint length

## Definition of Done (starting point)

- PR approved by a human other than the author.
- Tests pass, or the PR explains why none apply.
- Author can explain the change without re-prompting the AI.
- AI involvement is logged in `prompt-log/`; significant choices are in `DECISIONS.md`.
- No real patient data or secrets are included.

## Where things live

- Backlog and sprint board: GitHub Project https://github.com/users/hwupu/projects/3. Fields: Status (Todo / In Progress / Done), Sprint (iteration), Size (S/M/L), Epic. Sprints are also milestones. Cards and issues in 繁體中文; issue titles start with the item ID, e.g. `[P1]`
- Sprint notes: `docs/sprints/` (one file per sprint, to create)
- Decisions: `DECISIONS.md`; AI interaction records: `prompt-log/`
