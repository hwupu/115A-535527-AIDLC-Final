"""Whisper on the GPU when one works (float16), otherwise on the CPU (int8).

Audio is decoded in memory and never persisted."""

import io
import logging
import os
from functools import lru_cache
from pathlib import Path
from threading import Lock

from fastapi import FastAPI, HTTPException, UploadFile
from pydantic import BaseModel

app = FastAPI(title="triage stt")
MODEL = os.getenv("WHISPER_MODEL", "small")
DEVICE = os.getenv("WHISPER_DEVICE", "auto")  # auto: GPU if it works, else CPU; or cuda / cpu
INFERENCE_LOCK = Lock()
log = logging.getLogger("stt")
RUNTIME = {"device": "", "compute_type": ""}  # what load_model actually chose


def _download_root() -> str:
    here = Path(__file__).resolve()
    return str((here.parents[3] if len(here.parents) > 3 else Path("/srv")) / "data" / "whisper")


def _cuda_devices() -> int:
    try:
        import ctranslate2

        return ctranslate2.get_cuda_device_count()
    except Exception:
        return 0


def _open(device: str, compute_type: str):
    from faster_whisper import WhisperModel

    return WhisperModel(
        MODEL,
        device=device,
        compute_type=compute_type,
        cpu_threads=4,
        download_root=_download_root(),
    )


def _works(model) -> bool:
    """Transcribe 1 s of silence: missing cuBLAS/cuDNN shows up only at inference, not at load."""
    import numpy as np

    segments, _ = model.transcribe(np.zeros(16000, dtype=np.float32), language="zh")
    list(segments)
    return True


@lru_cache(maxsize=1)
def load_model():
    if DEVICE in ("auto", "cuda") and _cuda_devices() > 0:
        try:
            model = _open("cuda", "float16")
            _works(model)
            RUNTIME.update(device="cuda", compute_type="float16")
            log.warning("whisper %s on cuda float16", MODEL)
            return model
        except Exception as exc:
            log.warning("whisper on cuda failed, falling back to cpu: %s", exc)
    RUNTIME.update(device="cpu", compute_type="int8")
    log.warning("whisper %s on cpu int8", MODEL)
    return _open("cpu", "int8")


class Segment(BaseModel):
    text: str
    start: float  # seconds
    end: float


class TranscribeResponse(BaseModel):
    segments: list[Segment]
    model: str = MODEL
    duration: float = 0.0  # seconds of audio, so the api can place later recordings after this one
    device: str = ""  # cuda or cpu, as actually used
    compute_type: str = ""


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
            segments, info = load_model().transcribe(
                io.BytesIO(data), language="zh", beam_size=5, vad_filter=True
            )
            converter = OpenCC("s2twp")
            result = [
                Segment(text=converter.convert(s.text), start=s.start, end=s.end) for s in segments
            ]
        return TranscribeResponse(
            segments=result,
            duration=round(info.duration, 2),
            device=RUNTIME["device"],
            compute_type=RUNTIME["compute_type"],
        )
    except Exception as exc:
        raise HTTPException(422, "Unable to decode/transcribe audio; use text input") from exc
