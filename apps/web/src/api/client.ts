import { ApiError } from "./types";
import type {
  ClientMessage,
  ConfirmedReport,
  Run,
  RunEvent,
  RunEventType,
  Scenario,
  Field,
  FieldValue,
  Role,
  ServerMessage,
  Session,
  SessionStatus,
  SessionSummary,
  TriageLevel,
} from "./types";

export interface RealtimeConnection {
  send(message: ClientMessage): void;
  sendAudio(chunk: Blob): void;
  close(): void;
}

export interface RealtimeHandlers {
  onMessage(message: ServerMessage): void;
  onClose?(): void;
}

// The one interface the UI depends on. `http.ts` talks to the real api; `mock/` is an in-memory stand-in.
export interface ApiClient extends EvaluationApi {
  createSession(createdBy: Role): Promise<{ session_id: string; status: SessionStatus; visit_no: string | null }>;
  addTextInput(sessionId: string, text: string, as: Role): Promise<{ input_id: string }>;
  finishIntake(sessionId: string): Promise<{ visit_no: string }>;
  listSessions(query?: { status?: SessionStatus[]; visit_no?: string }): Promise<SessionSummary[]>;
  getSession(sessionId: string): Promise<Session>;
  /** Physician view. Fails with 409 `not_confirmed` until the nurse has saved the report. */
  getReport(sessionId: string): Promise<ConfirmedReport>;
  /** Nurse takes a `ready` session (ready → in_progress). Idempotent for the same session. */
  claimSession(sessionId: string): Promise<{ status: SessionStatus; visit_no: string }>;
  /** Edit a field (`value`) or confirm the AI draft as it is (`confirm`). Both are audited by the api. */
  patchField(sessionId: string, path: string, change: { value: FieldValue } | { confirm: true }): Promise<Field>;
  /** Save the report. `triage_level` is the nurse's own entry. Fails with 409 `drafts_unconfirmed` while any AI 草稿 remains. */
  confirmSession(sessionId: string, body: { triage_level: TriageLevel }): Promise<{ confirmed_at: string }>;
  connect(sessionId: string, role: Role, handlers: RealtimeHandlers): RealtimeConnection;
}

/** Evaluation mode. The real api returns 404 for all of these when EVAL_MODE is off. */
export interface EvaluationApi {
  listScenarios(): Promise<Scenario[]>;
  createRun(body: { scenario_id: string; participant_code: string }): Promise<Run>;
  startRun(runId: string): Promise<Run>;
  finishRun(runId: string): Promise<Run>;
  listRuns(): Promise<Run[]>;
  listRunEvents(runId: string): Promise<RunEvent[]>;
  addRunEvent(runId: string, body: { type: RunEventType; payload?: Record<string, unknown> }): Promise<RunEvent>;
  exportRun(runId: string, format: "json" | "csv"): Promise<string>;
}

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new ApiError(res.status, body?.error?.code ?? "unknown", body?.error?.message ?? `請求失敗（${res.status}）`);
  }
  return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
}
