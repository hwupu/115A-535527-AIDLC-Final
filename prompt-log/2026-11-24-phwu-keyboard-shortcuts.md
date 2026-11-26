# Keyboard shortcuts for the nurse, patient and doctor screens
- Date: 2026-11-24
- Author: 吳普軒 (hwupu)
- Tool / model: Claude Code / Claude Opus 5.5
- PR: #111 (Closes #28), stacked on #110

## Prompt
"Start 28 from 87. Space should start/stop recording (make sure not to conflict with input fields), up down arrow
move between fields seems fine." Follow-ups: add a call to action at the bottom right that shows the keys; then
"it makes more sense right beside 切換角色, not call to action"; then remove 「（鍵盤：↑ ↓ 選病患，Enter 打開）」 from
the doctor list description to keep it short.

## Output summary
- `composables/useShortcuts.ts`: window key handler that never fires while typing (input, textarea, select,
  contenteditable), while the IME is composing, or with Ctrl/Cmd/Alt; ignores a held Space; Enter on a focused
  button keeps its normal meaning, Space does not (so it cannot press the last tapped button again).
- Nurse: Space record/stop (after consent; cancels a pending permission prompt), ↑ ↓ fields, Enter confirm draft,
  E edit (focus goes into the editor, Esc cancels), N next draft, Esc, ?. No key sets the 檢傷級數.
  Patient: Space record/stop. Doctor list: ↑ ↓ and Enter.
- `components/common/ShortcutHelp.vue` in the role header next to 切換角色 (new `#actions` slot in `RoleHeader.vue`).
- Tests for the handler and the nurse keys (including 1–5 not setting the level); browser checks with a fake
  microphone at both tablet sizes.

## Outcome
- Kept: the keys above (Group 03's list in the #28 comment).
- Changed: help button moved from the top of the nurse screen, to a floating button at the bottom right, to the header
  beside 切換角色; keyboard hint removed from the doctor list description.
- Rejected: a single key for the 檢傷級數 (risk of a stray key setting it).
