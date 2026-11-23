"""A1 (#6): CER and latency per Whisper model on local recordings; not a user study.

Recordings stay local (default evidence/stt-audio/, gitignored) and are named
<speaker>_<sentence id>_<condition>.<ext>, e.g. N01_P05_mask.m4a.
Sentences: eval/stt_sentences.json.
Run from services/stt:  uv run python ../../eval/stt_benchmark.py --models tiny base small medium
"""
import argparse
import json
import re
import statistics
import sys
import time
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'eval'))
from metrics import cer, zh_digits  # noqa: E402

parser = argparse.ArgumentParser()
parser.add_argument('--audio-dir', type=Path, default=ROOT / 'evidence' / 'stt-audio')
parser.add_argument('--models', nargs='+', default=['tiny', 'base', 'small'])
parser.add_argument('--device', default='cpu')
parser.add_argument('--compute-type', default='int8')
parser.add_argument('--out', type=Path, default=ROOT / 'evidence' / 'stt-benchmark.jsonl')
args = parser.parse_args()


def strip_punctuation(text):
    # Whisper's punctuation is not what the nurse needs; score characters only.
    return ''.join(c for c in text if not unicodedata.category(c).startswith(('P', 'S')))


sentence_file = ROOT / 'eval' / 'stt_sentences.json'
sentences = {s['id']: s for s in json.loads(sentence_file.read_text(encoding='utf-8'))}
clips = []
for path in sorted(args.audio_dir.glob('*.*')):
    match = re.fullmatch(r'([^_]+)_(P\d+)_([^_.]+)', path.stem)
    if not match or match[2] not in sentences:
        print('skip (name or sentence id not recognised):', path.name)
        continue
    clips.append({'file': path.name, 'path': path, 'speaker': match[1], 'id': match[2],
                  'condition': match[3]})
if not clips:
    sys.exit(f'No recordings in {args.audio_dir}. See eval/STT_RECORDING.md.')

from faster_whisper import WhisperModel  # noqa: E402
from opencc import OpenCC  # noqa: E402

converter = OpenCC('s2twp')
args.out.parent.mkdir(exist_ok=True)
rows = []
with args.out.open('w', encoding='utf-8') as file:
    for name in args.models:
        started = time.perf_counter()
        model = WhisperModel(name, device=args.device, compute_type=args.compute_type,
                             cpu_threads=4, download_root=str(ROOT / 'evidence' / 'whisper-models'))
        load_seconds = round(time.perf_counter() - started, 2)
        for clip in clips:
            reference = sentences[clip['id']]['text']
            started = time.perf_counter()
            # Same settings as services/stt/app/main.py.
            segments, info = model.transcribe(str(clip['path']), language='zh', beam_size=5,
                                              vad_filter=True)
            text = converter.convert(''.join(s.text for s in segments))
            seconds = time.perf_counter() - started
            row = {'model': name, 'device': args.device, 'compute_type': args.compute_type,
                   'speaker': clip['speaker'], 'id': clip['id'], 'condition': clip['condition'],
                   'tags': sentences[clip['id']]['tags'], 'reference': reference,
                   'hypothesis': text,
                   'cer': round(cer(strip_punctuation(reference), strip_punctuation(text)), 4),
                   # Whisper writes 122 for 一百二十二; this one scores the values, not the format.
                   'cer_digits': round(cer(zh_digits(strip_punctuation(reference)),
                                           zh_digits(strip_punctuation(text))), 4),
                   'seconds': round(seconds, 3), 'audio_seconds': round(info.duration, 2),
                   'model_load_seconds': load_seconds}
            rows.append(row)
            file.write(json.dumps(row, ensure_ascii=False) + '\n')
            file.flush()
            print(name, clip['file'], f"CER={row['cer']:.2f}", f"{row['seconds']:.2f}s", text,
                  flush=True)


def summary(group_key, label):
    print(f'\nModel x {label}: mean CER / CER with numbers as digits / median seconds / '
          'real-time factor (n)')
    for name in args.models:
        cells = []
        for value in sorted({k for r in rows for k in group_key(r)}):
            part = [r for r in rows if r['model'] == name and value in group_key(r)]
            if part:
                rtfs = [r['seconds'] / r['audio_seconds'] for r in part if r['audio_seconds']]
                rtf = statistics.median(rtfs) if rtfs else 0
                mean_cer = statistics.mean(r['cer'] for r in part)
                mean_digits = statistics.mean(r['cer_digits'] for r in part)
                median_s = statistics.median(r['seconds'] for r in part)
                cells.append(f'{value}: {mean_cer:.3f} / {mean_digits:.3f} / {median_s:.2f}s / '
                             f'RTF {rtf:.2f} ({len(part)})')
        print(f'  {name:8}', ' | '.join(cells))


summary(lambda r: [r['condition']], 'condition')
summary(lambda r: r['tags'], 'tag')
print(f'\nRaw results: {args.out}')
