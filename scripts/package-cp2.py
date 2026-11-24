"""Package reviewed source and matching report; never silently certify human evidence."""
import argparse
import hashlib
import json
import subprocess
import zipfile
from pathlib import Path

root = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument("--require-complete", action="store_true")
args = parser.parse_args()
status = json.loads((root / "docs/cp2/CLOSEOUT_STATUS.json").read_text(encoding="utf-8"))
pending = [x["id"] for x in status["required_human_evidence"] if x["complete"] is not True]
if args.require_complete and pending:
    raise SystemExit("Final packaging refused; required human evidence pending: " + ", ".join(pending))
subprocess.run(["git", "diff", "--exit-code", "HEAD", "--quiet"], cwd=root, check=True)
revision = subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=root, text=True).strip()
files = subprocess.check_output(["git", "ls-tree", "-r", "--name-only", "-z", "HEAD"], cwd=root).decode().split("\0")
selected = {}
for name in files:
    path = root / name
    parts = Path(name).parts
    if not name or not path.is_file() or path.name == ".env":
        continue
    if any(p in {".git", ".tools", ".venv", "data", "node_modules", "submission", "__pycache__"} for p in parts):
        continue
    selected["source/" + name] = path.read_bytes()
report = root / "docs/cp2/Group1_CP2_Report.md"
pdf = report.with_suffix(".pdf")
provenance = root / "evidence/report-export.json"
if not pdf.exists() or not provenance.exists():
    raise SystemExit("Render the current report first: python scripts/render-cp2-markdown.py")
proof = json.loads(provenance.read_text(encoding="utf-8"))
for key, path in [("source_sha256", report), ("pdf_sha256", pdf)]:
    if hashlib.sha256(path.read_bytes()).hexdigest() != proof[key]:
        raise SystemExit("Report/PDF changed since render; render again before packaging")
selected[report.name] = report.read_bytes()
selected[pdf.name] = pdf.read_bytes()
selected["source/docs/cp2/" + pdf.name] = pdf.read_bytes()
selected["REPORT_PROVENANCE.json"] = provenance.read_bytes()
selected["repository_link.txt"] = b"https://github.com/hwupu/115A-535527-AIDLC-Final\n"
selected["SOURCE_REVISION.txt"] = (revision + "\n").encode()
notice = "FINAL-MODE PACKAGE: team still owns E3 submission." if args.require_complete else "REVIEW CANDIDATE - NOT A COMPLETE E3 SUBMISSION."
selected["REVIEW_STATUS.txt"] = (notice + "\nPending: " + ", ".join(pending) + "\nNo E3 upload performed. See source/docs/cp2/REQUIREMENTS.md.\n").encode()
manifest = {name: hashlib.sha256(content).hexdigest() for name, content in sorted(selected.items())}
out = root / "submission"
out.mkdir(exist_ok=True)
name = "Group01_CP2" if args.require_complete else "Group01_CP2_REVIEW"
archive = out / (name + ".zip")
with zipfile.ZipFile(archive, "w", zipfile.ZIP_DEFLATED) as z:
    for entry, content in sorted(selected.items()):
        z.writestr(entry, content)
    z.writestr("SHA256_MANIFEST.json", json.dumps(manifest, indent=2, ensure_ascii=False))
with zipfile.ZipFile(archive) as z:
    assert z.testzip() is None
    assert all(hashlib.sha256(z.read(entry)).hexdigest() == digest for entry, digest in manifest.items())
digest = hashlib.sha256(archive.read_bytes()).hexdigest()
(out / (name + ".sha256")).write_text(digest + "  " + archive.name + "\n", encoding="utf-8")
print(json.dumps({"archive": str(archive), "revision": revision, "files": len(manifest), "sha256": digest, "pending": pending}, indent=2))
