"""Clean extraction verification; dependencies reused from the local service environments."""
import hashlib
import json
import os
import shutil
import subprocess
import time
import zipfile
from pathlib import Path

root = Path(__file__).resolve().parents[1]
archive = root / 'submission' / 'Group01_CP2.zip'


def venv_python(service):
    sub = ('Scripts', 'python.exe') if os.name == 'nt' else ('bin', 'python')
    return str(root / 'services' / service / '.venv' / sub[0] / sub[1])

destination = root / 'submission' / ('clean-check-' + time.strftime('%Y%m%d-%H%M%S'))
destination.mkdir()
with zipfile.ZipFile(archive) as z:
    for item in z.infolist():
        target = (destination/item.filename).resolve()
        if not target.is_relative_to(destination.resolve()):
            raise ValueError('Unsafe archive path')
    z.extractall(destination)
    manifest = json.loads(z.read('SHA256_MANIFEST.json'))
    assert all(hashlib.sha256((destination/name).read_bytes()).hexdigest() == digest for name,digest in manifest.items())
source = destination / 'source'
results = []


def run(name, command, cwd, env=None):
    result = subprocess.run(command, cwd=cwd, env=env, capture_output=True, text=True, encoding='utf-8', errors='replace')
    (root/'evidence'/f'clean-{name}.log').write_text(result.stdout+'\n'+result.stderr, encoding='utf-8')
    results.append({'name':name,'exit':result.returncode})
    print(name, result.returncode, flush=True)


for service in ('api','stt','llm'):
    run(service, [venv_python(service), '-m', 'pytest', '-q'], source/'services'/service)
run('metrics', [venv_python('api'), '-m', 'pytest', 'eval', '-q'], source)
pnpm = shutil.which('pnpm') or 'pnpm'
run('install', [pnpm,'install','--offline','--frozen-lockfile'], source)
run('web-build', [pnpm,'build'], source)
run('web-test', [pnpm,'test'], source)
(root/'evidence/clean-extraction.json').write_text(json.dumps({'archive_sha256':hashlib.sha256(archive.read_bytes()).hexdigest(), 'source_manifest_verified':True, 'note':'Fresh source extraction; reused per-service Python dependency environments and offline pnpm cache. No model downloads/inference rerun here.', 'results':results}, indent=2), encoding='utf-8')
if any(result['exit'] for result in results):
    raise SystemExit(1)
