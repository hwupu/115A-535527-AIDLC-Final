import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { api } from "@/api";

export interface PatientEntry {
  id: number;
  kind: "text" | "voice";
  text: string; // typed text, or a label for a voice recording
  at: string; // ISO time
}

// 就診號 is assigned by the system (api) when the intake is finished, never typed by the patient.
// It is a simulated number (format SIM-######), not a real hospital record number.
export const VISIT_NO_PATTERN = /^SIM-\d{6}$/;

export const usePatientInputStore = defineStore("patientInput", () => {
  const phase = ref<"intake" | "done">("intake");
  const entries = ref<PatientEntry[]>([]);
  const listening = ref(false);
  const visitNo = ref("");
  const busy = ref(false);
  const error = ref("");
  let sessionId: string | null = null;
  let listeningSince = 0;

  const canFinish = computed(() => entries.value.length > 0 && !listening.value && !busy.value);

  // The session is created lazily on the first input, so opening the screen writes nothing.
  async function ensureSession() {
    if (!sessionId) sessionId = (await api.createSession("patient")).session_id;
    return sessionId;
  }

  function push(kind: PatientEntry["kind"], text: string) {
    entries.value.push({ id: Date.now() + entries.value.length, kind, text, at: new Date().toISOString() });
  }

  // Returns true when the text was accepted, so the caller can clear the text box.
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
      error.value = e instanceof Error ? e.message : "送出失敗，請再試一次";
      return false;
    } finally {
      busy.value = false;
    }
  }

  // TODO(C2/C15): capture audio with the shared recorder and stream it over the WebSocket. For now only the
  // recording state and a label are kept.
  async function toggleListening() {
    if (!listening.value) {
      error.value = "";
      try {
        await ensureSession();
      } catch (e) {
        error.value = e instanceof Error ? e.message : "無法開始錄音";
        return;
      }
      listeningSince = Date.now();
      listening.value = true;
      return;
    }
    listening.value = false;
    const seconds = Math.max(1, Math.round((Date.now() - listeningSince) / 1000));
    push("voice", `語音輸入（${seconds} 秒）`);
  }

  async function finish() {
    if (!canFinish.value || !sessionId) return;
    busy.value = true;
    error.value = "";
    try {
      visitNo.value = (await api.finishIntake(sessionId)).visit_no;
      phase.value = "done";
    } catch (e) {
      error.value = e instanceof Error ? e.message : "無法完成，請再試一次";
    } finally {
      busy.value = false;
    }
  }

  function reset() {
    phase.value = "intake";
    entries.value = [];
    listening.value = false;
    visitNo.value = "";
    error.value = "";
    sessionId = null;
  }

  return { phase, entries, listening, visitNo, busy, error, canFinish, addText, toggleListening, finish, reset };
});
