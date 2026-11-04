import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { api } from "@/api";
import type {
  FieldValue,
  Flag,
  RealtimeConnection,
  ReportFields,
  ServerMessage,
  SessionStatus,
  TranscriptSegment,
  TriageLevel,
} from "@/api";
import { emptyFields, fieldDefByPath, fieldDefs, reportToText } from "@/report/schema";

export type Consent = "unknown" | "yes" | "no";
export interface Connection {
  ws: "idle" | "open" | "closed";
  stt: "ok" | "down";
  llm: "ok" | "slow" | "down";
}

const message = (e: unknown, fallback: string) => (e instanceof Error ? e.message : fallback);

// State of the nurse's working session. Server events and the nurse's edits both land here.
// Safety rules enforced in this store (and covered by tests):
//  - `triageLevel` is only ever written by `setTriageLevel`, which the nurse's buttons call; no server message touches it;
//  - an AI update never overwrites a field the nurse has edited or confirmed;
//  - the report cannot be saved while any field is still an AI 草稿, or while no level has been entered.
export const useNurseSessionStore = defineStore("nurseSession", () => {
  const sessionId = ref<string | null>(null);
  const visitNo = ref<string | null>(null);
  const status = ref<SessionStatus | null>(null);
  const segments = ref<TranscriptSegment[]>([]);
  const fields = ref<ReportFields>(emptyFields());
  const flags = ref<Flag[]>([]);
  const triageLevel = ref<TriageLevel | null>(null);
  const consent = ref<Consent>("unknown");
  const recording = ref(false);
  const connection = ref<Connection>({ ws: "idle", stt: "ok", llm: "ok" });
  const selectedPath = ref<string | null>(null);
  const confirmedAt = ref<string | null>(null);
  const busy = ref(false);
  const error = ref("");
  let conn: RealtimeConnection | null = null;

  const active = computed(() => sessionId.value !== null);
  const confirmed = computed(() => status.value === "confirmed");
  const drafts = computed(() => fieldDefs.filter((d) => fields.value[d.path]?.status === "AI 草稿"));
  const blockers = computed(() => {
    const reasons: string[] = [];
    if (drafts.value.length) reasons.push(`還有 ${drafts.value.length} 項 AI 草稿未確認`);
    if (triageLevel.value === null) reasons.push("尚未輸入檢傷級數");
    return reasons;
  });
  const canConfirm = computed(() => active.value && !confirmed.value && blockers.value.length === 0);
  // The sentence the selected field came from (used to highlight it in the transcript).
  const highlight = computed(() => (selectedPath.value ? fields.value[selectedPath.value]?.source_span ?? null : null));
  const reportText = computed(() =>
    reportToText(fields.value, { visitNo: visitNo.value, triageLevel: triageLevel.value, flags: flags.value }),
  );

  function applyServerMessage(m: ServerMessage) {
    switch (m.type) {
      case "transcript.segment": {
        const { type: _t, ...seg } = m;
        const i = segments.value.findIndex((s) => s.segment_id === seg.segment_id);
        if (i >= 0) segments.value[i] = seg;
        else segments.value.push(seg);
        break;
      }
      case "field.update": {
        const current = fields.value[m.path];
        if (!current || current.status === "護理師已確認") break; // never overwrite the nurse
        fields.value[m.path] = { value: m.value as FieldValue, status: m.status, source_span: m.source_span, source: m.source };
        break;
      }
      case "flags.update":
        flags.value = m.flags;
        break;
      case "recording.state":
        if (m.by === "nurse") recording.value = m.recording;
        break;
      case "status":
        connection.value = { ...connection.value, stt: m.stt, llm: m.llm };
        break;
      case "error":
        error.value = m.message;
        break;
    }
  }

  function reset() {
    conn?.close();
    conn = null;
    sessionId.value = null;
    visitNo.value = null;
    status.value = null;
    segments.value = [];
    fields.value = emptyFields();
    flags.value = [];
    triageLevel.value = null;
    consent.value = "unknown";
    recording.value = false;
    connection.value = { ws: "idle", stt: "ok", llm: "ok" };
    selectedPath.value = null;
    confirmedAt.value = null;
    error.value = "";
  }

  function connect(id: string) {
    conn = api.connect(id, "nurse", {
      onMessage: (m) => {
        connection.value = { ...connection.value, ws: "open" };
        applyServerMessage(m);
      },
      onClose: () => (connection.value = { ...connection.value, ws: "closed" }),
    });
  }

  async function load(id: string) {
    const s = await api.getSession(id);
    sessionId.value = s.session_id;
    visitNo.value = s.visit_no;
    status.value = s.status;
    segments.value = s.segments;
    fields.value = { ...emptyFields(), ...s.fields };
    flags.value = s.flags;
    confirmedAt.value = s.confirmed_at ?? null;
    triageLevel.value = s.triage_level ?? null; // only present once the nurse has saved it
    connect(id);
  }

  async function guard<T>(fn: () => Promise<T>, fallback: string): Promise<T | undefined> {
    busy.value = true;
    error.value = "";
    try {
      return await fn();
    } catch (e) {
      error.value = message(e, fallback);
    } finally {
      busy.value = false;
    }
  }

  async function startNew() {
    reset();
    await guard(async () => {
      await load((await api.createSession("nurse")).session_id);
    }, "無法開始新的問診");
  }

  // `ready` sessions are claimed first (ready → in_progress); in_progress and confirmed ones just open.
  async function open(id: string) {
    reset();
    await guard(async () => {
      await api.claimSession(id);
      await load(id);
    }, "無法開啟這位病患");
  }

  async function openByVisitNo(no: string): Promise<boolean> {
    const [match] = (await guard(() => api.listSessions({ visit_no: no.trim().toUpperCase() }), "查詢失敗")) ?? [];
    if (!match) {
      if (!error.value) error.value = "找不到這個就診號";
      return false;
    }
    await open(match.session_id);
    return active.value;
  }

  function leave() {
    reset();
  }

  function setConsent(value: Consent) {
    consent.value = value;
  }

  // Recording is allowed only after the patient consented. Audio itself is handled by the recorder (C2).
  function startRecording() {
    if (consent.value !== "yes") return;
    conn?.send({ type: "recording.start" });
    recording.value = true;
  }
  function stopRecording() {
    conn?.send({ type: "recording.stop" });
    recording.value = false;
  }

  const sendAudio = (chunk: Blob) => conn?.sendAudio(chunk);

  function selectField(path: string | null) {
    selectedPath.value = path;
  }

  // Applies locally first so the form feels instant; rolls back when the api rejects it.
  async function mutateField(path: string, next: ReportFields[string], request: () => Promise<unknown>) {
    const before = fields.value[path];
    fields.value[path] = next;
    try {
      await request();
    } catch (e) {
      fields.value[path] = before;
      error.value = message(e, "儲存失敗，請再試一次");
    }
  }

  async function editField(path: string, value: FieldValue) {
    if (!fieldDefByPath(path) || !sessionId.value || confirmed.value) return;
    const empty = value === null || value === "" || (Array.isArray(value) && value.length === 0);
    const id = sessionId.value;
    // Clearing a field sends it back to 未提及 (nothing is invented); anything else becomes the nurse's confirmed value.
    const next = empty
      ? { value: null, status: "未提及" as const, source_span: null, source: "nurse_edit" as const }
      : { value, status: "護理師已確認" as const, source_span: null, source: "nurse_edit" as const };
    await mutateField(path, next, () => api.patchField(id, path, { value }));
  }

  async function confirmField(path: string) {
    const current = fields.value[path];
    if (!sessionId.value || confirmed.value || current?.status !== "AI 草稿") return;
    const id = sessionId.value;
    await mutateField(path, { ...current, status: "護理師已確認" }, () => api.patchField(id, path, { confirm: true }));
  }

  async function addNurseText(text: string): Promise<boolean> {
    const t = text.trim();
    if (!t || !sessionId.value) return false;
    const id = sessionId.value;
    return (await guard(async () => {
      await api.addTextInput(id, t, "nurse");
      segments.value.push({ segment_id: `local-${Date.now()}`, speaker: "nurse", text: t, start: 0, end: 0, final: true });
      return true;
    }, "送出失敗")) ?? false;
  }

  // The only writer of the triage level: called by the nurse's own buttons, never from server data.
  function setTriageLevel(level: TriageLevel | null) {
    if (!confirmed.value) triageLevel.value = level;
  }

  async function confirmSession(): Promise<boolean> {
    if (!canConfirm.value || !sessionId.value || triageLevel.value === null) return false;
    const id = sessionId.value;
    const level = triageLevel.value;
    const res = await guard(() => api.confirmSession(id, { triage_level: level }), "無法儲存報告");
    if (!res) return false;
    status.value = "confirmed";
    confirmedAt.value = res.confirmed_at;
    return true;
  }

  return {
    sessionId, visitNo, status, segments, fields, flags, triageLevel, consent, recording, connection, selectedPath,
    confirmedAt, busy, error,
    active, confirmed, drafts, blockers, canConfirm, highlight, reportText,
    applyServerMessage, startNew, open, openByVisitNo, leave, setConsent, startRecording, stopRecording, sendAudio, selectField,
    editField, confirmField, addNurseText, setTriageLevel, confirmSession,
  };
});
