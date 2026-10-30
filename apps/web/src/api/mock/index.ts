import { emptyFields } from "@/report/schema";
import type { ApiClient, RealtimeConnection, RealtimeHandlers } from "../client";
import { ApiError } from "../types";
import type { Role, ServerMessage, Session, SessionSummary } from "../types";
import { mockScript } from "./fixtures";

// In-memory stand-in for the api, enabled with VITE_API_MOCK=1. State resets on page reload.
// It follows the same rules the real api must enforce (docs/frontend/API_INTERFACE.md):
//  - the patient connection never receives drafts or flags;
//  - AI updates never overwrite a field the nurse has confirmed or edited;
//  - an unfinished intake has no 就診號 and is not listed;
//  - a session cannot be confirmed while any AI 草稿 remains.
type Listener = { role: Role; handlers: RealtimeHandlers };
type MockSession = Session & { started_at: string; listeners: Set<Listener>; scriptStarted: boolean };

const sessions = new Map<string, MockSession>();
let nextSession = 1;
let nextVisitNo = 1;

const allocateVisitNo = () => `SIM-${String(nextVisitNo++).padStart(6, "0")}`;
const get = (id: string) => {
  const s = sessions.get(id);
  if (!s) throw new ApiError(404, "session_not_found", "找不到這個 session");
  return s;
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

function startScript(s: MockSession) {
  if (s.scriptStarted) return;
  s.scriptStarted = true;
  for (const step of mockScript) setTimeout(() => runStep(s, step.message, !!step.nurseOnly), step.delayMs);
}

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
      scriptStarted: false,
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
    s.fields[path] =
      "confirm" in change
        ? { ...current, status: "護理師已確認" }
        : { value: change.value, status: "護理師已確認", source_span: null, source: "nurse_edit" };
    return delay(structuredClone(s.fields[path]));
  },

  async confirmSession(sessionId) {
    const s = get(sessionId);
    if (Object.values(s.fields).some((f) => f.status === "AI 草稿")) {
      throw new ApiError(409, "drafts_unconfirmed", "還有 AI 草稿未確認");
    }
    s.status = "confirmed";
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
          startScript(s); // stands in for audio being transcribed
        }
        if (message.type === "recording.stop") broadcast(s, { type: "recording.state", recording: false, by: role });
      },
      sendAudio() {},
      close() {
        s.listeners.delete(listener);
        handlers.onClose?.();
      },
    };
  },
};
