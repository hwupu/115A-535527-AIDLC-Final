import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it } from "vitest";
import { api } from "@/api";
import { useAdminRunStore } from "./adminRun";

let store: ReturnType<typeof useAdminRunStore>;
beforeEach(async () => {
  setActivePinia(createPinia());
  store = useAdminRunStore();
  await store.init();
});

describe("evaluation mode (admin)", () => {
  it("lists the scenarios with their split", () => {
    expect(store.scenarios).toHaveLength(11);
    expect(store.scenarios.find((s) => s.id === "S03")).toMatchObject({ split: "dev", demo: true });
    expect(store.scenarios.find((s) => s.id === "S11")).toMatchObject({ split: "held_out" });
  });

  it("only accepts anonymous participant codes", async () => {
    expect(await store.createRun("S03", "王小明")).toBe(false);
    expect(store.error).toContain("N-01");
    expect(store.state).toBe("none");
  });

  it("times a run and logs what the nurse does in its session, but only while running", async () => {
    expect(await store.createRun("S03", "N-01")).toBe(true);
    expect(store.state).toBe("ready");
    const sessionId = store.run!.session_id;

    await api.patchField(sessionId, "chief_complaint", { value: "before start" }); // not started: not logged
    await store.start();
    expect(store.state).toBe("running");
    await api.patchField(sessionId, "chief_complaint", { value: "呼吸喘" });
    await api.confirmSession(sessionId, { triage_level: 3 });
    await store.addEvent("error_found");
    await store.addEvent("note", { text: "口罩影響辨識" });
    await store.finish();
    await api.patchField(sessionId, "tocc.travel", { value: "無" }); // finished: not logged

    expect(store.state).toBe("finished");
    expect(store.events.map((e) => e.type)).toEqual(["task_start", "field_edit", "level_entered", "error_found", "note", "task_end"]);
    expect(store.events[1].payload).toMatchObject({ path: "chief_complaint", kind: "edit", new_value: "呼吸喘" });
    expect(store.events[2].payload).toEqual({ triage_level: 3 });
  });

  it("exports JSON with the model versions and CSV with one row per event", async () => {
    await store.createRun("S01", "N-02");
    await store.start();
    await store.finish();
    const json = JSON.parse((await store.exportRun(store.run!.run_id, "json"))!);
    expect(json).toMatchObject({ model: expect.any(String), prompt_version: expect.any(String), whisper_model: expect.any(String), git_commit: expect.any(String) });
    expect(json.run.participant_code).toBe("N-02");
    const csv = (await store.exportRun(store.run!.run_id, "csv"))!.split("\n");
    expect(csv[0]).toBe("run_id,scenario_id,participant_code,at,type,payload");
    expect(csv).toHaveLength(3); // header + task_start + task_end
  });

  it("refuses to start twice or finish before starting", async () => {
    await store.createRun("S04", "N-03");
    await store.finish();
    expect(store.state).toBe("ready");
    await store.start();
    await expect(api.startRun(store.run!.run_id)).rejects.toMatchObject({ status: 409 });
  });
});
