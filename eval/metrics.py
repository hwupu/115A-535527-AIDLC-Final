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


ZH_DIGITS = {'零': 0, '〇': 0, '一': 1, '二': 2, '兩': 2, '三': 3, '四': 4,
             '五': 5, '六': 6, '七': 7, '八': 8, '九': 9}
ZH_UNITS = {'十': 10, '百': 100, '千': 1000}


def zh_digits(text):
    """Chinese numerals to Arabic digits (一百二十二→122, 三十八點五→38.5).

    Used on both sides so STT CER compares the values, not how the numbers are written.
    """
    def integer(chars):
        if not any(c in ZH_UNITS for c in chars):  # read digit by digit, e.g. 九七 → 97
            return ''.join(str(ZH_DIGITS[c]) for c in chars)
        total = current = 0
        for c in chars:
            if c in ZH_DIGITS:
                current = ZH_DIGITS[c]
            else:
                total, current = total + (current or 1) * ZH_UNITS[c], 0
        return str(total + current)

    def convert(match):
        fraction = ''.join(str(ZH_DIGITS[c]) for c in match[2] or '')
        return integer(match[1]) + ('.' + fraction if fraction else '')

    return re.sub(r'([零〇一二兩三四五六七八九十百千]+)(?:點([零〇一二三四五六七八九]+))?', convert, text)


def score(expected, fields):
    predicted = {p: f.get('value') for p, f in fields.items() if isinstance(f, dict) and f.get('value') not in (None, '', [])}
    keys = set(expected) | set(predicted)
    matches = sum(type(predicted.get(p)) is type(expected.get(p)) and normalize(predicted.get(p)) == normalize(expected.get(p)) for p in keys)
    omissions = [p for p, v in expected.items() if v not in (None, '', []) and p not in predicted]
    unsupported = [p for p, v in predicted.items() if expected.get(p) in (None, '', [])]
    return {'correct': matches, 'total': len(keys), 'exact_match': matches / len(keys) if keys else None,
            'omissions': omissions, 'unsupported_fields': unsupported,
            'case_pass': not omissions and not unsupported and matches == len(keys)}
