"""Local extraction through Ollama. No canned result; failures are explicit."""

import json
import os
import re
import threading
import time
from contextlib import asynccontextmanager
from functools import lru_cache
from pathlib import Path

import httpx
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

MODEL = os.getenv("LLM_MODEL", "gemma3:1b")
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://127.0.0.1:11434")
WARMED = threading.Event()


def warm_up():
    """The first chat after Ollama loads a model is slow; pay that before the first nurse turn."""
    try:
        generate("病患：咳嗽。", ExtractRequest.model_fields["prompt_version"].default)
    except Exception:  # noqa: BLE001 - a failed warm-up only means the first real request is slow
        pass
    finally:
        WARMED.set()


@asynccontextmanager
async def lifespan(app):
    threading.Thread(target=warm_up, daemon=True).start()
    yield


app = FastAPI(title="Group1 local extraction", lifespan=lifespan)
ALLOWED = {
    "chief_complaint",
    "hpi.onset",
    "hpi.location",
    "hpi.quality",
    "hpi.severity",
    "hpi.course",
    "hpi.aggravating_relieving",
    "hpi.associated_symptoms",
    "hpi.relevant_history",
    "tocc.travel",
    "tocc.travel_details",
    "tocc.occupation",
    "tocc.contact",
    "tocc.contact_details",
    "tocc.cluster",
    "tocc.cluster_details",
    "tocc.fever_cough_cold",
    "tocc.fever_cough_cold_details",
    "measurement.restrictions",
    "measurement.wristband_no_treatment",
    "measurement.vitals.bp_site",
    "measurement.vitals.bp_sys",
    "measurement.vitals.bp_dia",
    "measurement.vitals.hr",
    "measurement.vitals.spo2",
    "measurement.vitals.temp_c",
    "patient.dob",
    "patient.accompanied_by",
    "patient.mobility",
}
FORBIDDEN = re.compile(
    r"檢傷.{0,8}[一二三四五12345].{0,2}級|建議.{0,8}(服用|用藥|治療)|triage_level|diagnosis|prescri",
    re.I,
)


class ExtractRequest(BaseModel):
    transcript: str = Field(max_length=12000)
    prompt_version: str = "v3"


def ground_quotes(raw, transcript):
    """v3 model selects exact quotes; deterministic adapter normalizes only supported fields."""
    if not isinstance(raw, dict) or not isinstance(raw.get("fields"), dict):
        raise ValueError("Expected fields object")
    fields = {}
    for path, quote in raw["fields"].items():
        if (
            path not in ALLOWED
            or not isinstance(quote, str)
            or not quote
            or quote not in transcript
        ):
            continue
        value = quote
        if path == "tocc.travel":
            if "旅遊" not in quote:
                continue
            value = (
                "不確定"
                if "不確定" in quote
                else "無"
                if any(x in quote for x in ("沒有", "無", "未曾"))
                else "有"
            )
        elif path == "measurement.vitals.temp_c":
            match = re.search(r"(?:實測|量到體溫|量測體溫).*?(\d{2}(?:\.\d+)?)", quote)
            if not match or "護理師" not in transcript:
                continue
            value = float(match[1])
        elif path == "measurement.restrictions":
            value = [quote]
        elif path not in ("chief_complaint", "hpi.onset", "patient.mobility"):
            continue
        fields[path] = {"value": value, "source_span": quote}
    return {"fields": fields}


def guard(raw, transcript):
    """Fail closed. Source containment is necessary, not proof of clinical entailment."""
    if not isinstance(raw, dict) or not isinstance(raw.get("fields"), dict):
        raise ValueError("Expected fields object")
    fields, rejected = {}, []
    for path, f in raw["fields"].items():
        if path not in ALLOWED or not isinstance(f, dict):
            rejected.append({"path": path, "reason": "unknown_or_forbidden_field"})
            continue
        value, span = f.get("value"), f.get("source_span")
        if value in (None, "", []):
            continue
        if not isinstance(span, str) or not span.strip() or span not in transcript:
            rejected.append({"path": path, "reason": "source_not_found"})
            continue
        if FORBIDDEN.search(json.dumps(value, ensure_ascii=False)):
            rejected.append({"path": path, "reason": "boundary_violation"})
            continue
        fields[path] = {"value": value, "source_span": span}
    return fields, rejected


@lru_cache(maxsize=1)
def thinks():
    """Thinking models (gemma4) spend the whole output budget reasoning and return no answer."""
    try:
        response = httpx.post(OLLAMA_URL + "/api/show", json={"model": MODEL}, timeout=10)
        response.raise_for_status()
        return "thinking" in response.json().get("capabilities", [])
    except (httpx.HTTPError, ValueError):
        return False


def generate(transcript, version="v2"):
    prompt = (Path(__file__).resolve().parents[1] / "prompts" / f"{version}.txt").read_text(
        encoding="utf-8"
    )
    messages = [
        {"role": "system", "content": prompt},
        {
            "role": "user",
            "content": json.dumps({"untrusted_transcript": transcript}, ensure_ascii=False),
        },
    ]
    body = {
        "model": MODEL,
        "messages": messages,
        "stream": False,
        "format": "json",
        # Deterministic, same output budget as the earlier local adapter.
        "options": {"temperature": 0, "num_predict": 450},
    }
    # Only for thinking models: sending think=false to gemma3 changed its answers to empty.
    if thinks():
        body["think"] = False
    response = httpx.post(OLLAMA_URL + "/api/chat", json=body, timeout=120)
    response.raise_for_status()
    return response.json()["message"]["content"]


@app.get("/health")
def health():
    return {"status": "ok", "service": "llm"}


@app.get("/ready")
def ready():
    """Ready once the warm-up has run, even if it failed: manual entry never waits on the model."""
    if not WARMED.is_set():
        raise HTTPException(503, "Warming up the extraction model")
    return {"status": "ready", "model": MODEL}


@app.post("/extract")
def extract(req: ExtractRequest):
    if req.prompt_version not in ("v1", "v2", "v3", "v4"):
        raise HTTPException(422, "Unknown prompt version")
    started = time.perf_counter()
    if not req.transcript.strip():
        return {
            "fields": {},
            "rejected": [],
            "metadata": {
                "model": MODEL,
                "prompt_version": req.prompt_version,
                "seconds": 0,
                "inference": "empty_input_skipped",
            },
        }
    try:
        raw = generate(req.transcript, req.prompt_version)
        cleaned = re.sub(r"^```(?:json)?\s*|\s*```$", "", raw.strip())
        parsed = json.loads(cleaned)
        if req.prompt_version in ("v3", "v4"):
            parsed = ground_quotes(parsed, req.transcript)
        fields, rejected = guard(parsed, req.transcript)
    except (httpx.HTTPError, ValueError, KeyError, TypeError, RuntimeError, OSError) as exc:
        raise HTTPException(
            503, f"Extraction failed: {type(exc).__name__}; manual entry remains available"
        ) from exc
    return {
        "fields": fields,
        "rejected": rejected,
        "raw_output": raw,
        "metadata": {
            "model": MODEL,
            "prompt_version": req.prompt_version,
            "seconds": round(time.perf_counter() - started, 3),
            "git_commit": os.getenv("GIT_COMMIT", "uncommitted"),
        },
    }
