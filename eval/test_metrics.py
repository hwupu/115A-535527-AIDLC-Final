from metrics import cer, score


def test_cer():
    assert cer('發燒', '發燒') == 0
    assert cer('發燒', '發騷') == 0.5
    assert cer('發燒', '') == 1
    assert cer('', '字') is None


def test_missing_wrong_extra_and_null():
    assert score({'a': '有'}, {})['omissions'] == ['a']
    assert not score({'a': '無'}, {'a': {'value': '有'}})['case_pass']
    assert score({}, {'a': {'value': 98}})['unsupported_fields'] == ['a']
    assert score({'a': None}, {})['case_pass']
    assert score({}, {})['exact_match'] is None
    assert not score({'a': 1}, {'a': {'value': True}})['case_pass']
