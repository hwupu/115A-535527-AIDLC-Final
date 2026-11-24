import json

import httpx
import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def fake_ollama(monkeypatch, capabilities):
    """Fake /api/show (given capabilities) and /api/chat (empty draft); return the chat body."""
    from app import main

    main.thinks.cache_clear()
    sent = {}

    def fake_post(url, json, timeout):
        request = httpx.Request("POST", url)
        if url.endswith("/api/show"):
            return httpx.Response(200, json={"capabilities": capabilities}, request=request)
        sent.update(url=url, body=json)
        reply = {"message": {"role": "assistant", "content": '{"fields":{}}'}}
        return httpx.Response(200, json=reply, request=request)

    monkeypatch.setattr("app.main.httpx.post", fake_post)
    return sent


def test_generate_asks_ollama_for_deterministic_json(monkeypatch):
    from app.main import generate

    sent = fake_ollama(monkeypatch, ["completion"])
    assert generate("咳嗽", "v3") == '{"fields":{}}'
    assert sent["url"].endswith("/api/chat")
    assert sent["body"]["format"] == "json" and sent["body"]["stream"] is False
    assert sent["body"]["options"]["temperature"] == 0
    assert "咳嗽" in sent["body"]["messages"][1]["content"]
    assert "think" not in sent["body"]


def test_thinking_models_are_asked_not_to_think(monkeypatch):
    from app.main import generate

    sent = fake_ollama(monkeypatch, ["completion", "thinking"])
    generate("咳嗽", "v3")
    assert sent["body"]["think"] is False


def test_ready_after_warm_up_even_if_it_failed(monkeypatch):
    from app import main

    def refuse(url, **kwargs):
        raise httpx.ConnectError("connection refused", request=httpx.Request("POST", url))

    monkeypatch.setattr("app.main.httpx.post", refuse)
    main.WARMED.clear()
    assert client.get("/ready").status_code == 503
    main.warm_up()
    assert client.get("/ready").json()["status"] == "ready"


def test_ollama_unreachable_is_a_503(monkeypatch):
    def refuse(url, **kwargs):
        raise httpx.ConnectError("connection refused", request=httpx.Request("POST", url))

    monkeypatch.setattr("app.main.httpx.post", refuse)
    res = client.post("/extract", json={"transcript": "咳嗽"})
    assert res.status_code == 503
    assert "manual entry remains available" in res.json()["detail"]


def test_health():
    assert client.get("/health").json() == {"status": "ok", "service": "llm"}


def test_extract_contract_has_no_triage_level(monkeypatch):
    monkeypatch.setattr(
        "app.main.generate",
        lambda *args: (
            '{"fields":{"chief_complaint":{"value":"咳嗽","source_span":"咳嗽"},"triage_level":{"value":3,"source_span":"咳嗽"}}}'
        ),
    )
    res = client.post("/extract", json={"transcript": "咳嗽", "prompt_version": "v2"})
    fields = res.json()["fields"]
    assert "triage_level" not in fields
    assert {"value", "source_span"} <= fields["chief_complaint"].keys()


def test_missing_source_and_boundary_rejected(monkeypatch):
    from app.main import guard

    fields, rejected = guard(
        {
            "fields": {
                "chief_complaint": {"value": "檢傷三級", "source_span": "檢傷三級"},
                "hpi.onset": {"value": "昨天", "source_span": "不存在"},
            }
        },
        "檢傷三級",
    )
    assert fields == {}
    assert len(rejected) == 2


def test_empty_and_invalid_output(monkeypatch):
    assert client.post("/extract", json={"transcript": ""}).json()["fields"] == {}
    monkeypatch.setattr("app.main.generate", lambda *args: "not json")
    assert client.post("/extract", json={"transcript": "x"}).status_code == 503


def test_v3_quotes_are_grounded_before_normalization(monkeypatch):
    monkeypatch.setattr(
        "app.main.generate",
        lambda *args: (
            '{"fields":{"chief_complaint":"咳嗽","tocc.travel":"沒有旅遊史","triage_level":"三級","hpi.onset":"捏造"}}'
        ),
    )
    body = {"transcript": "咳嗽，沒有旅遊史", "prompt_version": "v3"}
    res = client.post("/extract", json=body).json()
    assert res["fields"]["chief_complaint"]["source_span"] == "咳嗽"
    assert res["fields"]["tocc.travel"]["value"] == "無"
    assert "triage_level" not in res["fields"]
    assert "hpi.onset" not in res["fields"]


def test_v5_returns_all_grounded_fields_with_values(monkeypatch):
    raw = {
        "fields": {
            "tocc.travel": {"value": "無", "source_span": "我沒有去國外"},
            "measurement.vitals.bp_sys": {"value": "143", "source_span": "143"},
            "measurement.vitals.hr": {"value": 110, "source_span": "脈搏110"},
            "patient.dob": {"value": "2000-09-19", "source_span": "八十九年九月十九日"},
            "patient.accompanied_by": {"value": "無", "source_span": "捏造的陪同"},
            "triage_level": {"value": 3, "source_span": "143"},
        }
    }
    monkeypatch.setattr("app.main.generate", lambda *args: json.dumps(raw, ensure_ascii=False))
    transcript = "我沒有去國外，血壓143，57，脈搏110，八十九年九月十九日出生"
    res = client.post("/extract", json={"transcript": transcript, "prompt_version": "v5"}).json()
    fields = res["fields"]
    # No "旅遊" needed in v5: the value comes from the model, the quote must be in the transcript.
    assert fields["tocc.travel"]["value"] == "無"
    assert fields["measurement.vitals.bp_sys"]["value"] == 143
    assert fields["measurement.vitals.hr"]["value"] == 110
    assert fields["patient.dob"]["value"] == "2000-09-19"
    assert "patient.accompanied_by" not in fields
    assert "triage_level" not in fields
    assert {r["path"]: r["reason"] for r in res["rejected"]} == {
        "patient.accompanied_by": "source_not_found",
        "triage_level": "unknown_or_forbidden_field",
    }


