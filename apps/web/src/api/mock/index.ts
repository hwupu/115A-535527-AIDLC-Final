import { emptyFields } from "@/report/schema";
import type { ApiClient, RealtimeConnection, RealtimeHandlers } from "../client";
import { ApiError } from "../types";
import type { Role, Run, RunEvent, RunEventType, ServerMessage, Session, SessionSummary } from "../types";
import { mockScenarios, mockScript } from "./fixtures";
import { seedDialysis, seedFever, seedWaiting } from "./seed";

// In-memory stand-in for the api, enabled with VITE_API_MOCK=1. State resets on page reload.
// It follows the same rules the real api must enforce (docs/frontend/API_INTERFACE.md):
//  - the patient connection never receives drafts or flags;
//  - AI updates never overwrite a field the nurse has confirmed or edited;
//  - an unfinished intake has no 就診號 and is not listed;
//  - a session cannot be confirmed while any AI 草稿 remains.
type Listener = { role: Role; handlers: RealtimeHandlers };
type MockSession = Session & { started_at: string; listeners: Set<Listener>; scriptStarted: Set<Role> };
const MIN = 60_000;

const sessions = new Map<string, MockSession>();
const runs = new Map<string, Run>();
const runEvents = new Map<string, RunEvent[]>();
const runBySession = new Map<string, string>();
let nextRun = 1;
let nextSession = 1;
let nextVisitNo = 1;

const allocateVisitNo = () => `SIM-${String(nextVisitNo++).padStart(6, "0")}`;
const get = (id: string) => {
  const s = sessions.get(id);
  if (!s) throw new ApiError(404, "session_not_found", "找不到這個 session");
  return s;
};
// Demo data: one confirmed report, one in progress, one waiting. Newest started last so the list shows the waiting patient first.
function seed() {
  const make = (over: Partial<MockSession> & { minutesAgo: number }): MockSession => {
    const id = `mock-${nextSession++}`;
    const { minutesAgo, ...rest } = over;
    const s: MockSession = {
      session_id: id, status: "ready", visit_no: allocateVisitNo(), segments: [], fields: emptyFields(), flags: [],
      started_at: new Date(Date.now() - minutesAgo * MIN).toISOString(), listeners: new Set(), scriptStarted: new Set<Role>(["nurse", "patient"]), ...rest,
    };
    sessions.set(id, s);
    return s;
  };
  make({
    minutesAgo: 45, status: "confirmed", fields: seedDialysis.fields, flags: seedDialysis.flags,
    triage_level: seedDialysis.triageLevel, confirmed_at: new Date(Date.now() - 20 * MIN).toISOString(),
  });
  make({
    minutesAgo: 12, status: "in_progress", fields: seedFever.fields,
    // About 4 s per line so the transcript shows realistic timestamps in the demo.
    segments: seedFever.segments.map((x, i) => ({ segment_id: `s${i}`, speaker: x.speaker, text: x.text, start: i * 4, end: i * 4 + 3.5, final: true })),
  });
  make({
    minutesAgo: 3, status: "ready",
    segments: [{ segment_id: "w1", speaker: "patient", text: seedWaiting.text, start: 0, end: 0, final: true, source: "patient_input" }],
  });
}

// While a run is started and not finished, what the nurse does in its session is logged automatically
// (the real api derives these from the audit log, docs/frontend/API_INTERFACE.md §4).
function logRunEvent(sessionId: string, type: RunEventType, payload?: Record<string, unknown>) {
  const runId = runBySession.get(sessionId);
  const run = runId ? runs.get(runId) : undefined;
  if (!runId || !run?.started_at || run.finished_at) return;
  runEvents.get(runId)!.push({ at: new Date().toISOString(), type, payload });
}
const getRun = (id: string) => {
  const r = runs.get(id);
  if (!r) throw new ApiError(404, "run_not_found", "找不到這個評估執行");
  return r;
};

const delay = <T>(value: T) => new Promise<T>((resolve) => setTimeout(() => resolve(value), 150));

function broadcast(s: MockSession, message: ServerMessage, nurseOnly = false) {
  for (const l of s.listeners) {
    if (nurseOnly && l.role === "patient") continue;
    l.handlers.onMessage(message);
  }
}

