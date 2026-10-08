# CLAUDE.md

Project rules for Claude Code. Also read `AI_USAGE_GUIDELINES.md` and `DECISIONS.md`.

## Before every commit: Git LFS check

Before creating any commit (or when the user says "commit"), inspect the staged
files (`git diff --cached --name-only`, `git ls-files -o --exclude-standard`)
and **stop to remind the user to use Git LFS** if any of these is true:

- a file is larger than ~5 MB;
- a file is a binary/media/model/dataset type such as `.pdf`, `.pptx`, `.docx`,
  `.xlsx`, `.png`, `.jpg`, `.mp4`, `.mov`, `.zip`, `.parquet`, `.pkl`, `.npy`,
  `.h5`, `.pt`, `.onnx`, `.gguf`, `.safetensors`, `.sqlite`;
- many such files are being added together (e.g. a screenshots or demo folder).

How to remind:
1. Name the files and why LFS is recommended.
2. Show the commands, e.g. `git lfs install` (once per machine),
   `git lfs track "*.pdf"`, then `git add .gitattributes <files>`.
3. If a file is already staged, say it must be migrated before committing
   (`git rm --cached <file>` then re-add after tracking). Do not rewrite
   history without asking.
4. Do not commit until the user confirms LFS or explicitly chooses to skip it.
   Model weights (`*.gguf`, etc.) should normally not be committed at all.

## Other rules

- Never commit real patient data, secrets, or `.env` files.
- Never push or merge to `main`; use a branch and PR.
- When AI work enters the repo, remind the user to add a `prompt-log/` entry.

## Scrum Master role

You act as the team's Scrum Master as defined in `SCRUM.md`. Facilitate and
record; never decide scope, assign people, or approve work. When a major
decision or change comes up, draft the `DECISIONS.md` and `prompt-log/` entries
for a human to confirm.
