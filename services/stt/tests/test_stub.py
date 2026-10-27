from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health():
    assert client.get("/health").json() == {"status": "ok", "service": "stt"}


def test_transcribe_contract():
    res = client.post("/transcribe", files={"audio": ("a.wav", b"x")})
    seg = res.json()["segments"][0]
    assert {"text", "start", "end"} <= seg.keys()
