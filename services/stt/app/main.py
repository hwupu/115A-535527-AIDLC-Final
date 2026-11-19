"""CPU int8 Whisper. Audio is decoded in memory and never persisted."""

import io
import os
from functools import lru_cache
from pathlib import Path
from threading import Lock

from fastapi import FastAPI, HTTPException, UploadFile
from pydantic import BaseModel

app = FastAPI(title="triage stt CPU")
MODEL = os.getenv("WHISPER_MODEL", "small")
INFERENCE_LOCK = Lock()


@lru_cache(maxsize=1)
def load_model():
    from faster_whisper import WhisperModel

    return WhisperModel(
        MODEL,
        device="cpu",
        compute_type="int8",
        cpu_threads=4,
        download_root=str(
            (
                Path(__file__).resolve().parents[3]
                if len(Path(__file__).resolve().parents) > 3
                else Path("/srv")
            )
            / "data"
            / "whisper"
        ),
    )


class Segment(BaseModel):
    text: str
    start: float  # seconds
    end: float


class TranscribeResponse(BaseModel):
    segments: list[Segment]
    model: str = MODEL


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "stt"}


@app.post("/transcribe", response_model=TranscribeResponse)
async def transcribe(audio: UploadFile) -> TranscribeResponse:
    from opencc import OpenCC

    data = await audio.read(16 * 1024 * 1024 + 1)
    if not data or len(data) > 16 * 1024 * 1024:
        raise HTTPException(413, "Audio must be nonempty and at most 16 MiB")
    try:
        with INFERENCE_LOCK:
            segments, _ = load_model().transcribe(
                io.BytesIO(data), language="zh", beam_size=5, vad_filter=True
            )
            converter = OpenCC("s2twp")
            result = [
                Segment(text=converter.convert(s.text), start=s.start, end=s.end) for s in segments
            ]
        return TranscribeResponse(segments=result)
    except Exception as exc:
        raise HTTPException(422, "Unable to decode/transcribe audio; use text input") from exc
