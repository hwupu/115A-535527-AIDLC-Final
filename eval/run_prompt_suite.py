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
parser.add_argument('--version', choices=['v1', 'v2', 'v3', 'v4', 'v5'], default='v3')
parser.add_argument('--ids', nargs='*')
args = parser.parse_args()

# v3/v4 may only fill these six fields; score them on that scope so v5's extra expectations do not count.
SIX_FIELDS = {'chief_complaint', 'hpi.onset', 'tocc.travel', 'measurement.vitals.temp_c',
              'measurement.restrictions', 'patient.mobility'}
# v5: free text and lists vary in wording, so they count when filled (and grounded by the guard);
# yes/no, numbers and the date must match exactly. *_details are free notes and not scored.
LOOSE = {'chief_complaint', 'tocc.occupation', 'measurement.restrictions', 'measurement.vitals.bp_site',
         'hpi.onset', 'hpi.location', 'hpi.quality', 'hpi.severity', 'hpi.course',
         'hpi.aggravating_relieving', 'hpi.associated_symptoms', 'hpi.relevant_history',
         'patient.accompanied_by', 'patient.mobility'}


def scoped(case, fields):
    expected = case['expected']
    if args.version in ('v3', 'v4'):
        return score({p: v for p, v in expected.items() if p in SIX_FIELDS}, fields)
    if args.version == 'v5':
        keep = {p: f for p, f in fields.items() if not p.endswith('_details')}
        return score({p: v for p, v in expected.items() if not p.endswith('_details')}, keep, LOOSE)
    return score(expected, fields)
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
            metrics = scoped(case, result['fields'])
            record = {**case, 'result': result, 'metrics': metrics}
        except Exception as exc:
            record = {**case, 'error': str(exc), 'metrics': {'case_pass': False}}
        record['elapsed_seconds'] = round(time.perf_counter() - started, 3)
        record['prompt_sha256'] = hashlib.sha256((ROOT / 'services' / 'llm' / 'prompts' / f'{args.version}.txt').read_bytes()).hexdigest()
        file.write(json.dumps(record, ensure_ascii=False) + '\n')
        file.flush()
        print(case['id'], json.dumps(record['metrics'], ensure_ascii=False), flush=True)
