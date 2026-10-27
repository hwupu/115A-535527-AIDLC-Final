from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health():
    assert client.get("/health").json() == {"status": "ok", "service": "llm"}


def test_extract_contract_has_no_triage_level():
    res = client.post("/extract", json={"transcript": "x"})
    fields = res.json()["fields"]
    assert "triage_level" not in fields
    assert {"value", "source_span"} <= fields["chief_complaint"].keys()
