"""Local CPU extraction. No canned result; failures are explicit."""

import json
import os
import re
import threading
import time
from functools import lru_cache
from pathlib import Path

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

app = FastAPI(title="Group1 local extraction")
MODEL = os.getenv("LLM_MODEL", "Qwen/Qwen2.5-0.5B-Instruct")
ROOT = (
    Path(__file__).resolve().parents[3]
    if len(Path(__file__).resolve().parents) > 3
    else Path("/srv")
)
MODEL_LOCK = threading.Lock()
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


@lru_cache(maxsize=1)
def load_model():
    import torch
    from transformers import AutoModelForCausalLM, AutoTokenizer

    torch.set_num_threads(min(4, os.cpu_count() or 2))
    cache = str(ROOT / "data" / "models")
    tokenizer = AutoTokenizer.from_pretrained(MODEL, cache_dir=cache, trust_remote_code=False)
    model = AutoModelForCausalLM.from_pretrained(
        MODEL, cache_dir=cache, trust_remote_code=False, torch_dtype=torch.float32
    )
    return tokenizer, model.eval()


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


def generate(transcript, version="v2"):
    import torch

    prompt = (Path(__file__).resolve().parents[1] / "prompts" / f"{version}.txt").read_text(
        encoding="utf-8"
    )
    tokenizer, model = load_model()
    messages = [
        {"role": "system", "content": prompt},
        {
            "role": "user",
            "content": json.dumps({"untrusted_transcript": transcript}, ensure_ascii=False),
        },
    ]
    text = tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
    encoded = tokenizer(text, return_tensors="pt")
    with torch.inference_mode():
        output = model.generate(
            **encoded, max_new_tokens=450, do_sample=False, pad_token_id=tokenizer.eos_token_id
        )
    return tokenizer.decode(output[0][encoded["input_ids"].shape[1] :], skip_special_tokens=True)


@app.get("/health")
def health():
    return {"status": "ok", "service": "llm"}


@app.post("/extract")
def extract(req: ExtractRequest):
    if req.prompt_version not in ("v1", "v2", "v3"):
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
    with MODEL_LOCK:
        try:
            raw = generate(req.transcript, req.prompt_version)
            cleaned = re.sub(r"^```(?:json)?\s*|\s*```$", "", raw.strip())
            parsed = json.loads(cleaned)
            if req.prompt_version == "v3":
                parsed = ground_quotes(parsed, req.transcript)
            fields, rejected = guard(parsed, req.transcript)
        except (ValueError, RuntimeError, OSError) as exc:
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
