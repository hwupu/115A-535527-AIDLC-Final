"""LLM stub. Interface: transcript -> field JSON with source_span.

triage_level is never part of the output.
"""

from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(title="triage llm (stub)")


class ExtractRequest(BaseModel):
    transcript: str
    prompt_version: str = "stub"


class Field(BaseModel):
    value: str | None
    source_span: str | None  # exact quote from the transcript, or None when not mentioned


class ExtractResponse(BaseModel):
    fields: dict[str, Field]


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "llm"}


@app.post("/extract", response_model=ExtractResponse)
def extract(req: ExtractRequest) -> ExtractResponse:
    # Stub: canned output. Real field names follow docs/SCENARIOS.md §1.
    field = Field(value="（stub）發燒", source_span=None)
    return ExtractResponse(fields={"chief_complaint": field})
