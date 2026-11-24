"""Local extraction through Ollama. No canned result; failures are explicit."""

import json
import os
import re
import threading
import time
from contextlib import asynccontextmanager
from datetime import date
from functools import lru_cache
from pathlib import Path

import httpx
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

MODEL = os.getenv("LLM_MODEL", "gemma3:1b")
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://127.0.0.1:11434")
PROMPT_VERSION = os.getenv("LLM_PROMPT_VERSION", "v5")
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
    prompt_version: str = PROMPT_VERSION


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


# Value kinds as in services/api/app/contracts.py FIELDS; keep the two in sync.
KINDS = {
    "chief_complaint": "text",
    "tocc.fever_cough_cold": "yesno",
    "tocc.fever_cough_cold_details": "text",
    "tocc.travel": "yesno",
    "tocc.travel_details": "text",
    "tocc.occupation": "text",
    "tocc.contact": "yesno",
    "tocc.contact_details": "text",
    "tocc.cluster": "yesno",
    "tocc.cluster_details": "text",
    "measurement.restrictions": "list",
    "measurement.wristband_no_treatment": "bool",
    "measurement.vitals.bp_site": "text",
    "measurement.vitals.bp_sys": "number",
    "measurement.vitals.bp_dia": "number",
    "measurement.vitals.hr": "number",
    "measurement.vitals.spo2": "number",
    "measurement.vitals.temp_c": "number",
    "hpi.onset": "text",
    "hpi.location": "text",
    "hpi.quality": "text",
    "hpi.severity": "text",
    "hpi.course": "text",
    "hpi.aggravating_relieving": "text",
    "hpi.associated_symptoms": "list",
    "hpi.relevant_history": "list",
    "patient.dob": "text",
    "patient.accompanied_by": "text",
    "patient.mobility": "text",
}
SCHEMA_VALUES = {
    "text": {"type": "string"},
    "list": {"type": "array", "items": {"type": "string"}},
    "yesno": {"enum": ["有", "無", "不確定"]},
    "bool": {"type": "boolean"},
    "number": {"type": "number"},
}
# Structured output for v5: only {value, source_span} for known fields, so never triage_level.
V5_SCHEMA = {
    "type": "object",
    "properties": {
        "fields": {
            "type": "object",
            "properties": {
                path: {
                    "type": "object",
                    "properties": {"value": SCHEMA_VALUES[kind], "source_span": {"type": "string"}},
                    "required": ["value", "source_span"],
                }
                for path, kind in KINDS.items()
            },
            "additionalProperties": False,
        }
    },
    "required": ["fields"],
}
ZH_DIGITS = {"零": 0, "〇": 0, "一": 1, "二": 2, "兩": 2, "三": 3, "四": 4}
ZH_DIGITS |= {"五": 5, "六": 6, "七": 7, "八": 8, "九": 9}
ZH_UNITS = {"十": 10, "百": 100, "千": 1000}


def zh_digits(text):
    """Chinese numerals to Arabic digits: 一百二十二 → 122, 三十八點五 → 38.5, 九七 → 97."""

    def integer(chars):
        if not any(c in ZH_UNITS for c in chars):
            return "".join(str(ZH_DIGITS[c]) for c in chars)
        total = current = 0
        for c in chars:
            if c in ZH_DIGITS:
                current = ZH_DIGITS[c]
            else:
                total, current = total + (current or 1) * ZH_UNITS[c], 0
        return str(total + current)

    def convert(match):
        fraction = "".join(str(ZH_DIGITS[c]) for c in match[2] or "")
        return integer(match[1]) + ("." + fraction if fraction else "")

    numeral = r"([零〇一二兩三四五六七八九十百千]+)(?:點([零〇一二三四五六七八九]+))?"
    return re.sub(numeral, convert, text)


HOME_READING = re.compile(r"在家|家裡|自己量|早上量|昨天量|晚上量|昨晚量")


def said_at_home(span, transcript):
    """True if a sentence quoting span mentions a home reading (the quote may be just 體溫39度)."""
    for sentence in re.split(r"[。！？!?\n]", transcript):
        if span in sentence and HOME_READING.search(sentence):
            return True
    return False


def numbers_in(span):
    return [float(n) for n in re.findall(r"\d+(?:\.\d+)?", zh_digits(span))]


def date_in(span):
    """民國87年5月14日 / 八十七年五月十四日 → 1998-05-14; None if the quote has no full date."""
    m = re.search(r"(\d{2,4})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*[日號号]", zh_digits(span))
    if not m:
        return None
    year, month, day = int(m[1]), int(m[2]), int(m[3])
    year += 1911 if year < 200 else 0  # 民國 years
    try:
        return date(year, month, day).isoformat()
    except ValueError:
        return None


NUMBER = r"(\d+(?:\.\d+)?)"
VITAL_LABELS = {
    "measurement.vitals.bp_sys": r"(?:收縮壓|血壓)",
    "measurement.vitals.bp_dia": r"舒張壓",
    "measurement.vitals.hr": r"(?:脈搏|心跳|心率)",
    "measurement.vitals.spo2": r"(?:血氧|SpO2)",
    "measurement.vitals.temp_c": r"(?:體溫|耳溫|額溫)",
}


def vital_number(path, span):
    """Match a labelled value; ambiguous multi-number quotes must not use the first number."""
    text = zh_digits(span)
    labelled = re.findall(VITAL_LABELS[path] + r"[^\d。！？!?\n]{0,8}" + NUMBER, text, re.I)
    if not labelled and path == "measurement.vitals.bp_dia":
        pairs = re.findall(
            r"血壓[^\d。！？!?\n]{0,8}" + NUMBER + r"\s*[,，/／、]\s*" + NUMBER, text
        )
        labelled = [dia for _, dia in pairs]
    if labelled:
        values = {float(n) for n in labelled}
        return values.pop() if len(values) == 1 else None
    # A short number-only quote is supported; a quote labelled as another vital is not.
    if any(re.search(label, text, re.I) for label in VITAL_LABELS.values()):
        return None
    found = numbers_in(span)
    if len(found) == 1:
        return found[0]
    return None


def tidy_values(raw, transcript):
    """v5: numbers and the date of birth are computed from the quote, not trusted from the model.

    The model miscounted 民國87 as 1997; a wrong vital sign or date is worse than an empty field,
    so a value that cannot be computed from its quote is dropped (the nurse fills it in).
    """
    if not isinstance(raw, dict) or not isinstance(raw.get("fields"), dict):
        raise ValueError("Expected fields object")
    for path, f in raw["fields"].items():
        if not isinstance(f, dict) or not isinstance(f.get("source_span"), str):
            continue
        span = f["source_span"]
        if KINDS.get(path) == "number":
            number = vital_number(path, span)
            f["value"] = int(number) if number is not None and number.is_integer() else number
            # Home measurements of any vital are not current nurse measurements.
            if said_at_home(span, transcript):
                f["value"] = None
        elif path == "patient.dob":
            f["value"] = date_in(span)
    return raw


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
        "format": V5_SCHEMA if version == "v5" else "json",
        # Deterministic. v5 fills every field and its answer for a full dialogue passed 450 tokens.
        "options": {"temperature": 0, "num_predict": 1500},
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
    if req.prompt_version not in ("v1", "v2", "v3", "v4", "v5"):
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
        elif req.prompt_version == "v5":
            parsed = tidy_values(parsed, req.transcript)
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
