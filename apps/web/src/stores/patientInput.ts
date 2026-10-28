import { defineStore } from "pinia";
import { computed, ref } from "vue";

export interface PatientEntry {
  id: number;
  kind: "text" | "voice";
  text: string; // typed text, or a label for a voice recording
  at: string; // ISO time
}

// 病歷號 is assigned by the system when the session is written to the database, never typed by the
// patient. It is a simulated number (format SIM-######), not a real hospital record number.
export const MEDICAL_RECORD_NO_PATTERN = /^SIM-\d{6}$/;

export const usePatientInputStore = defineStore("patientInput", () => {
  const phase = ref<"intake" | "done">("intake");
  const entries = ref<PatientEntry[]>([]);
  const listening = ref(false);
  const medicalRecordNo = ref("");
  let listeningSince = 0;

  const canFinish = computed(() => entries.value.length > 0 && !listening.value);

  function push(kind: PatientEntry["kind"], text: string) {
    entries.value.push({ id: Date.now() + entries.value.length, kind, text, at: new Date().toISOString() });
  }

  function addText(text: string) {
    const t = text.trim();
    if (t) push("text", t);
  }

  function toggleListening() {
    if (!listening.value) {
      listeningSince = Date.now();
      listening.value = true;
      return;
    }
    listening.value = false;
    const seconds = Math.max(1, Math.round((Date.now() - listeningSince) / 1000));
    push("voice", `語音輸入（${seconds} 秒）`);
  }

  // TODO(API): replace with POST /sessions/{id}/finish-intake, which returns the 病歷號 from the database.
  function finish() {
    if (!canFinish.value) return;
    medicalRecordNo.value = `SIM-${String(Math.floor(Math.random() * 1_000_000)).padStart(6, "0")}`;
    phase.value = "done";
  }

  function reset() {
    phase.value = "intake";
    entries.value = [];
    listening.value = false;
    medicalRecordNo.value = "";
  }

  return { phase, entries, listening, medicalRecordNo, canFinish, addText, toggleListening, finish, reset };
});
