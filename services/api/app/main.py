"""CP2 local-only simulated-data prototype; roles are not authentication."""

import asyncio
import csv
import hashlib
import io
import json
import os
import re
from copy import deepcopy
from datetime import datetime, timedelta, timezone
from typing import Literal
from uuid import uuid4

import httpx
from fastapi import FastAPI, HTTPException, Request, Response, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import delete, select

from app.contracts import FIELDS, empty_fields, valid_value
from app.db import Audit, Database, Encounter, EvaluationRun

app = FastAPI(title="Group1 CP2 local prototype")
locks = {}
listeners = {}


def now():
    return datetime.now(timezone.utc).isoformat()


def fail(status, code, message):
    raise HTTPException(status, {"code": code, "message": message})


@app.exception_handler(HTTPException)
async def error_handler(request, exc):
    return JSONResponse({"error": exc.detail}, status_code=exc.status_code)


class Strict(BaseModel):
    model_config = ConfigDict(extra="forbid")


class Create(Strict):
    created_by: Literal["nurse", "patient"]


class Input(Strict):
    kind: Literal["text"] = "text"
    text: str = Field(min_length=1, max_length=12000)
    as_: Literal["nurse", "patient"] = Field(alias="as")


class Edit(Strict):
    path: str
    value: str | int | float | bool | list[str] | None = None
    confirm: bool = False


class Confirm(Strict):
    triage_level: Literal[1, 2, 3, 4, 5]


class RunCreate(Strict):
    scenario_id: str
    participant_code: str = Field(pattern=r"^N-\d{2}$")


class Event(Strict):
    type: Literal["error_found", "note"]
    payload: dict = Field(default_factory=dict)


def get(db, sid):
    row = db.scalar(select(Encounter).where(Encounter.session_id == sid))
    if row is None:
        fail(404, "session_not_found", "找不到這次問診")
    return row


def audit(db, sid, kind, payload, actor="nurse"):
    entry = {"at": now(), "type": kind, "actor": actor, "payload": payload}
    db.add(Audit(session_id=sid, data=entry))
    return entry


def writable(d):
    if d["status"] == "confirmed":
        fail(409, "already_confirmed", "報告已確認，不能修改")


def create(db, by):
    d = {
        "session_id": str(uuid4()),
        "status": "intake" if by == "patient" else "in_progress",
        "visit_no": None,
        "started_at": now(),
        "segments": [],
        "fields": empty_fields(),
        "flags": [],
    }
    row = Encounter(session_id=d["session_id"], data=d)
    db.add(row)
    db.flush()
    if by == "nurse":
        d = {**d, "visit_no": f"SIM-{row.id:06d}"}
    row.data = d
    audit(db, row.session_id, "session_created", {}, by)
    return d


async def broadcast(sid, event, nurse_only=False):
    for ws, role in list(listeners.get(sid, [])):
        if nurse_only and role != "nurse":
            continue
        try:
            await ws.send_json(event)
        except (RuntimeError, WebSocketDisconnect):
            if (ws, role) in listeners.get(sid, []):
                listeners[sid].remove((ws, role))


@app.get("/health")
def health():
    return {"status": "ok", "service": "api"}


@app.post("/sessions")
def new_session(body: Create):
    with Database.begin() as db:
        cutoff = (datetime.now(timezone.utc) - timedelta(minutes=30)).isoformat()
        for row in db.scalars(select(Encounter)).all():
            if row.data["status"] == "intake" and row.data["started_at"] < cutoff:
                db.execute(delete(Audit).where(Audit.session_id == row.session_id))
                db.delete(row)
        d = create(db, body.created_by)
        return {k: d[k] for k in ("session_id", "status", "visit_no")}


@app.get("/sessions")
def list_sessions(
    request: Request, status: str = "ready,in_progress,confirmed", visit_no: str | None = None
):
    with Database() as db:
        rows = []
        for row in db.scalars(select(Encounter).order_by(Encounter.id.desc())):
            d = row.data
            if (
                d["status"] not in status.split(",")
                or d["visit_no"] is None
                or (visit_no and d["visit_no"] != visit_no)
            ):
                continue
            item = {
                k: d.get(k)
                for k in ("session_id", "visit_no", "status", "started_at", "confirmed_at")
            }
            item["has_flags"] = bool(d["flags"]) if d["status"] == "confirmed" else False
            if d["status"] == "confirmed":
                item["chief_complaint"] = d["fields"]["chief_complaint"]["value"]
            rows.append(item)
        etag = '"' + hashlib.sha256(json.dumps(rows, sort_keys=True).encode()).hexdigest() + '"'
        if request.headers.get("if-none-match") == etag:
            return Response(status_code=304, headers={"ETag": etag})
        return JSONResponse(rows, headers={"ETag": etag})


