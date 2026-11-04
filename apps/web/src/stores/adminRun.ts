import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { api, ApiError } from "@/api";
import type { Run, RunEvent, RunEventType, Scenario } from "@/api";

// Participant codes are anonymous (for example N-01), never a name.
export const PARTICIPANT_CODE_PATTERN = /^N-\d{2}$/;

const message = (e: unknown, fallback: string) =>
  e instanceof ApiError && e.status === 404 && e.code === "unknown" ? "評估模式未啟用（EVAL_MODE 關閉）" : e instanceof Error ? e.message : fallback;

// Evaluation mode state. Controls here never touch the nurse's report: they only start, stop and annotate a run.
export const useAdminRunStore = defineStore("adminRun", () => {
  const scenarios = ref<Scenario[]>([]);
  const runs = ref<Run[]>([]);
  const run = ref<Run | null>(null);
  const events = ref<RunEvent[]>([]);
  const error = ref("");
  const busy = ref(false);

  const state = computed<"none" | "ready" | "running" | "finished">(() =>
    !run.value ? "none" : run.value.finished_at ? "finished" : run.value.started_at ? "running" : "ready",
  );

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

  async function init() {
    scenarios.value = (await guard(() => api.listScenarios(), "無法取得情境")) ?? scenarios.value;
    runs.value = (await guard(() => api.listRuns(), "無法取得歷史執行")) ?? runs.value;
  }

  async function createRun(scenarioId: string, participantCode: string): Promise<boolean> {
    if (!PARTICIPANT_CODE_PATTERN.test(participantCode)) {
      error.value = "受試者代碼格式為 N- 加兩位數字，例如 N-01（不要用姓名）";
      return false;
    }
    const created = await guard(() => api.createRun({ scenario_id: scenarioId, participant_code: participantCode }), "無法建立執行");
    if (!created) return false;
    run.value = created;
    events.value = [];
    runs.value = [created, ...runs.value];
    return true;
  }

  const sync = (r: Run) => {
    run.value = r;
    runs.value = runs.value.map((x) => (x.run_id === r.run_id ? r : x));
  };

  async function start() {
    if (state.value !== "ready" || !run.value) return;
    const id = run.value.run_id;
    const r = await guard(() => api.startRun(id), "無法開始");
    if (r) sync(r);
    await refreshEvents();
  }

  async function finish() {
    if (state.value !== "running" || !run.value) return;
    const id = run.value.run_id;
    const r = await guard(() => api.finishRun(id), "無法結束");
    if (r) sync(r);
    await refreshEvents();
  }

  async function refreshEvents() {
    if (!run.value) return;
    try {
      events.value = await api.listRunEvents(run.value.run_id);
    } catch (e) {
      error.value = message(e, "無法取得事件紀錄");
    }
  }

  async function addEvent(type: RunEventType, payload?: Record<string, unknown>) {
    if (!run.value || state.value === "none") return;
    const id = run.value.run_id;
    await guard(() => api.addRunEvent(id, { type, payload }), "無法記錄事件");
    await refreshEvents();
  }

  async function exportRun(runId: string, format: "json" | "csv"): Promise<string | undefined> {
    return guard(() => api.exportRun(runId, format), "無法匯出");
  }

  function select(r: Run) {
    run.value = r;
    events.value = [];
    refreshEvents();
  }

  function leave() {
    run.value = null;
    events.value = [];
  }

  return { scenarios, runs, run, events, error, busy, state, init, createRun, start, finish, refreshEvents, addEvent, exportRun, select, leave };
});