// Apply one scripted server event to the stored session, then push it to the listeners.
function runStep(s: MockSession, message: ServerMessage, nurseOnly: boolean) {
  if (message.type === "transcript.segment") {
    const { type: _type, ...segment } = message;
    if (!s.segments.some((x) => x.segment_id === segment.segment_id)) s.segments.push(segment);
  } else if (message.type === "field.update") {
    const current = s.fields[message.path];
    if (current?.status === "護理師已確認") return; // AI never overwrites the nurse
    s.fields[message.path] = {
      value: message.value as never,
      status: message.status,
      source_span: message.source_span,
      source: message.source,
    };
  } else if (message.type === "flags.update") {
    s.flags = message.flags;
  }
  broadcast(s, message, nurseOnly);
}

// Stands in for audio being transcribed during a nurse recording: the scripted conversation, drafts and flags.
function startScript(s: MockSession) {
  if (s.scriptStarted.has("nurse")) return;
  s.scriptStarted.add("nurse");
  for (const step of mockScript) setTimeout(() => runStep(s, step.message, !!step.nurseOnly), step.delayMs);
}

// A patient recording yields one transcript segment when it stops, like the real api (one Whisper call per recording):
// only the patient's own words, tagged as patient input, never the nurse's lines and never drafts.
const patientLines = mockScript.flatMap((x) => (x.message.type === "transcript.segment" && x.message.speaker === "patient" ? [x.message.text] : []));
let nextPatientLine = 0;
export const MOCK_TRANSCRIBE_MS = 1000;
function transcribePatient(s: MockSession) {
  const text = patientLines[nextPatientLine++ % patientLines.length];
  const n = s.segments.length + 1;
  setTimeout(() => runStep(s, { type: "transcript.segment", segment_id: `p${n}`, speaker: "patient", text, start: n, end: n + 3, final: true, source: "patient_input" }, false), MOCK_TRANSCRIBE_MS);
}

seed();