@app.get("/sessions/{sid}")
def session(sid: str):
    with Database() as db:
        return get(db, sid).data


@app.post("/sessions/{sid}/finish-intake")
def finish_intake(sid: str):
    with Database.begin() as db:
        row = get(db, sid)
        d = deepcopy(row.data)
        if d["status"] == "intake":
            d.update(status="ready", visit_no=f"SIM-{row.id:06d}")
            row.data = d
            audit(db, sid, "intake_finished", {}, "patient")
        return {"visit_no": d["visit_no"]}


@app.post("/sessions/{sid}/claim")
def claim(sid: str):
    with Database.begin() as db:
        row = get(db, sid)
        d = deepcopy(row.data)
        if d["status"] == "intake":
            fail(409, "intake_not_finished", "病患尚未完成輸入")
        if d["status"] == "ready":
            d["status"] = "in_progress"
            row.data = d
            audit(db, sid, "session_claimed", {})
        return {"status": d["status"], "visit_no": d["visit_no"]}


async def add_input(sid, text, role):
    async with locks.setdefault(sid, asyncio.Lock()):
        with Database.begin() as db:
            row = get(db, sid)
            d = deepcopy(row.data)
            writable(d)
            if role == "patient" and d["status"] != "intake":
                fail(409, "intake_closed", "病患輸入已完成")
            segment = {
                "segment_id": str(uuid4()),
                "speaker": role,
                "text": text,
                "start": 0,
                "end": 0,
                "final": True,
            }
            if role == "patient":
                segment["source"] = "patient_input"
            d["segments"].append(segment)
            row.data = d
            transcript = "\n".join(s["text"] for s in d["segments"])
        await broadcast(sid, {"type": "transcript.segment", **segment}, nurse_only=True)
        if role == "patient":
            for ws, r in list(listeners.get(sid, [])):
                if r == "patient":
                    await ws.send_json({"type": "transcript.segment", **segment})
        try:
            async with httpx.AsyncClient(timeout=180) as client:
                response = await client.post(
                    os.getenv("LLM_URL", "http://127.0.0.1:8002") + "/extract",
                    json={"transcript": transcript},
                )
                response.raise_for_status()
                result = response.json()
            with Database.begin() as db:
                row = get(db, sid)
                d = deepcopy(row.data)
                if d["status"] == "confirmed":
                    return segment["segment_id"]
                changes = []
                for path, f in result.get("fields", {}).items():
                    if path not in FIELDS or not isinstance(f, dict):
                        continue
                    current = d["fields"][path]
                    if current["source"] == "nurse_edit" or current["status"] == "護理師已確認":
                        continue
                    value, span = f.get("value"), f.get("source_span")
                    if (
                        value is None
                        or not valid_value(path, value)
                        or not isinstance(span, str)
                        or not span
                        or span not in transcript
                    ):
                        continue
                    if re.search(
                        r"triage_level|檢傷.{0,8}[一二三四五12345].{0,2}級|建議.{0,8}(服用|用藥|治療)",
                        json.dumps(value, ensure_ascii=False),
                        re.I,
                    ):
                        continue
                    d["fields"][path] = {
                        "value": value,
                        "source_span": span,
                        "source": "ai",
                        "status": "AI 草稿",
                    }
                    changes.append({"type": "field.update", "path": path, **d["fields"][path]})
                d["inference"] = {
                    **result.get("metadata", {}),
                    "whisper_model": d.get("whisper_model", "not_run"),
                }
                row.data = d
                audit(
                    db,
                    sid,
                    "ai_extract",
                    {"metadata": d["inference"], "rejected": result.get("rejected", [])},
                    "ai",
                )
            for event in changes:
                await broadcast(sid, event, nurse_only=True)
            await broadcast(sid, {"type": "status", "stt": "ok", "llm": "ok"}, nurse_only=True)
        except (httpx.HTTPError, ValueError, KeyError):
            await broadcast(sid, {"type": "status", "stt": "ok", "llm": "down"}, nurse_only=True)
            await broadcast(
                sid,
                {
                    "type": "error",
                    "code": "llm_unavailable",
                    "message": "AI 草稿暫時無法產生，逐字稿已保留，請手動填寫",
                },
                nurse_only=True,
            )
        return segment["segment_id"]


@app.post("/sessions/{sid}/inputs")
async def text_input(sid: str, body: Input):
    return {"input_id": await add_input(sid, body.text, body.as_)}


