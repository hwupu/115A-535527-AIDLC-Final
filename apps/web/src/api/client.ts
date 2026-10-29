import { ApiError } from "./types";
import type { ClientMessage, Role, ServerMessage, Session, SessionStatus, SessionSummary } from "./types";

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
export interface ApiClient {
  createSession(createdBy: Role): Promise<{ session_id: string; status: SessionStatus; visit_no: string | null }>;
  addTextInput(sessionId: string, text: string, as: Role): Promise<{ input_id: string }>;
  finishIntake(sessionId: string): Promise<{ visit_no: string }>;
  listSessions(query?: { status?: SessionStatus[]; visit_no?: string }): Promise<SessionSummary[]>;
  getSession(sessionId: string): Promise<Session>;
  connect(sessionId: string, role: Role, handlers: RealtimeHandlers): RealtimeConnection;
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
