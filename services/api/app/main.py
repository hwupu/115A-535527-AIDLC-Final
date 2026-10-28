"""Session API stub (P1). Real session lifecycle, WebSocket and guard come in later tickets."""
from fastapi import FastAPI

app = FastAPI(title="triage api (stub)")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "api"}
