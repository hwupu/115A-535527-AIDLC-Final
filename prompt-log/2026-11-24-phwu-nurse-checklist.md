# Nurse screen: 查核表 questions ticked from the report
- Date: 2026-11-24
- Author: 吳普軒 (hwupu)
- Tool / model: Claude Code / Claude Opus 5.5
- PR: #110 (Closes #87), stacked on #109

## Prompt
After #86: "then we do #87 and #28" and "push, then work on next".

## Output summary
- `intake/nurseChecklist.ts`: the 8 checklist questions in 查核表 order (TOCC first) with their report fields, and
  `checklistRows()` giving each item 未問 / 部分 (with the fields still missing) / AI 草稿 / 護理師已確認, from field
  status only.
- `components/nurse/ChecklistPanel.vue`: collapsible panel above the report, 「已回答 n / 8」, tapping a question
  jumps to its first empty or draft field (reuses the confirm bar's jump). Status shown with text and icon.
- Tests for the order, field mapping, status rules, jump and collapse; browser check at both tablet sizes.

## Outcome
- Kept: all of the above; the author checked it by hand.
- Changed: —
- Rejected: AI-generated questions or hints (out of scope by the issue). The panel's height in landscape
  (about 370 px when open) was raised; it stays open by default for now.
