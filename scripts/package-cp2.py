"""Build a review candidate with an explicit incomplete-human-evidence notice."""
import hashlib
import json
import subprocess
import zipfile
from pathlib import Path

root = Path(__file__).resolve().parents[1]
out = root / 'submission'
out.mkdir(exist_ok=True)
files = subprocess.check_output(['git', 'ls-files', '--cached', '--others', '--exclude-standard', '-z'], cwd=root).decode().split('\0')
selected = {}
for name in files:
    path = root / name
    if not name or not path.is_file() or '.git' in path.parts or path.name == '.env':
        continue
    if any(p in {'.tools', '.venv', 'data', 'node_modules', '.playwright', 'submission', '__pycache__'} for p in Path(name).parts):
        continue
    selected['source/' + name.replace('\\','/')] = path
# PDF is a local generated deliverable, intentionally excluded from Git history.
for path in (root/'docs/cp2').glob('*.pdf'):
    selected['source/docs/cp2/' + path.name] = path
for path in (root/'evidence').glob('*'):
    if path.is_file() and path.suffix in {'.json', '.jsonl', '.png', '.wav', '.log'} and not path.name.endswith(('.stdout.log','.stderr.log')) and path.name != 'server-pids.json':
        selected['evidence/' + path.name] = path
manifest = {name: hashlib.sha256(path.read_bytes()).hexdigest() for name, path in sorted(selected.items())}
archive = out / 'Group1_CP2_REVIEW.zip'
with zipfile.ZipFile(archive, 'w', zipfile.ZIP_DEFLATED) as z:
    z.writestr('REVIEW_STATUS.txt', 'Group1 / 414551016 / 劉順松\nTechnical review candidate, NOT fully compliant final submission.\nExternal-user sessions, four-member substantive merged PRs, steward approvals and actual collaboration artifacts remain pending. No E3 upload.\nSee source/docs/cp2/REQUIREMENTS.md.\n')
    z.writestr('repository_link.txt', 'https://github.com/hwupu/115A-535527-AIDLC-Final\n')
    z.writestr('SHA256_MANIFEST.json', json.dumps(manifest, indent=2, ensure_ascii=False))
    for name, path in sorted(selected.items()):
        z.write(path, name)
with zipfile.ZipFile(archive) as z:
    assert z.testzip() is None
    for name, expected in manifest.items():
        assert hashlib.sha256(z.read(name)).hexdigest() == expected
    assert not any(Path(n).name == '.env' or '/.git/' in n or '/data/' in n or '/.venv/' in n for n in z.namelist())
digest = hashlib.sha256(archive.read_bytes()).hexdigest()
(out/'Group1_CP2_REVIEW.sha256').write_text(digest + '  ' + archive.name + '\n', encoding='utf-8')
print(json.dumps({'archive': str(archive), 'source_and_evidence_files': len(manifest), 'bytes': archive.stat().st_size, 'sha256': digest}, indent=2))
