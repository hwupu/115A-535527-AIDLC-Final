import { request } from "./client";
import type { ApiClient, RealtimeConnection, RealtimeHandlers } from "./client";
import type { Role } from "./types";

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
    return request(`/sessions?${params}`);
  },

  getSession: (sessionId) => request(`/sessions/${sessionId}`),

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
