# PR template: AI assistance and verification sections
- Date: 2026-11-23
- Author: 吳普軒
- Tool / model: Claude Code / Opus 5.5
- PR: #96

## Prompt
1. Update `.github/PULL_REQUEST_TEMPLATE.md` to the template text 吳普軒 supplied (sections: What and why,
   AI assistance, How I checked it, Risks and alternatives).
2. After review on #96: "Draft the `prompt-log/` entry for #96" (this entry).

## Output summary
- Replaced the template's "What this PR does" and "Decision" sections with the supplied "What and why",
  "AI assistance", "How I checked it" and "Risks and alternatives" sections.
- Kept the old "Before merge" checklist (other-member review, `DECISIONS.md`, `prompt-log/`, no patient data or
  secrets, Git LFS, sensitive-area lead review) because the supplied template had no equivalent.
- Wrote the #96 description using the new template.

## Outcome
- Kept: the supplied section text verbatim; the old "Before merge" checklist.
- Changed: folded the old "Decision" block (Decision / Why / Alternative rejected / Led by) into "What and why"
  (link the `DECISIONS.md` entry) and "Risks and alternatives". Significant decisions now live only in
  `DECISIONS.md`, which still records chosen, rejected and the human lead.
- Rejected (and why): nothing.
- Missed at first: this entry. 414551016's review of #96 (2026-11-23) pointed out that AI-generated text entered
  the repo without a `prompt-log/` entry (`AI_USAGE_GUIDELINES.md` §2); added in the same PR.
- Follow-up: #98 still asks PRs to fill "Decision / Led by"; aligned there.
