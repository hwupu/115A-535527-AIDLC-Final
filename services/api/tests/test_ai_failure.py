"""Fake-model failures must preserve input and permit manual completion."""

import json

import httpx
import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.mark.parametrize(
    "failure",
    [
        "timeout",
        "http_error",
        "invalid_json",
        "array",
        "null",
        "fields_list",
        "missing_fields",
        "bad_metadata",
        "bad_rejected",
    ],
)
def test_model_failure_preserves_transcript_and_manual_workflow(monkeypatch, failure):
    good = {"fields": {"chief_complaint": {"value": "咳嗽", "source_span": "咳嗽"}}}
    payloads = {
        "array": [],
        "null": None,
        "fields_list": {"fields": []},
        "missing_fields": {},
        "bad_metadata": {**good, "metadata": []},
        "bad_rejected": {**good, "rejected": {}},
    }

    class FakeModel:
        async def __aenter__(self):
            return self

        async def __aexit__(self, *args):
            pass

        async def post(self, *args, **kwargs):
            request = httpx.Request("POST", "http://fake-model/extract")
            if failure == "timeout":
                raise httpx.ReadTimeout("synthetic timeout", request=request)
            if failure == "http_error":
                return httpx.Response(503, request=request)
            if failure == "invalid_json":
                return httpx.Response(200, content=b"broken", request=request)
            # Explicit JSON null must not become an empty response body.
            return httpx.Response(
                200, content=json.dumps(payloads[failure]).encode(), request=request
            )

    monkeypatch.setattr("app.main.httpx.AsyncClient", lambda **kwargs: FakeModel())
    client = TestClient(app)
    sid = client.post("/sessions", json={"created_by": "nurse"}).json()["session_id"]
    # An existing nurse edit must survive a failed model call unchanged.
    client.patch(f"/sessions/{sid}/fields", json={"path": "hpi.onset", "value": "昨天"})
    before = client.get(f"/sessions/{sid}").json()["fields"]
    with client.websocket_connect(f"/sessions/{sid}/ws?role=nurse") as ws:
        assert ws.receive_json()["type"] == "status"
        response = client.post(f"/sessions/{sid}/inputs", json={"text": "咳嗽", "as": "nurse"})
        assert response.status_code == 200
        assert ws.receive_json()["text"] == "咳嗽"
        assert ws.receive_json() == {"type": "status", "stt": "ok", "llm": "down"}
        error = ws.receive_json()
        assert error["type"] == "error" and error["code"] == "llm_unavailable"
        assert "逐字稿已保留" in error["message"]
    saved = client.get(f"/sessions/{sid}").json()
    assert saved["segments"][-1]["segment_id"] == response.json()["input_id"]
    assert saved["segments"][-1]["text"] == "咳嗽"
    assert saved["fields"] == before
    assert not any(e["type"] == "ai_extract" for e in client.get(f"/sessions/{sid}/audit").json())
    assert client.get(f"/sessions/{sid}/report").status_code == 409
    assert (
        client.patch(
            f"/sessions/{sid}/fields", json={"path": "chief_complaint", "value": "咳嗽"}
        ).status_code
        == 200
    )
    assert client.post(f"/sessions/{sid}/confirm", json={"triage_level": 3}).status_code == 200
    assert (
        client.get(f"/sessions/{sid}/report").json()["fields"]["chief_complaint"]["value"] == "咳嗽"
    )
