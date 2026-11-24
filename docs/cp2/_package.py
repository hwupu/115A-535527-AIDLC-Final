"""Build the CP2 E3 zip: submission/Group01_CP2.zip with the deliverables and the repository link.

Usage: python3 docs/cp2/_package.py

Layout: Group01_CP2/README.md (this folder's README: where to start, deliverables table), the report (.md and
.pdf), repository_link.txt, and the deliverable files under repository/ with their repository paths.
Files are taken from the committed HEAD, so the zip matches GitHub. Two local files are added if present (both
git-ignored): docs/cp2/Group01_CP2_Report.pdf and docs/cp2/CONTRIBUTOR_GRAPH.png. The script warns about unfinished
parts but still builds, so the team can check a draft.
"""
import subprocess
import sys
import zipfile
from pathlib import Path

NAME = "Group01_CP2"
REPO_URL = "https://github.com/hwupu/115A-535527-AIDLC-Final"
ROOT = Path(__file__).resolve().parents[2]

# Repository paths (files or directories) that make up the deliverables.
DELIVERABLES = [
    "docs/cp2",                     # report, rationale, evaluation, prompt card, user tests, worksheets, evidence
    "DECISIONS.md",                 # decisions, steward record, merge plan and outcome
    "CLAUDE.md",                    # system prompt for the coding agent
    "AI_USAGE_GUIDELINES.md",
    "README.md",                    # run instructions
    "CONTRIBUTORS.md",
    "docs/EVALUATION_PLAN.md",
    "services/llm/prompts",         # the product's system prompt (v5) and earlier versions
    "eval/cases.json",              # prompt test suite
    "eval/run_prompt_suite.py",
    "eval/metrics.py",
]
LOCAL_EXTRAS = ["docs/cp2/Group01_CP2_Report.pdf", "docs/cp2/CONTRIBUTOR_GRAPH.png"]


def git(*args: str) -> bytes:
    return subprocess.check_output(["git", *args], cwd=ROOT)


def main() -> None:
    if git("status", "--porcelain").strip():
        print("warning: uncommitted changes are not included; the zip uses HEAD", file=sys.stderr)
    files = git("ls-tree", "-r", "--name-only", "-z", "HEAD", "--", *DELIVERABLES).decode().split("\0")
    files = [f for f in files if f]
    entries = {f: git("show", f"HEAD:{f}") for f in files}
    for extra in LOCAL_EXTRAS:
        path = ROOT / extra
        if path.is_file():
            entries[extra] = path.read_bytes()
        else:
            print(f"warning: {extra} not found (optional local file)", file=sys.stderr)
    files_in_zip = {f"repository/{name}": content for name, content in entries.items()}
    files_in_zip["README.md"] = entries["docs/cp2/README.md"]
    for report in ("docs/cp2/Group01_CP2_Report.md", "docs/cp2/Group01_CP2_Report.pdf"):
        if report in entries:
            files_in_zip[Path(report).name] = entries[report]
    files_in_zip["repository_link.txt"] = (REPO_URL + "\n").encode()

    for worksheet in ("docs/cp2/WALKING_SKELETON.md", "docs/cp2/MERGE_DAY.md"):
        if b"| Person A | |" in entries.get(worksheet, b"") or b"| 1 | | | | | |" in entries.get(worksheet, b""):
            print(f"warning: {worksheet} is still the blank template", file=sys.stderr)
    if b"Status (temp" in entries.get("docs/cp2/README.md", b""):
        print("warning: docs/cp2/README.md still has the temporary Status column", file=sys.stderr)
    if b"TODO(team)" in entries.get("docs/cp2/Group01_CP2_Report.md", b""):
        print("warning: the report still has TODO(team) items", file=sys.stderr)

    out = ROOT / "submission"
    out.mkdir(exist_ok=True)
    archive = out / f"{NAME}.zip"
    with zipfile.ZipFile(archive, "w", zipfile.ZIP_DEFLATED) as z:
        for name, content in sorted(files_in_zip.items()):
            z.writestr(f"{NAME}/{name}", content)
    with zipfile.ZipFile(archive) as z:
        assert z.testzip() is None
    revision = git("rev-parse", "--short", "HEAD").decode().strip()
    print(f"{archive.relative_to(ROOT)}: {len(files_in_zip)} files from {revision}")


if __name__ == "__main__":
    main()
