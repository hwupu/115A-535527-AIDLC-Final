import { defineStore } from "pinia";
import { computed, ref } from "vue";

export interface PatientEntry {
  id: number;
  kind: "text" | "voice";
  text: string;
  at: string; // ISO time
}

// Simulated patient code only, e.g. P-0001. Never a real 身分證字號 or 病歷號.
export const PATIENT_ID_PATTERN = /^P-\d{4}$/;

export const usePatientInputStore = defineStore("patientInput", () => {
  const patientId = ref("");
  const entries = ref<PatientEntry[]>([]);
  const listening = ref(false);

  const hasPatient = computed(() => PATIENT_ID_PATTERN.test(patientId.value));

  function setPatientId(id: string) {
    patientId.value = id.trim().toUpperCase();
    entries.value = [];
    listening.value = false;
  }

  function addText(text: string) {
    const t = text.trim();
    if (!t || !hasPatient.value) return;
    entries.value.push({ id: Date.now(), kind: "text", text: t, at: new Date().toISOString() });
  }

  function toggleListening() {
    if (hasPatient.value) listening.value = !listening.value;
  }

  return { patientId, entries, listening, hasPatient, setPatientId, addText, toggleListening };
});