export const mockClient: ApiClient = {
  async createSession(createdBy) {
    const id = `mock-${nextSession++}`;
    const nurse = createdBy === "nurse";
    sessions.set(id, {
      session_id: id,
      status: nurse ? "in_progress" : "intake",
      visit_no: nurse ? allocateVisitNo() : null,
      segments: [],
      fields: emptyFields(),
      flags: [],
      started_at: new Date().toISOString(),
      listeners: new Set(),
      scriptStarted: new Set(),
    });
    const s = get(id);
    return delay({ session_id: id, status: s.status, visit_no: s.visit_no });
  },

  async addTextInput(sessionId, text, as) {
    const s = get(sessionId);
    const n = s.segments.length + 1;
    s.segments.push({
      segment_id: `t${n}`,
      speaker: as,
      text,
      start: 0,
      end: 0,
      final: true,
      ...(as === "patient" ? { source: "patient_input" as const } : {}),
    });
    return delay({ input_id: `t${n}` });
  },

  async finishIntake(sessionId) {
    const s = get(sessionId);
    s.visit_no ??= allocateVisitNo();
    s.status = "ready";
    return delay({ visit_no: s.visit_no });
  },

  async listSessions(query = {}) {
    const rows: SessionSummary[] = [...sessions.values()]
      .filter((s) => s.status !== "intake") // unfinished intakes have no 就診號 and are not listed
      .filter((s) => !query.status?.length || query.status.includes(s.status))
      .filter((s) => !query.visit_no || s.visit_no === query.visit_no)
      .map((s) => ({
        session_id: s.session_id,
        visit_no: s.visit_no,
        status: s.status,
        started_at: s.started_at,
        confirmed_at: s.confirmed_at,
        chief_complaint: s.status === "confirmed" ? String(s.fields.chief_complaint?.value ?? "") : undefined,
        has_flags: s.flags.length > 0,
      }))
      .reverse();
    return delay(rows);
  },

  async getSession(sessionId) {
    const { listeners: _l, scriptStarted: _s, started_at: _t, ...session } = get(sessionId);
    return delay(structuredClone(session));
  },

  async listScenarios() {
    return delay(mockScenarios.map((x) => ({ ...x })));
  },

  async createRun({ scenario_id, participant_code }) {
    if (!mockScenarios.some((x) => x.id === scenario_id)) throw new ApiError(404, "scenario_not_found", "找不到這個情境");
    const session = await mockClient.createSession("nurse"); // the participant works in a nurse session
    const run: Run = {
      run_id: `run-${nextRun++}`, scenario_id, participant_code, session_id: session.session_id,
      visit_no: session.visit_no, created_at: new Date().toISOString(),
    };
    runs.set(run.run_id, run);
    runEvents.set(run.run_id, []);
    runBySession.set(run.session_id, run.run_id);
    return delay({ ...run });
  },

  async startRun(runId) {
    const r = getRun(runId);
    if (r.started_at) throw new ApiError(409, "run_already_started", "這個執行已經開始");
    r.started_at = new Date().toISOString();
    runEvents.get(runId)!.push({ at: r.started_at, type: "task_start" });
    return delay({ ...r });
  },

  async finishRun(runId) {
    const r = getRun(runId);
    if (!r.started_at || r.finished_at) throw new ApiError(409, "run_not_running", "這個執行沒有在進行");
    r.finished_at = new Date().toISOString();
    runEvents.get(runId)!.push({ at: r.finished_at, type: "task_end" });
    return delay({ ...r });
  },

  async listRuns() {
    return delay([...runs.values()].reverse().map((r) => ({ ...r })));
  },

  async listRunEvents(runId) {
    getRun(runId);
    return delay(structuredClone(runEvents.get(runId)!));
  },

  async addRunEvent(runId, body) {
    getRun(runId);
    const event: RunEvent = { at: new Date().toISOString(), type: body.type, payload: body.payload };
    runEvents.get(runId)!.push(event);
    return delay({ ...event });
  },

  async exportRun(runId, format) {
    const run = getRun(runId);
    const events = runEvents.get(runId)!;
    if (format === "csv") {
      const esc = (v: string) => `"${v.replaceAll('"', '""')}"`;
      return delay(["run_id,scenario_id,participant_code,at,type,payload", ...events.map((e) =>
        [run.run_id, run.scenario_id, run.participant_code, e.at, e.type, esc(JSON.stringify(e.payload ?? {}))].join(","))].join("\n"));
    }
    // The real api adds the actual model, prompt version, Whisper model and git commit (backend doc §4, `runs` table).
    return delay(JSON.stringify({ run, events, model: "mock", prompt_version: "mock", whisper_model: "mock", git_commit: "mock" }, null, 2));
  },

  async getReport(sessionId) {
    const s = get(sessionId);
    if (s.status !== "confirmed" || !s.triage_level || !s.confirmed_at || !s.visit_no) {
      throw new ApiError(409, "not_confirmed", "護理師尚未確認這份報告");
    }
    return delay(structuredClone({ session_id: s.session_id, visit_no: s.visit_no, confirmed_at: s.confirmed_at, triage_level: s.triage_level, fields: s.fields, flags: s.flags }));
  },

  async claimSession(sessionId) {
    const s = get(sessionId);
    if (s.status === "intake") throw new ApiError(409, "intake_not_finished", "病患還沒完成輸入");
    if (s.status === "ready") s.status = "in_progress";
    return delay({ status: s.status, visit_no: s.visit_no as string });
  },

  async patchField(sessionId, path, change) {
    const s = get(sessionId);
    const current = s.fields[path];
    if (!current) throw new ApiError(404, "field_not_found", `沒有這個欄位：${path}`);
    logRunEvent(sessionId, "field_edit", {
      path,
      kind: "confirm" in change ? "confirm" : "edit",
      ai_value: current.source === "ai" ? current.value : null,
      new_value: "confirm" in change ? current.value : change.value,
    });
    s.fields[path] =
      "confirm" in change
        ? { ...current, status: "護理師已確認" }
        : { value: change.value, status: "護理師已確認", source_span: null, source: "nurse_edit" };
    return delay(structuredClone(s.fields[path]));
  },

  async confirmSession(sessionId, body) {
    const s = get(sessionId);
    if (Object.values(s.fields).some((f) => f.status === "AI 草稿")) {
      throw new ApiError(409, "drafts_unconfirmed", "還有 AI 草稿未確認");
    }
    s.status = "confirmed";
    s.triage_level = body.triage_level;
    logRunEvent(sessionId, "level_entered", { triage_level: body.triage_level });
    s.confirmed_at = new Date().toISOString();
    return delay({ confirmed_at: s.confirmed_at });
  },

  connect(sessionId: string, role: Role, handlers: RealtimeHandlers): RealtimeConnection {
    const s = get(sessionId);
    const listener: Listener = { role, handlers };
    s.listeners.add(listener);
    setTimeout(() => handlers.onMessage({ type: "status", stt: "ok", llm: "ok" }), 0);
    return {
      send(message) {
        if (message.type === "recording.start") {
          broadcast(s, { type: "recording.state", recording: true, by: role });
          if (role === "nurse") startScript(s);
        }
        if (message.type === "recording.stop") {
          broadcast(s, { type: "recording.state", recording: false, by: role });
          if (role === "patient") transcribePatient(s);
        }
      },
      sendAudio() {},
      close() {
        s.listeners.delete(listener);
        handlers.onClose?.();
      },
    };
  },
};
