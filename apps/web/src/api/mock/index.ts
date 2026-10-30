import type { ApiClient, RealtimeConnection, RealtimeHandlers } from "../client";
import { ApiError } from "../types";
import type { Role, Session, SessionSummary } from "../types";
import { mockScript } from "./fixtures";

// In-memory stand-in for the api, enabled with VITE_API_MOCK=1. State resets on page reload.
const sessions = new Map<string, Session & { started_at: string }>();
let nextSession = 1;
let nextVisitNo = 1;

const allocateVisitNo = () => `SIM-${String(nextVisitNo++).padStart(6, "0")}`;
const get = (id: string) => {
  const s = sessions.get(id);
  if (!s) throw new ApiError(404, "session_not_found", "找不到這個 session");
  return s;
};
const delay = <T>(value: T) => new Promise<T>((resolve) => setTimeout(() => resolve(value), 150));

export const mockClient: ApiClient = {
  async createSession(createdBy) {
    const id = `mock-${nextSession++}`;
    const nurse = createdBy === "nurse";
    sessions.set(id, {
      session_id: id,
      status: nurse ? "in_progress" : "intake",
      visit_no: nurse ? allocateVisitNo() : null,
      segments: [],
      report: null,
      started_at: new Date().toISOString(),
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
        has_flags: false,
      }))
      .reverse();
    return delay(rows);
  },

  async getSession(sessionId) {
    return delay(structuredClone(get(sessionId)));
  },

  connect(sessionId: string, role: Role, handlers: RealtimeHandlers): RealtimeConnection {
    get(sessionId);
    const timers: ReturnType<typeof setTimeout>[] = [];
    let recording = false;
    return {
      send(message) {
        if (message.type === "recording.start" && !recording) {
          recording = true;
          handlers.onMessage({ type: "recording.state", recording: true, by: role });
          for (const step of mockScript) {
            // The patient connection never receives drafts (same rule the real api must enforce).
            if (step.nurseOnly && role === "patient") continue;
            timers.push(setTimeout(() => handlers.onMessage(step.message), step.delayMs));
          }
        }
        if (message.type === "recording.stop") {
          recording = false;
          handlers.onMessage({ type: "recording.state", recording: false, by: role });
        }
      },
      sendAudio() {},
      close() {
        timers.forEach(clearTimeout);
        handlers.onClose?.();
      },
    };
  },
};
