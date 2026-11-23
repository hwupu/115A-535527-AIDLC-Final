"""The recording arrives after recording.stop (MediaRecorder.onstop is async); keep it (#83)."""

import httpx
import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def stt_calls(monkeypatch):
    calls = []

    class FakeServices:
        async def __aenter__(self):
            return self

        async def __aexit__(self, *args):
            pass

        async def post(self, url, **kwargs):
            request = httpx.Request("POST", url)
            if url.endswith("/transcribe"):
                calls.append(url)
                body = {"segments": [{"text": "咳嗽"}], "model": "fake"}
                return httpx.Response(200, json=body, request=request)
            return httpx.Response(200, json={"fields": {}}, request=request)

    monkeypatch.setattr("app.main.httpx.AsyncClient", lambda **kwargs: FakeServices())
    return calls


def run(frames):
    """Send frames on a nurse socket and return the saved transcript texts."""
    client = TestClient(app)
    sid = client.post("/sessions", json={"created_by": "nurse"}).json()["session_id"]
    with client.websocket_connect(f"/sessions/{sid}/ws?role=nurse") as ws:
        assert ws.receive_json()["type"] == "status"
        for frame in frames:
            if isinstance(frame, bytes):
                ws.send_bytes(frame)
            else:
                ws.send_json({"type": frame})
        # Frames are handled in order: once this start is echoed, everything before it is done.
        ws.send_json({"type": "recording.start"})
        while True:
            message = ws.receive_json()
            if message["type"] == "recording.state" and message["recording"]:
                break
    return [s["text"] for s in client.get(f"/sessions/{sid}").json()["segments"]]


def test_blob_after_stop_is_transcribed(stt_calls):
    # What the nurse screen does: recorder.stop(), then recording.stop, then onstop sends the blob.
    assert run(["recording.start", "recording.stop", b"webm"]) == ["咳嗽"]
    assert len(stt_calls) == 1


def test_blob_before_stop_still_works(stt_calls):
    assert run(["recording.start", b"webm", "recording.stop"]) == ["咳嗽"]


def test_repeated_stop_keeps_the_pending_blob(stt_calls):
    assert run(["recording.start", "recording.stop", "recording.stop", b"webm"]) == ["咳嗽"]


def test_only_one_blob_is_accepted_after_stop(stt_calls):
    assert run(["recording.start", "recording.stop", b"webm", b"stray"]) == ["咳嗽"]
    assert len(stt_calls) == 1


def test_audio_without_a_recording_is_ignored(stt_calls):
    assert run([b"stray", "recording.stop", b"stray"]) == []
    assert stt_calls == []
