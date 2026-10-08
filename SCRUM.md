# Scrum Process (Draft)

Decision record: `DECISIONS.md` (2026-10-08). Items marked **TBD** need a team decision.

## Roles

| Role | Who | Notes |
|---|---|---|
| Scrum Master | AI agent (Claude Code) | Facilitates and records; no decision authority |
| Product Owner | TBD (human) | Orders the backlog, accepts or rejects work |
| Code steward | Rotating; initially 吳普軒 | Final call on AI-output disputes |
| Developers | All team members | Own and can explain every line they commit |

## What the AI Scrum Master does

- Drafts the sprint plan from the backlog and proposes a sprint goal for the team to confirm.
- Prepares the check-in summary: what changed, what is blocked, what is at risk.
- Keeps the backlog and sprint notes up to date from PRs and issues.
- Prepares review and retrospective notes, including AI-related issues (wrong output, rework).
- Reminds the team of process rules: PR template, prompt-log entries, `DECISIONS.md` entries, Git LFS check.

## What it must not do

- Decide scope, priorities, or acceptance; assign work to individuals; settle disagreements.
- Merge or push to `main`, or approve PRs.
- Record a decision on its own. It drafts the entry; a human confirms it.

## Cadence

- Sprint length: **TBD**
- Check-ins: **TBD** (async or live)
- Review and retrospective: end of every sprint

## Definition of Done (starting point)

- PR approved by a human other than the author.
- Tests pass, or the PR explains why none apply.
- Author can explain the change without re-prompting the AI.
- AI involvement is logged in `prompt-log/`; significant choices are in `DECISIONS.md`.
- No real patient data or secrets are included.

## Where things live

- Backlog and sprint board: **TBD** (e.g. GitHub Projects)
- Sprint notes: **TBD** (e.g. `sprints/` folder)
- Decisions: `DECISIONS.md`; AI interaction records: `prompt-log/`
