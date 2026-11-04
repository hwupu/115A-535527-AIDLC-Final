import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { api } from "@/api";
import type { RealtimeConnection } from "@/api";
import { useRecorder } from "@/composables/useRecorder";

export interface PatientEntry {
  id: number;
  kind: "text" | "voice";
  text: string; // typed text, or a label for a voice recording
  at: string; // ISO time
}

// 就診號 is assigned by the system (api) when the intake is finished, never typed by the patient.
// It is a simulated number (format SIM-######), not a real hospital number.
export const VISIT_NO_PATTERN = /^SIM-\d{6}$/;

const message = (e: unknown, fallback: string) => (e instanceof Error ? e.message : fallback);

// The patient only adds input. The connection is used to send audio and the recording state; anything the server
// sends back (transcript, drafts) is ignored here, and the api must not send drafts or flags to this role anyway.
export const usePatientInputStore = defineStore("patientInput", () => {
  const phase = ref<"intake" | "done">("intake");
  const entries = ref<PatientEntry[]>([]);
  const listening = ref(false);
  const visitNo = ref("");
  const busy = ref(false);
  const error = ref("");
  const offline = ref(false);
  const recorder = useRecorder();
  let sessionId: string | null = null;
  let conn: RealtimeConnection | null = null;
  let listeningSince = 0;

  const canFinish = computed(() => entries.value.length > 0 && !listening.value && !busy.value);

  // The session is created lazily on the first input, so opening the screen writes nothing.
  async function ensureSession() {
    if (!sessionId) sessionId = (await api.createSession("patient")).session_id;
    return sessionId;
  }

  function ensureConnection(id: string) {
    conn ??= api.connect(id, "patient", {
      onMessage: () => (offline.value = false),
      onClose: () => {
        offline.value = true;
        conn = null;
      },
    });
    return conn;
  }

  function push(kind: PatientEntry["kind"], text: string) {
    entries.value.push({ id: Date.now() + entries.value.length, kind, text, at: new Date().toISOString() });
  }

  // Returns true when the text was accepted, so the caller can clear the text box. On failure the text stays in the box.
  async function addText(text: string): Promise<boolean> {
    const t = text.trim();
    if (!t) return false;
    busy.value = true;
    error.value = "";
    try {
      await api.addTextInput(await ensureSession(), t, "patient");
      push("text", t);
      return true;
    } catch (e) {
      error.value = message(e, "送出失敗，內容還在，請再試一次");
      return false;
    } finally {
      busy.value = false;
    }
  }

  async function toggleListening() {
    if (listening.value) {
      recorder.stop();
      conn?.send({ type: "recording.stop" });
      listening.value = false;
      const seconds = Math.max(1, Math.round((Date.now() - listeningSince) / 1000));
      push("voice", `語音輸入（${seconds} 秒）`);
      return;
    }
    error.value = "";
    try {
      const c = ensureConnection(await ensureSession());
      await recorder.start((chunk) => c.sendAudio(chunk));
      if (recorder.state.value !== "recording") {
        error.value =
          recorder.state.value === "denied"
            ? "無法使用麥克風：請允許瀏覽器使用麥克風，或改用文字輸入。"
            : recorder.error.value || "無法使用麥克風，請改用文字輸入。";
        return;
      }
      c.send({ type: "recording.start" });
      listeningSince = Date.now();
      listening.value = true;
    } catch (e) {
      error.value = message(e, "無法開始錄音，請改用文字輸入");
    }
  }

  async function finish() {
    if (!canFinish.value || !sessionId) return;
    busy.value = true;
    error.value = "";
    try {
      visitNo.value = (await api.finishIntake(sessionId)).visit_no;
      conn?.close();
      conn = null;
      phase.value = "done";
    } catch (e) {
      error.value = message(e, "無法完成，內容還在，請再試一次");
    } finally {
      busy.value = false;
    }
  }

  function reset() {
    recorder.stop();
    conn?.close();
    conn = null;
    phase.value = "intake";
    entries.value = [];
    listening.value = false;
    visitNo.value = "";
    error.value = "";
    offline.value = false;
    sessionId = null;
  }

  return { phase, entries, listening, visitNo, busy, error, offline, level: recorder.level, canFinish, addText, toggleListening, finish, reset };
});
