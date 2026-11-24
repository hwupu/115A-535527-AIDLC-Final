# Group1 joint-session runbook (preparation, not completed minutes)

Planned date: Thursday 2026-11-26. Start time and duration: UNCONFIRMED. Latest user plan: 11/26 劉順松預計在本機操作並陪同參與線上組會，由組員協助主持與現場整合. The team confirms the facilitating/typing delegate; actual attendance and contributions are recorded afterward. Participants: all four members must confirm attendance. Steward per current rotation: 劉順松. Suggested time: 75 minutes walking skeleton, 10-minute break, 60 minutes merge day, with 15 minutes steward preparation beforehand. Can be two separate calls in that order.

## Before the call - steward preparation

Share the current reviewed revision, README quick start and teacher worksheets. Check every member can clone and start; install/pull Ollama ahead of time. Do not show real patient data. Keep docs/walking_skeleton.md and docs/merge_day.md blank until the activity. Choose a typist for Part 1 and rotate at every Part; the facilitator does not write others' answers.

## Walking skeleton (75 min)

1. Ten minutes: each writes one sentence independently, then reads it; keep all four original sentences and the agreed version.
2. Ten minutes: trace input -> API/STT -> extraction -> nurse review/confirmation -> doctor read-only report. Each box is explained by someone other than its author. First check fake/hard-coded behavior, then second-user flow; only then choose one AI failure state. Select the slice together and record per-person task, interface and branch. The facilitator does not pre-assign ownership. #80 already merged is not today's new joint slice.
3. Thirty minutes: each builds their agreed piece on their own branch; preserve genuine author commits. Integrate into skeleton in path order. A non-author explains each part. Run the example after each piece and write actual fixes or remaining stubs.
4. Fifteen minutes: open skeleton -> main PR; author explains it. Actual steward reviews on shared screen with a substantive comment, author responds, then another authorized reviewer approves where the steward is also an author. Do not self-approve. Record exact review/merge URLs.
5. Five minutes: honest reflection, least opportunity to contribute, blockers and next-session change. Add the largest actual decision to DECISIONS.md and link the merged artifact to #49/#77.

## Merge day (60 min, after walking skeleton)

Read the prewritten plan in DECISIONS.md and update it for new PRs. No new feature work. Rotate driver so at least three participate. Merge/close each PR with a reason, run tests and the main task after each. If no PR is open, record that fact and focus on fresh-clone/README/main-task validation; do not invent merges. A non-steward independently clones a new folder and follows only README. Record real OS, missing prerequisites, nurse confirmation/doctor handoff result, human tester and evidence. Fill teacher worksheet and plan outcome. Leave incomplete items explicit.

## Finish together

Confirm or reject proposed AI rules and evaluation-plan revision. Check U01/U02 evidence. Team confirms report, group filename, candidate versus final status and E3 uploader. The current assignee of #49 remains unchanged; this guide does not reassign it. No attendance, consensus or course credit is inferred from this prepared file.
