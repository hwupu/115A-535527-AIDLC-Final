import httpx
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_generate_asks_ollama_for_deterministic_json(monkeypatch):
    sent = {}

    def fake_post(url, json, timeout):
        sent.update(url=url, body=json)
        return httpx.Response(
            200,
            json={"message": {"role": "assistant", "content": '{"fields":{}}'}},
            request=httpx.Request("POST", url),
        )

    monkeypatch.setattr("app.main.httpx.post", fake_post)
    from app.main import generate

    assert generate("咳嗽", "v3") == '{"fields":{}}'
    assert sent["url"].endswith("/api/chat")
    assert sent["body"]["format"] == "json" and sent["body"]["stream"] is False
    assert sent["body"]["options"]["temperature"] == 0
    assert "咳嗽" in sent["body"]["messages"][1]["content"]


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
    res = client.post("/extract", json={"transcript": "咳嗽，沒有旅遊史"}).json()
    assert res["fields"]["chief_complaint"]["source_span"] == "咳嗽"
    assert res["fields"]["tocc.travel"]["value"] == "無"
    assert "triage_level" not in res["fields"]
    assert "hpi.onset" not in res["fields"]
