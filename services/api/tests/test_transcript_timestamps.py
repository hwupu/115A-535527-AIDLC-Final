"""Recorded lines keep Whisper's timing across a session's recordings; typed lines stay 0/0 (#8)."""

import httpx
from fastapi.testclient import TestClient

from app.main import app

# One reply per recording: Whisper times restart at 0 for every clip.
CLIPS = [
    {"segments": [{"text": "我昨天開始發燒", "start": 0.4, "end": 2.6}], "duration": 3.0},
    {
        "segments": [
            {"text": "咳嗽", "start": 0.2, "end": 1.0},
            {"text": "沒有出國", "start": 1.2, "end": 2.5},
        ],
        "duration": 2.8,
    },
]


def test_recordings_continue_the_session_timeline(monkeypatch):
    replies = iter(CLIPS)

    class FakeServices:
        async def __aenter__(self):
            return self

        async def __aexit__(self, *args):
            pass

        async def post(self, url, **kwargs):
            request = httpx.Request("POST", url)
            if url.endswith("/transcribe"):
                return httpx.Response(200, json={"model": "fake", **next(replies)}, request=request)
            return httpx.Response(200, json={"fields": {}}, request=request)

    monkeypatch.setattr("app.main.httpx.AsyncClient", lambda **kwargs: FakeServices())
    client = TestClient(app)
    sid = client.post("/sessions", json={"created_by": "nurse"}).json()["session_id"]
    client.post(f"/sessions/{sid}/inputs", json={"text": "打字的備註", "as": "nurse"})
    with client.websocket_connect(f"/sessions/{sid}/ws?role=nurse") as ws:
        assert ws.receive_json()["type"] == "status"
        for _ in CLIPS:
            ws.send_json({"type": "recording.start"})
            ws.send_json({"type": "recording.stop"})
            ws.send_bytes(b"webm")
        # Frames are handled in order: the extra start's echo arrives after both clips are done.
        ws.send_json({"type": "recording.start"})
        starts = 0
        while starts < len(CLIPS) + 1:
            message = ws.receive_json()
            starts += message["type"] == "recording.state" and message["recording"]
    segments = client.get(f"/sessions/{sid}").json()["segments"]
    assert [(s["text"], s["start"], s["end"]) for s in segments] == [
        ("打字的備註", 0, 0),
        ("我昨天開始發燒", 0.4, 2.6),
        # The second recording starts after the first one's 3.0 s.
        ("咳嗽沒有出國", 3.2, 5.5),
    ]