def test_v5_numbers_and_dates_come_from_the_quote(monkeypatch):
    raw = {
        "fields": {
            # The model miscounted 民國87 as 1997; the quote decides.
            "patient.dob": {"value": "1997-05-14", "source_span": "民國八十七年五月十四日"},
            "measurement.vitals.bp_sys": {"value": 999, "source_span": "血壓一百二十二，八十"},
            "measurement.vitals.bp_dia": {"value": 122, "source_span": "血壓一百二十二，八十"},
            "measurement.vitals.temp_c": {"value": 38.4, "source_span": "耳溫三十八點五"},
            "measurement.vitals.hr": {"value": 92, "source_span": "脈搏"},
        }
    }
    monkeypatch.setattr("app.main.generate", lambda *args: json.dumps(raw, ensure_ascii=False))
    transcript = "民國八十七年五月十四日出生。血壓一百二十二，八十。耳溫三十八點五。脈搏"
    res = client.post("/extract", json={"transcript": transcript, "prompt_version": "v5"}).json()
    values = {p: f["value"] for p, f in res["fields"].items()}
    # hr has no number in its quote, so it is dropped rather than trusted.
    assert values == {
        "patient.dob": "1998-05-14",
        "measurement.vitals.bp_sys": 122,
        "measurement.vitals.bp_dia": 80,
        "measurement.vitals.temp_c": 38.5,
    }


def test_v5_asks_ollama_for_the_field_schema(monkeypatch):
    from app.main import V5_SCHEMA, generate

    sent = fake_ollama(monkeypatch, ["completion"])
    generate("咳嗽", "v5")
    assert sent["body"]["format"] == V5_SCHEMA
    assert "triage_level" not in V5_SCHEMA["properties"]["fields"]["properties"]
    assert V5_SCHEMA["properties"]["fields"]["additionalProperties"] is False


def test_v5_drops_a_temperature_taken_at_home(monkeypatch):
    # The model quoted only 體溫39度; the sentence around it says the reading was taken at home.
    temp = {"value": 39, "source_span": "體溫39度"}
    raw = {"fields": {"measurement.vitals.temp_c": temp}}
    monkeypatch.setattr("app.main.generate", lambda *args: json.dumps(raw, ensure_ascii=False))
    body = {"transcript": "我在家量到體溫39度。護理師：耳溫三十八點五。", "prompt_version": "v5"}
    res = client.post("/extract", json=body)
    assert res.json()["fields"] == {}


@pytest.mark.parametrize(
    "path,expected",
    [
        ("measurement.vitals.bp_sys", 138),
        ("measurement.vitals.bp_dia", 76),
        ("measurement.vitals.hr", 102),
        ("measurement.vitals.spo2", 96),
        ("measurement.vitals.temp_c", 38.5),
    ],
)
def test_v5_multi_vital_quote_matches_label(monkeypatch, path, expected):
    span = "血壓138,76,脈搏102,血氧96,耳溫38.5"
    raw = {"fields": {path: {"value": 999, "source_span": span}}}
    monkeypatch.setattr("app.main.generate", lambda *args: json.dumps(raw))
    result = client.post("/extract", json={"transcript": span, "prompt_version": "v5"}).json()
    assert result["fields"][path]["value"] == expected


@pytest.mark.parametrize(
    "path,span",
    [
        ("measurement.vitals.bp_sys", "血壓138,76"),
        ("measurement.vitals.bp_dia", "血壓138,76"),
        ("measurement.vitals.hr", "脈搏102"),
        ("measurement.vitals.spo2", "血氧96"),
        ("measurement.vitals.temp_c", "體溫39度"),
    ],
)
def test_v5_all_home_vitals_dropped_but_current_reading_kept(monkeypatch, path, span):
    transcript = "我在家自己量" + span + "。護理師：耳溫38.5。"
    raw = {
        "fields": {
            path: {"value": 999, "source_span": span},
            "measurement.vitals.temp_c": {"value": 38.5, "source_span": "耳溫38.5"},
        }
    }
    if path == "measurement.vitals.temp_c":
        raw["fields"][path] = {"value": 39, "source_span": span}
    monkeypatch.setattr("app.main.generate", lambda *args: json.dumps(raw))
    result = client.post("/extract", json={"transcript": transcript, "prompt_version": "v5"}).json()
    assert path not in result["fields"]
    if path != "measurement.vitals.temp_c":
        assert result["fields"]["measurement.vitals.temp_c"]["value"] == 38.5


@pytest.mark.parametrize(
    "span,expected",
    [
        ("民國八十年二月三十一日", None),
        ("民國八十年二月二十九日", None),
        ("民國八十一年二月二十九日", "1992-02-29"),
    ],
)
def test_v5_calendar_date_validation(span, expected):
    from app.main import date_in

    assert date_in(span) == expected


@pytest.mark.parametrize("span", ["138,76,102", "脈搏102，脈搏88", "血壓138"])
def test_v5_ambiguous_or_wrong_label_is_not_a_pulse(span):
    from app.main import vital_number

    assert vital_number("measurement.vitals.hr", span) is None
