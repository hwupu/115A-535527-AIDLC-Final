"""Small-n metrics; missing predictions are failures, not silently excluded."""
import re
import unicodedata


def normalize(value):
    if isinstance(value, str):
        return re.sub(r'\s+', '', unicodedata.normalize('NFKC', value))
    if isinstance(value, list):
        return sorted(normalize(v) for v in value)
    return value


def cer(reference, prediction):
    a, b = normalize(reference), normalize(prediction)
    if not a:
        return 0.0 if not b else None
    previous = list(range(len(b) + 1))
    for i, x in enumerate(a, 1):
        current = [i]
        for j, y in enumerate(b, 1):
            current.append(min(current[-1] + 1, previous[j] + 1, previous[j - 1] + (x != y)))
        previous = current
    return previous[-1] / len(a)


def score(expected, fields):
    predicted = {p: f.get('value') for p, f in fields.items() if isinstance(f, dict) and f.get('value') not in (None, '', [])}
    keys = set(expected) | set(predicted)
    matches = sum(type(predicted.get(p)) is type(expected.get(p)) and normalize(predicted.get(p)) == normalize(expected.get(p)) for p in keys)
    omissions = [p for p, v in expected.items() if v not in (None, '', []) and p not in predicted]
    unsupported = [p for p, v in predicted.items() if expected.get(p) in (None, '', [])]
    return {'correct': matches, 'total': len(keys), 'exact_match': matches / len(keys) if keys else None,
            'omissions': omissions, 'unsupported_fields': unsupported,
            'case_pass': not omissions and not unsupported and matches == len(keys)}
