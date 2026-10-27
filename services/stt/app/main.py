"""STT stub. Interface: audio in -> zh-TW text segments with timestamps. Real Whisper wiring: A1/B-tickets."""
from fastapi import FastAPI, UploadFile
from pydantic import BaseModel

app = FastAPI(title="triage stt (stub)")


class Segment(BaseModel):
    text: str
    start: float  # seconds
    end: float


class TranscribeResponse(BaseModel):
    segments: list[Segment]


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "stt"}


@app.post("/transcribe", response_model=TranscribeResponse)
async def transcribe(audio: UploadFile) -> TranscribeResponse:
    # Stub: fixed canned segment so api can be developed against this contract.
    return TranscribeResponse(segments=[Segment(text="（stub）請問哪裡不舒服？", start=0.0, end=2.0)])
