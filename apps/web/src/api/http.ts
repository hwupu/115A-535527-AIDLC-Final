import { request } from "./client";
import type { ApiClient, RealtimeConnection, RealtimeHandlers } from "./client";
import type { Role, SessionSummary } from "./types";

// Polling the list is cheap: send If-None-Match and reuse the last body on 304 (docs/frontend/API_INTERFACE.md §3).
const listCache = new Map<string, { etag: string; body: SessionSummary[] }>();

async function getList(path: string): Promise<SessionSummary[]> {
  const cached = listCache.get(path);
  const res = await fetch(`/api${path}`, { headers: cached ? { "If-None-Match": cached.etag } : {} });
  if (res.status === 304 && cached) return cached.body;
  if (!res.ok) return request(path); // throws the usual ApiError
  const body = (await res.json()) as SessionSummary[];
  const etag = res.headers.get("ETag");
  if (etag) listCache.set(path, { etag, body });
  return body;
}

export const httpClient: ApiClient = {
  createSession: (createdBy) =>
    request("/sessions", { method: "POST", body: JSON.stringify({ created_by: createdBy }) }),

  addTextInput: (sessionId, text, as) =>
    request(`/sessions/${sessionId}/inputs`, { method: "POST", body: JSON.stringify({ kind: "text", text, as }) }),

  finishIntake: (sessionId) => request(`/sessions/${sessionId}/finish-intake`, { method: "POST" }),

  listSessions: (query = {}) => {
    const params = new URLSearchParams();
    if (query.status?.length) params.set("status", query.status.join(","));
    if (query.visit_no) params.set("visit_no", query.visit_no);
    return getList(`/sessions?${params}`);
  },

  getSession: (sessionId) => request(`/sessions/${sessionId}`),

  getReport: (sessionId) => request(`/sessions/${sessionId}/report`),

  listScenarios: () => request("/scenarios"),
  createRun: (body) => request("/evaluation/runs", { method: "POST", body: JSON.stringify(body) }),
  startRun: (runId) => request(`/evaluation/runs/${runId}/start`, { method: "POST" }),
  finishRun: (runId) => request(`/evaluation/runs/${runId}/finish`, { method: "POST" }),
  listRuns: () => request("/evaluation/runs"),
  listRunEvents: (runId) => request(`/evaluation/runs/${runId}/events`),
  addRunEvent: (runId, body) => request(`/evaluation/runs/${runId}/events`, { method: "POST", body: JSON.stringify(body) }),
  exportRun: async (runId, format) => {
    const res = await fetch(`/api/evaluation/runs/${runId}/export?format=${format}`);
    if (!res.ok) return request(`/evaluation/runs/${runId}/export?format=${format}`); // throws the usual ApiError
    return res.text();
  },

  claimSession: (sessionId) => request(`/sessions/${sessionId}/claim`, { method: "POST" }),

  patchField: (sessionId, path, change) =>
    request(`/sessions/${sessionId}/fields`, { method: "PATCH", body: JSON.stringify({ path, ...change }) }),

  confirmSession: (sessionId, body) =>
    request(`/sessions/${sessionId}/confirm`, { method: "POST", body: JSON.stringify(body) }),

  connect(sessionId: string, role: Role, handlers: RealtimeHandlers): RealtimeConnection {
    const scheme = location.protocol === "https:" ? "wss" : "ws";
    const ws = new WebSocket(`${scheme}://${location.host}/api/sessions/${sessionId}/ws?role=${role}`);
    ws.onmessage = (e) => handlers.onMessage(JSON.parse(e.data));
    ws.onclose = () => handlers.onClose?.();
    return {
      send: (message) => ws.send(JSON.stringify(message)),
      sendAudio: (chunk) => ws.send(chunk),
      close: () => ws.close(),
    };
  },
};