@app.patch("/sessions/{sid}/fields")
async def edit(sid: str, body: Edit):
    async with locks.setdefault(sid, asyncio.Lock()):
        with Database.begin() as db:
            row = get(db, sid)
            d = deepcopy(row.data)
            writable(d)
            if body.path not in FIELDS:
                fail(422, "field_not_allowed", "不允許此欄位")
            before = d["fields"][body.path]
            if body.confirm:
                if before["status"] != "AI 草稿":
                    fail(409, "not_a_draft", "此欄位不是待確認草稿")
                after = {**before, "status": "護理師已確認"}
            else:
                if "value" not in body.model_fields_set or not valid_value(body.path, body.value):
                    fail(422, "invalid_value", "欄位值格式錯誤")
                empty = body.value in (None, "", [])
                after = {
                    "value": None if empty else body.value,
                    "status": "未提及" if empty else "護理師已確認",
                    "source_span": None,
                    "source": "nurse_edit",
                }
            d["fields"][body.path] = after
            row.data = d
            audit(
                db,
                sid,
                "field_edit",
                {
                    "path": body.path,
                    "before": before,
                    "after": after,
                    "kind": "confirm" if body.confirm else "edit",
                },
            )
        await broadcast(sid, {"type": "field.update", "path": body.path, **after}, nurse_only=True)
        return after


@app.post("/sessions/{sid}/confirm")
async def confirm(sid: str, body: Confirm):
    async with locks.setdefault(sid, asyncio.Lock()):
        with Database.begin() as db:
            row = get(db, sid)
            d = deepcopy(row.data)
            writable(d)
            if d["status"] != "in_progress":
                fail(409, "not_claimed", "請先由護理師開啟問診")
            if any(f["status"] == "AI 草稿" for f in d["fields"].values()):
                fail(409, "drafts_unconfirmed", "仍有 AI 草稿未確認")
            d.update(status="confirmed", confirmed_at=now(), triage_level=body.triage_level)
            row.data = d
            audit(db, sid, "level_entered", {"triage_level": body.triage_level})
            audit(db, sid, "report_confirmed", {})
            return {"confirmed_at": d["confirmed_at"]}


@app.get("/sessions/{sid}/report")
def report(sid: str):
    with Database() as db:
        d = get(db, sid).data
        if d["status"] != "confirmed":
            fail(409, "not_confirmed", "護理師尚未確認")
        return {
            k: d[k]
            for k in ("session_id", "visit_no", "confirmed_at", "triage_level", "fields", "flags")
        }


@app.get("/sessions/{sid}/audit")
def audit_log(sid: str):
    with Database() as db:
        get(db, sid)
        return [
            r.data
            for r in db.scalars(select(Audit).where(Audit.session_id == sid).order_by(Audit.id))
        ]


@app.delete("/sessions/{sid}", status_code=204)
async def remove(sid: str):
    async with locks.setdefault(sid, asyncio.Lock()):
        with Database.begin() as db:
            db.delete(get(db, sid))
            db.execute(delete(Audit).where(Audit.session_id == sid))
            for run in db.scalars(select(EvaluationRun)).all():
                if run.data["session_id"] == sid:
                    db.delete(run)
        for ws, _ in list(listeners.pop(sid, [])):
            await ws.close(code=1000)


def evaluation_enabled():
    if os.getenv("EVAL_MODE", "0") != "1":
        fail(404, "evaluation_disabled", "評估模式未啟用")


SCENARIOS = [
    {"id": f"T{i:02d}", "title": title, "split": "dev", "demo": i == 1}
    for i, title in enumerate(
        [
            "發燒咳嗽",
            "無旅遊史",
            "未提及",
            "口述生命徵象",
            "量測禁忌",
            "更正答案",
            "自述與實測",
            "提示注入",
            "拒絕檢傷判定",
            "陪同與行動",
            "空白輸入",
            "資訊不足",
        ],
        1,
    )
]


@app.get("/scenarios")
def scenarios():
    evaluation_enabled()
    return SCENARIOS


@app.post("/evaluation/runs")
def new_run(body: RunCreate):
    evaluation_enabled()
    if body.scenario_id not in {s["id"] for s in SCENARIOS}:
        fail(404, "scenario_not_found", "找不到情境")
    with Database.begin() as db:
        s = create(db, "nurse")
        d = {
            "run_id": str(uuid4()),
            "scenario_id": body.scenario_id,
            "participant_code": body.participant_code,
            "session_id": s["session_id"],
            "visit_no": s["visit_no"],
            "created_at": now(),
        }
        db.add(EvaluationRun(run_id=d["run_id"], data=d))
        return d


def get_run(db, rid):
    evaluation_enabled()
    row = db.get(EvaluationRun, rid)
    if row is None:
        fail(404, "run_not_found", "找不到評估執行")
    return row


@app.get("/evaluation/runs")
def runs():
    evaluation_enabled()
    with Database() as db:
        return sorted(
            [r.data for r in db.scalars(select(EvaluationRun))],
            key=lambda r: r["created_at"],
            reverse=True,
        )


@app.post("/evaluation/runs/{rid}/start")
def start_run(rid: str):
    return run_action(rid, "start")


@app.post("/evaluation/runs/{rid}/finish")
def finish_run(rid: str):
    return run_action(rid, "finish")


