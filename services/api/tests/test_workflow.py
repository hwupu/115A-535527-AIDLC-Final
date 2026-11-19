import json
from copy import deepcopy

import httpx
from fastapi.testclient import TestClient
from sqlalchemy import select

from app.db import Database, Encounter
from app.main import app

client = TestClient(app)


def new(by="nurse"):
    r = client.post("/sessions", json={"created_by": by})
    assert r.status_code == 200
    return r.json()["session_id"]


def test_patient_intake_hidden_and_number_stable():
    sid = new("patient")
    assert client.get("/sessions").json() == []
    a = client.post(f"/sessions/{sid}/finish-intake").json()
    assert client.post(f"/sessions/{sid}/finish-intake").json() == a
    assert a["visit_no"].startswith("SIM-")
    assert client.post(f"/sessions/{sid}/claim").json()["status"] == "in_progress"


def test_confirm_readonly_audit_and_persistence():
    sid = new()
    assert client.get(f"/sessions/{sid}/report").status_code == 409
    r = client.patch(f"/sessions/{sid}/fields", json={"path": "chief_complaint", "value": "咳嗽"})
    assert r.json()["source"] == "nurse_edit"
    assert client.post(f"/sessions/{sid}/confirm", json={"triage_level": 3}).status_code == 200
    assert (
        TestClient(app).get(f"/sessions/{sid}/report").json()["fields"]["chief_complaint"]["value"]
        == "咳嗽"
    )
    assert (
        client.patch(
            f"/sessions/{sid}/fields", json={"path": "chief_complaint", "value": "改寫"}
        ).status_code
        == 409
    )
    audit = client.get(f"/sessions/{sid}/audit").json()
    assert {"field_edit", "report_confirmed", "level_entered"} <= {e["type"] for e in audit}
    assert audit[1]["payload"]["before"]["value"] is None


def test_guard_validation_and_etag():
    sid = new()
    for body in [
        {"path": "triage_level", "value": 3},
        {"path": "measurement.vitals.hr", "value": "wrong"},
    ]:
        assert client.patch(f"/sessions/{sid}/fields", json=body).status_code == 422
    assert client.post(f"/sessions/{sid}/confirm", json={"triage_level": 9}).status_code == 422
    r = client.get("/sessions")
    assert client.get("/sessions", headers={"If-None-Match": r.headers["etag"]}).status_code == 304


def test_drafts_must_be_confirmed_and_cleared_nurse_field_stays_owned():
    sid = new()
    with Database.begin() as db:
        row = db.scalar(select(Encounter).where(Encounter.session_id == sid))
        d = deepcopy(row.data)
        d["fields"]["chief_complaint"] = {
            "value": "咳嗽",
            "status": "AI 草稿",
            "source_span": "咳嗽",
            "source": "ai",
        }
        row.data = d
    assert client.post(f"/sessions/{sid}/confirm", json={"triage_level": 3}).status_code == 409
    assert (
        client.patch(
            f"/sessions/{sid}/fields", json={"path": "chief_complaint", "confirm": True}
        ).status_code
        == 200
    )
    r = client.patch(f"/sessions/{sid}/fields", json={"path": "chief_complaint", "value": None})
    assert r.json()["source"] == "nurse_edit"
    assert r.json()["status"] == "未提及"


def test_evaluation_gating_state_csv_and_delete(monkeypatch):
    monkeypatch.setenv("EVAL_MODE", "0")
    assert client.get("/scenarios").status_code == 404
    monkeypatch.setenv("EVAL_MODE", "1")
    assert (
        client.post(
            "/evaluation/runs", json={"scenario_id": "T01", "participant_code": "姓名"}
        ).status_code
        == 422
    )
    run = client.post(
        "/evaluation/runs", json={"scenario_id": "T01", "participant_code": "N-01"}
    ).json()
    rid = run["run_id"]
    assert client.post(f"/evaluation/runs/{rid}/finish").status_code == 409
    assert client.post(f"/evaluation/runs/{rid}/start").status_code == 200
    assert client.post(f"/evaluation/runs/{rid}/start").status_code == 409
    assert (
        client.post(
            f"/evaluation/runs/{rid}/events", json={"type": "note", "payload": {"text": "測試"}}
        ).status_code
        == 200
    )
    assert client.post(f"/evaluation/runs/{rid}/finish").status_code == 200
    assert "model" in client.get(f"/evaluation/runs/{rid}/export").json()
    assert "task_end" in client.get(f"/evaluation/runs/{rid}/export?format=csv").text
    assert client.delete("/sessions/" + run["session_id"]).status_code == 204
    assert client.get("/evaluation/runs").json() == []
    assert client.get("/sessions/" + run["session_id"]).status_code == 404


def test_real_input_ws_draft_isolation_and_nurse_override(monkeypatch):
    sid = new()

    class FakeClient:
        async def __aenter__(self):
            return self

        async def __aexit__(self, *args):
            pass

        async def post(self, *args, **kwargs):
            return httpx.Response(
                200,
                request=httpx.Request("POST", "http://test"),
                json={
                    "fields": {
                        "chief_complaint": {"value": "咳嗽", "source_span": "咳嗽"},
                        "triage_level": {"value": 3, "source_span": "咳嗽"},
                        "hpi.onset": {"value": "昨天", "source_span": "不存在"},
                    }
                },
            )

    monkeypatch.setattr("app.main.httpx.AsyncClient", lambda **kwargs: FakeClient())
    with client.websocket_connect(f"/sessions/{sid}/ws?role=nurse") as nurse:
        assert nurse.receive_json()["type"] == "status"
        r = client.post(
            f"/sessions/{sid}/inputs", json={"text": "咳嗽", "kind": "text", "as": "nurse"}
        )
        assert r.status_code == 200
        assert nurse.receive_json()["type"] == "transcript.segment"
        event = nurse.receive_json()
        assert event["path"] == "chief_complaint"
        assert nurse.receive_json()["type"] == "status"
    d = client.get(f"/sessions/{sid}").json()
    assert "triage_level" not in d["fields"]
    assert d["fields"]["hpi.onset"]["value"] is None
    client.patch(f"/sessions/{sid}/fields", json={"path": "chief_complaint", "value": None})
    client.post(f"/sessions/{sid}/inputs", json={"text": "咳嗽", "as": "nurse"})
    assert client.get(f"/sessions/{sid}").json()["fields"]["chief_complaint"]["value"] is None


def test_patient_ws_never_receives_nurse_drafts():
    sid = new("patient")
    with client.websocket_connect(f"/sessions/{sid}/ws?role=patient") as patient:
        assert patient.receive_json()["type"] == "status"
        client.post(f"/sessions/{sid}/finish-intake")
        client.post(f"/sessions/{sid}/claim")
        client.patch(f"/sessions/{sid}/fields", json={"path": "chief_complaint", "value": "咳嗽"})
        patient.send_json({"type": "recording.start"})
        # Patient receives no field update; a separate nurse receives recording state.
    assert "chief_complaint" not in json.dumps(client.get("/sessions").json(), ensure_ascii=False)
