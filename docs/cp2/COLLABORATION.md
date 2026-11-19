# Collaboration evidence - human actions outstanding

Repository: https://github.com/hwupu/115A-535527-AIDLC-Final
Contributor graph: https://github.com/hwupu/115A-535527-AIDLC-Final/graphs/contributors
PR list: https://github.com/hwupu/115A-535527-AIDLC-Final/pulls?q=is%3Apr
Board: https://github.com/users/hwupu/projects/3/views/1

Per-member counts are in `REQUIREMENTS.md`. Only real events go here and in `DECISIONS.md`. Do not fill a template before the session happens.

## What each member still needs (as of 2026-11-19)

- **Approvals must carry a substantive comment**: a question, concern or specific suggestion. An empty "Approve" or "LGTM" does not count. Every PR needs one human approver other than the author.
- **林均澔:** 2 merged PRs with substantive code; 2 approvals with comments; record the Week 10 steward handover.
- **劉順松:** 1 more merged PR with substantive code; 2 approvals with comments; record the Week 9 steward handover.
- **張棨翔:** record the Week 11 steward handover.
- If someone is overloaded, ask their area lead to reassign. Do not split empty or doc-only PRs to hit the count.

## Walking skeleton (Week 9) - record when confirmed

Copy into `DECISIONS.md` only with real facts:

```markdown
## 2026-11-0X — Walking skeleton session
- Status: held
- Attendees: (all four names)
- What each person changed: ...
- Result: end-to-end path that ran (patient/nurse → api → doctor), test result
- Merged PR: #...
- What we learned: ...
- Led by: ...
```

If the team never held a joint session, say so honestly in the submission rather than relabeling another PR.

## Merge day (Week 11, Nov 16–22) - not yet held

Agenda: list open PRs and their dependency order; agree who owns each conflict; resolve conflicts; run `./scripts/check-cp2.sh` from a clean checkout of `main`; confirm the demo runs; record unresolved limits.

```markdown
## 2026-11-2X — Merge day plan and result
- Status: held
- Attendees: (all four names)
- Open PRs and merge order: #74 → ... (who owns each conflict)
- Result: merged ..., deferred ... (why)
- main after merge: checks pass / demo runs (commit sha)
- What we learned: ...
- Led by: (Week 11 steward 張棨翔)
```
