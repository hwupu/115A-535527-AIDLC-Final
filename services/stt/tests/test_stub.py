from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health():
    assert client.get("/health").json() == {"status": "ok", "service": "stt"}


def test_invalid_audio_is_not_canned_success(monkeypatch):
    class InvalidDecoder:
        def transcribe(self, *args, **kwargs):
            raise ValueError("invalid audio")

    monkeypatch.setattr("app.main.load_model", lambda: InvalidDecoder())
    res = client.post("/transcribe", files={"audio": ("a.wav", b"x")})
    assert res.status_code == 422


def test_empty_audio():
    assert client.post("/transcribe", files={"audio": ("empty.wav", b"")}).status_code == 413
