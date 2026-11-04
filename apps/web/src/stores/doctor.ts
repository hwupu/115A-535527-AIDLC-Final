import { defineStore } from "pinia";
import { ref } from "vue";
import { api, ApiError } from "@/api";
import type { ConfirmedReport, SessionSummary } from "@/api";

export type ReportState = "idle" | "loading" | "waiting" | "ready" | "error";

// The physician only reads. This store has no write path to the api at all.
export const useDoctorStore = defineStore("doctor", () => {
  // Kept across screens so going back to the list shows it instantly (and keeps the scroll position).
  const sessions = ref<SessionSummary[]>([]);
  const listError = ref("");
  const report = ref<ConfirmedReport | null>(null);
  const reportState = ref<ReportState>("idle");
  const reportError = ref("");

  async function refreshList() {
    try {
      const rows = await api.listSessions({ status: ["ready", "in_progress", "confirmed"] });
      // Newest first; the previous list stays on screen until the new one arrives (no flicker).
      sessions.value = [...rows].sort((a, b) => b.started_at.localeCompare(a.started_at));
      listError.value = "";
    } catch (e) {
      listError.value = e instanceof Error ? e.message : "無法取得清單";
    }
  }

  // 409 not_confirmed is normal while the nurse is still working: show "尚未確認" and keep polling.
  async function loadReport(id: string) {
    if (reportState.value === "idle" || report.value?.session_id !== id) {
      report.value = null;
      reportState.value = "loading";
    }
    try {
      report.value = await api.getReport(id);
      reportState.value = "ready";
      reportError.value = "";
    } catch (e) {
      if (e instanceof ApiError && e.code === "not_confirmed") reportState.value = "waiting";
      else {
        reportState.value = "error";
        reportError.value = e instanceof Error ? e.message : "無法取得報告";
      }
    }
  }

  function closeReport() {
    report.value = null;
    reportState.value = "idle";
  }

  return { sessions, listError, report, reportState, reportError, refreshList, loadReport, closeReport };
});
