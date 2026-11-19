# Compact layout for nurse, physician and admin screens
- Date: 2026-11-05
- Author: 吳普軒
- Tool / model: Claude Code / Opus 5.5
- PR: #74

## Prompt
Make the layout more compact, except for the entry screen and the patient screen. The nurse, physician and admin
screens have too much padding and too many borders and lines; they are hard to read and show little information.
(Asked how far to go against the 18/20 px rule, I chose an 18 px base for staff screens.)

## Output summary
Staff routes get `meta.compact`; `App.vue` sets `data-density` on `<html>` and `style.css` uses 18 px at every width there,
plus a `compact:` Tailwind variant so shared components (Card, Button `lg`, RoleHeader) tighten only on staff screens.
Report fields became one row each (label and value left, status and buttons right; empty fields one line), 1 px borders,
faint separators instead of a box per item, the nurse's 就診號 and 返回清單 moved into the role header, the transcript column
stays in view while the report scrolls, and the physician report shows sections side by side. Also fixed: the recorder now
stops when the nurse session is left by any route. Follow-up prompt: remove the 「示範用途・僅使用模擬資料」 banner to save
space; I chose to remove it on every screen. Then: make the entry and patient screens fill one screen with no scrollbar in
most cases (role buttons share the screen height; the patient's text box has a fixed height and the sent entries scroll
inside their own box). DECISIONS.md entry and `docs/frontend/ARCHITECTURE.md` updated.

Checked: lint, typecheck and 34 tests pass. Screenshots at 1180×820 (mock api): nurse report page from about 7,000 px to
about 2,500 px tall; on every staff screen the smallest button is 54 px and the smallest text 18 px; entry and patient
screenshots were byte-identical to before (until the banner was removed).

## Outcome
- Kept: the compact staff layout, the recorder fix, the banner removal and the full-screen entry and patient screens.
- Changed: I chose the text size (18 px base for staff screens) and asked to remove the demo banner on every screen.
- Rejected (and why): a 16 px base (too small; 18 px keeps more of the readable-by-default rule); keeping the demo notice
  as a small tag in the header (I preferred the space; the data stays simulated with `SIM-` visit numbers).