def run_action(rid, action):
    with Database.begin() as db:
        row = get_run(db, rid)
        d = deepcopy(row.data)
        if (action == "start" and d.get("started_at")) or (
            action == "finish" and (not d.get("started_at") or d.get("finished_at"))
        ):
            fail(409, "run_state_conflict", "評估狀態不符")
        d["started_at" if action == "start" else "finished_at"] = now()
        row.data = d
        audit(db, d["session_id"], "task_start" if action == "start" else "task_end", {}, "admin")
        return d


@app.get("/evaluation/runs/{rid}/events")
def events(rid: str):
    with Database() as db:
        d = get_run(db, rid).data
        return [
            r.data
            for r in db.scalars(
                select(Audit).where(Audit.session_id == d["session_id"]).order_by(Audit.id)
            )
        ]


@app.post("/evaluation/runs/{rid}/events")
def add_event(rid: str, body: Event):
    with Database.begin() as db:
        d = get_run(db, rid).data
        if not d.get("started_at") or d.get("finished_at"):
            fail(409, "run_not_running", "評估未在進行中")
        return audit(db, d["session_id"], body.type, body.payload, "admin")


@app.get("/evaluation/runs/{rid}/export")
def export(rid: str, format: Literal["json", "csv"] = "json"):
    with Database() as db:
        d = get_run(db, rid).data
        s = get(db, d["session_id"]).data
        e = [
            r.data
            for r in db.scalars(
                select(Audit).where(Audit.session_id == d["session_id"]).order_by(Audit.id)
            )
        ]
        metadata = {
            "model": "not_run",
            "prompt_version": "not_run",
            "whisper_model": "not_run",
            "git_commit": os.getenv("GIT_COMMIT", "uncommitted"),
        }
        metadata.update(s.get("inference", {}))
        if format == "json":
            return JSONResponse({"run": d, "events": e, **metadata})
        out = io.StringIO()
        writer = csv.writer(out)
        writer.writerow(["run_id", "scenario_id", "participant_code", "at", "type", "payload"])
        for event in e:
            writer.writerow(
                [
                    d["run_id"],
                    d["scenario_id"],
                    d["participant_code"],
                    event["at"],
                    event["type"],
                    json.dumps(event["payload"], ensure_ascii=False),
                ]
            )
        return Response(out.getvalue(), media_type="text/csv")


@app.websocket("/sessions/{sid}/ws")
async def socket(ws: WebSocket, sid: str, role: Literal["patient", "nurse"] = "nurse"):
    await ws.accept()
    try:
        with Database() as db:
            get(db, sid)
    except HTTPException:
        await ws.close(code=1008)
        return
    pair = (ws, role)
    listeners.setdefault(sid, []).append(pair)
    await ws.send_json({"type": "status", "stt": "ok", "llm": "ok"})
    recording = False
    try:
        while True:
            message = await ws.receive()
            if message["type"] == "websocket.disconnect":
                break
            if message.get("bytes") is not None:
                if not recording:
                    continue
                audio = message["bytes"]
                if len(audio) > 16 * 1024 * 1024:
                    await ws.send_json(
                        {
                            "type": "error",
                            "code": "audio_too_large",
                            "message": "錄音過長，請分段錄製",
                        }
                    )
                    continue
                try:
                    async with httpx.AsyncClient(timeout=180) as client:
                        r = await client.post(
                            os.getenv("STT_URL", "http://127.0.0.1:8001") + "/transcribe",
                            files={"audio": ("clip.webm", audio, "audio/webm")},
                        )
                        r.raise_for_status()
                    transcription = r.json()
                    text = "".join(s["text"] for s in transcription["segments"])
                    with Database.begin() as db:
                        row = get(db, sid)
                        data = deepcopy(row.data)
                        data["whisper_model"] = transcription.get("model", "unknown")
                        row.data = data
                    if text.strip():
                        await add_input(sid, text, role)
                except (httpx.HTTPError, ValueError):
                    await ws.send_json(
                        {
                            "type": "error",
                            "code": "stt_unavailable",
                            "message": "語音辨識失敗，請改用文字輸入",
                        }
                    )
            elif message.get("text"):
                try:
                    event = json.loads(message["text"])
                    if event.get("type") in ("recording.start", "recording.stop"):
                        recording = event["type"] == "recording.start"
                        await broadcast(
                            sid,
                            {"type": "recording.state", "recording": recording, "by": role},
                            nurse_only=True,
                        )
                except ValueError:
                    await ws.send_json(
                        {"type": "error", "code": "bad_message", "message": "訊息格式錯誤"}
                    )
    except (WebSocketDisconnect, RuntimeError, HTTPException):
        pass
    finally:
        if pair in listeners.get(sid, []):
            listeners[sid].remove(pair)
