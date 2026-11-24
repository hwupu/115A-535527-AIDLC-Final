"""Verify ZIP integrity and optionally test a fresh source extraction with reused dependencies."""
import argparse
import hashlib
import json
import os
import shutil
import subprocess
import sys
import tempfile
import zipfile
from pathlib import Path

root = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument("archive", nargs="?", default=str(root / "submission/Group01_CP2_REVIEW.zip"))
parser.add_argument("--python-env-root", type=Path, default=root)
parser.add_argument("--integrity-only", action="store_true")
args = parser.parse_args()
archive = Path(args.archive).resolve()
base = root / "submission"
base.mkdir(exist_ok=True)
destination = Path(tempfile.mkdtemp(prefix="clean-check-", dir=base))
with zipfile.ZipFile(archive) as z:
    assert z.testzip() is None
    for item in z.infolist():
        target = (destination / item.filename).resolve()
        if not target.is_relative_to(destination.resolve()):
            raise ValueError("Unsafe archive path")
        if Path(item.filename).name == ".env" or any(p in {".git", ".venv", "node_modules", "data"} for p in Path(item.filename).parts):
            raise ValueError("Excluded content in ZIP")
    manifest = json.loads(z.read("SHA256_MANIFEST.json"))
    assert set(z.namelist()) == set(manifest) | {"SHA256_MANIFEST.json"}
    assert all(hashlib.sha256(z.read(name)).hexdigest() == digest for name, digest in manifest.items())
    assert z.read("Group1_CP2_Report.md") == z.read("source/docs/cp2/Group1_CP2_Report.md")
    z.extractall(destination)
source = destination / "source"
results = []
evidence = root / "evidence"
evidence.mkdir(exist_ok=True)
def run(name, command, cwd):
    result = subprocess.run(command, cwd=cwd, capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=240)
    (evidence / ("clean-" + name + ".log")).write_text(result.stdout + "\n" + result.stderr, encoding="utf-8")
    results.append({"name": name, "exit": result.returncode})
    print(name, result.returncode, flush=True)
    if result.returncode:
        raise SystemExit("Fresh extraction failed: " + name)
if not args.integrity_only:
    def python(service):
        sub = "Scripts/python.exe" if os.name == "nt" else "bin/python"
        return str(args.python_env_root / "services" / service / ".venv" / sub)
    for service in ("api", "stt", "llm"):
        run(service, [python(service), "-m", "pytest", "-q"], source / "services" / service)
    run("metrics", [python("api"), "-m", "pytest", "eval", "-q"], source)
    pnpm = shutil.which("pnpm") or "pnpm"
    run("install", [pnpm, "install", "--offline", "--frozen-lockfile"], source)
    for command in ("lint", "typecheck", "test", "build"):
        run("web-" + command, [pnpm, command], source)
record = {"archive_sha256": hashlib.sha256(archive.read_bytes()).hexdigest(), "manifest_verified": True, "results": results, "extraction": str(destination), "note": "Fresh source; reused Python environments and offline pnpm cache. Not a clean-machine human run or real-model test."}
(evidence / "clean-extraction.json").write_text(json.dumps(record, indent=2), encoding="utf-8")
print(json.dumps(record, indent=2))
