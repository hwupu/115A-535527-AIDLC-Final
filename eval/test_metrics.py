from metrics import cer, score, zh_digits


def test_cer():
    assert cer('發燒', '發燒') == 0
    assert cer('發燒', '發騷') == 0.5
    assert cer('發燒', '') == 1
    assert cer('', '字') is None


def test_zh_digits_compares_values_not_format():
    assert zh_digits('血壓一百二十二，八十，脈搏九十二') == '血壓122，80，脈搏92'
    assert zh_digits('耳溫三十八點五度') == '耳溫38.5度'
    assert zh_digits('民國八十七年五月十四日') == '民國87年5月14日'
    assert zh_digits('血氧九七') == '血氧97'
    # Not a decimal; harmless because both sides are converted the same way.
    assert zh_digits('有一點想吐') == '有1點想吐'
    assert cer(zh_digits('耳溫三十八點五度'), zh_digits('耳溫38.5度')) == 0


def test_missing_wrong_extra_and_null():
    assert score({'a': '有'}, {})['omissions'] == ['a']
    assert not score({'a': '無'}, {'a': {'value': '有'}})['case_pass']
    assert score({}, {'a': {'value': 98}})['unsupported_fields'] == ['a']
    assert score({'a': None}, {})['case_pass']
    assert score({}, {})['exact_match'] is None
    assert not score({'a': 1}, {'a': {'value': True}})['case_pass']
