import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/api";
import { usePatientInputStore, VISIT_NO_PATTERN } from "./patientInput";

let store: ReturnType<typeof usePatientInputStore>;
beforeEach(() => {
  setActivePinia(createPinia());
  store = usePatientInputStore();
});

describe("patient intake store", () => {
  it("writes nothing until the first input, and cannot finish with no input", async () => {
    const before = (await api.listSessions()).length;
    expect(store.canFinish).toBe(false);
    await store.finish();
    expect(store.phase).toBe("intake");
    expect((await api.listSessions()).length).toBe(before);
  });

  it("text input, finish, then the api gives the 就診號 and the patient shows up as waiting", async () => {
    expect(await store.addText("  發燒、咳嗽  ")).toBe(true);
    expect(store.entries[0]).toMatchObject({ kind: "text", text: "發燒、咳嗽" });
    await store.finish();
    expect(store.phase).toBe("done");
    expect(store.visitNo).toMatch(VISIT_NO_PATTERN);
    const waiting = await api.listSessions({ visit_no: store.visitNo });
    expect(waiting).toHaveLength(1);
    expect(waiting[0].status).toBe("ready");
  });

  it("voice: records, then needs to be stopped before finishing", async () => {
    await store.toggleListening();
    expect(store.listening).toBe(true);
    expect(store.canFinish).toBe(false);
    await store.toggleListening();
    expect(store.listening).toBe(false);
    expect(store.entries[0].kind).toBe("voice");
    expect(store.canFinish).toBe(true);
  });

  it("keeps what the patient typed when sending fails", async () => {
    const spy = vi.spyOn(api, "addTextInput").mockRejectedValueOnce(new Error("連線失敗"));
    expect(await store.addText("頭暈")).toBe(false); // caller leaves the text in the box
    expect(store.error).toBe("連線失敗");
    expect(store.entries).toHaveLength(0);
    spy.mockRestore();
    expect(await store.addText("頭暈")).toBe(true);
  });

  it("clears everything for the next patient", async () => {
    await store.addText("胸悶");
    await store.finish();
    store.reset();
    expect(store.phase).toBe("intake");
    expect(store.entries).toHaveLength(0);
    expect(store.visitNo).toBe("");
  });

  it("a patient recording never brings back nurse lines or drafts", async () => {
    await store.toggleListening(); // creates the session and starts the simulated transcription
    await new Promise((r) => setTimeout(r, 3500));
    await store.toggleListening();
    await store.finish();
    const [row] = await api.listSessions({ visit_no: store.visitNo });
    const session = await api.getSession(row.session_id);
    expect(session.segments.length).toBeGreaterThan(0);
    expect(session.segments.every((s) => s.speaker === "patient" && s.source === "patient_input")).toBe(true);
    expect(Object.values(session.fields).every((f) => f.status === "未提及")).toBe(true);
    expect(session.flags).toHaveLength(0);
  });
});
