import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it } from "vitest";
import { api } from "@/api";
import type { ServerMessage } from "@/api";
import { useNurseSessionStore } from "./nurseSession";

const draft = (path: string, value: unknown): ServerMessage => ({
  type: "field.update", path, value, status: "AI 草稿", source_span: "原文", source: "ai",
});

let store: ReturnType<typeof useNurseSessionStore>;
beforeEach(async () => {
  setActivePinia(createPinia());
  store = useNurseSessionStore();
  await store.startNew();
});

describe("nurse session store", () => {
  it("starts empty: every field 未提及 and no triage level", () => {
    expect(store.active).toBe(true);
    expect(store.visitNo).toMatch(/^SIM-\d{6}$/);
    expect(Object.values(store.fields).every((f) => f.status === "未提及")).toBe(true);
    expect(store.triageLevel).toBeNull();
  });

  it("marks AI updates as AI 草稿 and never lets the server set the triage level", () => {
    store.applyServerMessage(draft("chief_complaint", "發燒"));
    expect(store.fields.chief_complaint.status).toBe("AI 草稿");
    store.applyServerMessage({ type: "flags.update", flags: [{ text: "血氧 93%", basis: "x" }] });
    expect(store.triageLevel).toBeNull();
  });

  it("does not let an AI update overwrite a nurse edit", async () => {
    await store.editField("chief_complaint", "呼吸喘");
    store.applyServerMessage(draft("chief_complaint", "發燒"));
    expect(store.fields.chief_complaint).toMatchObject({ value: "呼吸喘", status: "護理師已確認", source: "nurse_edit" });
  });

  it("confirming a draft keeps the AI value and marks it 護理師已確認", async () => {
    store.applyServerMessage(draft("tocc.travel", "無"));
    await store.confirmField("tocc.travel");
    expect(store.fields["tocc.travel"]).toMatchObject({ value: "無", status: "護理師已確認", source: "ai" });
  });

  it("clearing a field sends it back to 未提及", async () => {
    await store.editField("chief_complaint", "發燒");
    await store.editField("chief_complaint", "");
    expect(store.fields.chief_complaint).toMatchObject({ value: null, status: "未提及" });
  });

  it("blocks saving until drafts are handled and a level is entered", async () => {
    store.applyServerMessage(draft("chief_complaint", "發燒"));
    expect(store.canConfirm).toBe(false);
    expect(store.blockers).toHaveLength(2);
    await store.confirmField("chief_complaint");
    expect(store.blockers).toEqual(["尚未輸入檢傷級數"]);
    store.setTriageLevel(3);
    expect(store.canConfirm).toBe(true);
    expect(await store.confirmSession()).toBe(true);
    expect(store.confirmed).toBe(true);
  });

  it("refuses to confirm without a level even if the api would accept", async () => {
    expect(await store.confirmSession()).toBe(false);
    expect(store.status).toBe("in_progress");
  });

  it("is read-only after confirmation", async () => {
    store.setTriageLevel(2);
    await store.confirmSession();
    store.setTriageLevel(5);
    await store.editField("chief_complaint", "改了");
    expect(store.triageLevel).toBe(2);
    expect(store.fields.chief_complaint.value).toBeNull();
  });

  it("opens a patient who finished intake by 就診號 and takes the session", async () => {
    const { session_id } = await api.createSession("patient");
    await api.addTextInput(session_id, "發燒、咳嗽", "patient");
    const { visit_no } = await api.finishIntake(session_id);
    expect(await store.openByVisitNo(visit_no.toLowerCase())).toBe(true);
    expect(store.status).toBe("in_progress");
    expect(store.segments[0]).toMatchObject({ speaker: "patient", source: "patient_input" });
  });

  it("reports an unknown 就診號", async () => {
    expect(await store.openByVisitNo("SIM-999999")).toBe(false);
    expect(store.error).toBe("找不到這個就診號");
  });

  it("only records after the patient consents", () => {
    store.startRecording();
    expect(store.recording).toBe(false);
    store.setConsent("yes");
    store.startRecording();
    expect(store.recording).toBe(true);
  });
});

describe("mock api rules the real api must also follow", () => {
  it("rejects confirm while an AI draft remains", async () => {
    const { session_id } = await api.createSession("nurse");
    const seen: string[] = [];
    const conn = api.connect(session_id, "nurse", { onMessage: (m) => seen.push(m.type) });
    conn.send({ type: "recording.start" });
    await new Promise((r) => setTimeout(r, 2300)); // first scripted draft arrives at ~1.9 s
    expect(seen).toContain("field.update");
    await expect(api.confirmSession(session_id, { triage_level: 3 })).rejects.toMatchObject({ status: 409, code: "drafts_unconfirmed" });
    conn.close();
  });

  it("never sends drafts or flags to the patient connection", async () => {
    const { session_id } = await api.createSession("patient");
    const seen: string[] = [];
    const conn = api.connect(session_id, "patient", { onMessage: (m) => seen.push(m.type) });
    conn.send({ type: "recording.start" });
    await new Promise((r) => setTimeout(r, 3500));
    conn.close();
    expect(seen).toContain("transcript.segment");
    expect(seen).not.toContain("field.update");
    expect(seen).not.toContain("flags.update");
  });
});
