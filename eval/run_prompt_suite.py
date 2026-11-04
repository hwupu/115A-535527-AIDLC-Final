"""Run actual model, preserve raw failures and compare v1/v2; not a user study."""
import argparse
import hashlib
import json
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'services' / 'llm'))
from app.main import ExtractRequest, extract  # noqa: E402
from metrics import score  # noqa: E402

parser = argparse.ArgumentParser()
parser.add_argument('--version', choices=['v1', 'v2', 'v3'], default='v3')
parser.add_argument('--ids', nargs='*')
args = parser.parse_args()
output = ROOT / 'evidence' / f'prompt-{args.version}.jsonl'
output.parent.mkdir(exist_ok=True)
cases = json.loads((ROOT / 'eval' / 'cases.json').read_text(encoding='utf-8'))
with output.open('w', encoding='utf-8') as file:
    for case in cases:
        if args.ids and case['id'] not in args.ids:
            continue
        started = time.perf_counter()
        try:
            result = extract(ExtractRequest(transcript=case['transcript'], prompt_version=args.version))
            metrics = score(case['expected'], result['fields'])
            record = {**case, 'result': result, 'metrics': metrics}
        except Exception as exc:
            record = {**case, 'error': str(exc), 'metrics': {'case_pass': False}}
        record['elapsed_seconds'] = round(time.perf_counter() - started, 3)
        record['prompt_sha256'] = hashlib.sha256((ROOT / 'services' / 'llm' / 'prompts' / f'{args.version}.txt').read_bytes()).hexdigest()
        file.write(json.dumps(record, ensure_ascii=False) + '\n')
        file.flush()
        print(case['id'], json.dumps(record['metrics'], ensure_ascii=False), flush=True)
