# Printed triage record in an ED record layout
- Date: 2026-11-23
- Author: 張棨翔
- Tool / model: Claude Code / Opus 5.5
- PR: #99

## Prompt
Make the printout of a confirmed report follow the layout of a real ED record that I provided as a PDF, but
de-identified: no hospital name or other identifiers, only the key parts (主訴, 現在病史, 檢傷級數, 生命徵象). The PDF
must never be stored on GitHub. Vital signs labelled in Chinese (血壓, 脈搏, 血氧, 體溫).

## Output summary
- The sample PDF stayed outside version control (local `.git/info/exclude`, never committed). Its text was read with
  digits masked and kept outside the repo; only the section structure was used. No name, number, date, hospital or
  staff detail from it appears in the code, tests or this entry.
- `apps/web/src/report/print.ts`: builds the record (patient line with only the simulated 就診號, 主訴, 現在病史 with a
  TOCC block, 過去病史, 生命徵象 on one line, 檢傷級數 as entered by the nurse, suggestions). Diagnoses and the
  physical exam are left out.
- `PrintRecord.vue` (print only), `ExportPanel.vue` no longer prints its panel, A4 print rules in `style.css`, tests
  in `print.test.ts`, and `NurseSession.test.ts` updated for the new printed text.

Checked in a Node 24 container: lint and typecheck clean, 76 tests passed, build succeeds. Searched the changed files
for identifiers from the sample; none found.

## Outcome
- Kept: (to fill)
- Changed: (to fill)
- Rejected (and why): (to fill)
