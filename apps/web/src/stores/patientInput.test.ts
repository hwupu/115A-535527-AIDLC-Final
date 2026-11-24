import { existsSync, readFileSync } from "node:fs";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/api";
import { MOCK_TRANSCRIBE_MS } from "@/api/mock";
import { questions } from "@/intake/questions";
import { fieldDefByPath } from "@/report/schema";
import { usePatientInputStore, VISIT_NO_PATTERN } from "./patientInput";

// Store tests mock microphone hardware; the browser integration test covers actual MediaRecorder.
vi.mock("@/composables/useRecorder", async () => {
  const { ref } = await import("vue");
  return { useRecorder: () => {
    const state = ref("idle");
    return { state, level: ref(0), error: ref(""), start: async () => { state.value = "recording"; }, stop: () => { state.value = "idle"; } };
  } };
});

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
let store: ReturnType<typeof usePatientInputStore>;
beforeEach(() => {
  setActivePinia(createPinia());
  store = usePatientInputStore();
  store.start();
});

async function transcriptOf(visitNo: string) {
  const [row] = await api.listSessions({ visit_no: visitNo });
  return (await api.getSession(row.session_id)).segments;
}

describe("fixed question list", () => {
  it("every question maps to real report fields and has a current audio file", () => {
    const dir = new URL("../../public/audio/questions/", import.meta.url);
    const manifest = JSON.parse(readFileSync(new URL("manifest.json", dir), "utf8")).files as Record<string, string>;
    for (const q of questions) {
      for (const path of q.fields) expect(fieldDefByPath(path), path).toBeDefined();
      for (const s of [q, ...(q.followUp ? [q.followUp] : [])]) {
        expect(existsSync(new URL(`${s.id}.mp3`, dir)), `${s.id}.mp3`).toBe(true);
        expect(manifest[s.id], `${s.id} audio is stale: run scripts/make-question-audio.sh`).toBe(s.text);
      }
    }
  });
});

describe("patient intake, one question at a time", () => {
  it("writes nothing until the first answer, and cannot finish with no answer", async () => {
    const before = (await api.listSessions()).length;
    store.skip();
    expect(store.canFinish).toBe(false);
    await store.finish();
    expect(store.phase).toBe("questions");
    expect((await api.listSessions()).length).toBe(before);
  });

  it("saves each typed answer with its question, then the api gives the 就診號", async () => {
    await store.answerText("  肚子痛  ");
    expect(store.answer).toMatchObject({ kind: "text", text: "肚子痛", state: "sent" });
    store.next();
    expect(store.questionNo).toBe(2);
    await store.finish();
    expect(store.phase).toBe("done");
    expect(store.visitNo).toMatch(VISIT_NO_PATTERN);
    const segments = await transcriptOf(store.visitNo);
    expect(segments.map((s) => s.text)).toEqual([`問：${questions[0].text} 答：肚子痛`]);
    expect(segments[0]).toMatchObject({ speaker: "patient", source: "patient_input" });
    expect((await api.listSessions({ visit_no: store.visitNo }))[0].status).toBe("ready");
  });

  it("a short 「沒有」 is saved with the travel question", async () => {
    while (store.step.question.id !== "q04") store.skip();
    await store.answerChoice("沒有");
    store.next();
    expect(store.step.question.id).toBe("q05"); // no follow-up after 沒有
    await store.finish();
    expect((await transcriptOf(store.visitNo)).map((s) => s.text)).toEqual([`問：${questions[3].text} 答：沒有`]);
  });

  it("「有」 brings up the follow-up, which is saved with its main question", async () => {
    while (store.step.question.id !== "q04") store.skip();
    await store.answerChoice("有");
    store.next();
    expect(store.step.followUp?.id).toBe("q04f");
    expect(store.questionNo).toBe(4);
    await store.answerText("日本，上週回來");
    await store.finish();
    const lines = (await transcriptOf(store.visitNo)).map((s) => s.text);
    expect(lines[1]).toBe(`問：${questions[3].text}${questions[3].followUp!.text} 答：日本，上週回來`);
  });

  it("voice: the question goes in first, then the patient's own transcript is shown back", async () => {
    await store.toggleListening();
    expect(store.listening).toBe(true);
    expect(store.canFinish).toBe(false);
    await store.toggleListening();
    expect(store.answer).toMatchObject({ kind: "voice", state: "transcribing" });
    await wait(MOCK_TRANSCRIBE_MS + 300);
    expect(store.answer?.state).toBe("sent");
    expect(store.answer?.text).toBeTruthy();
    await store.finish();
    const segments = await transcriptOf(store.visitNo);
    expect(segments[0].text).toBe(`問：${questions[0].text}`);
    expect(segments[1].text).toBe(store.answers.q01.text);
    expect(segments.every((s) => s.speaker === "patient" && s.source === "patient_input")).toBe(true);
  });

  it("finishing waits for a recording that is still being transcribed", async () => {
    await store.toggleListening();
    await store.toggleListening();
    await store.finish(); // transcript arrives ~1 s later; finish must not close the intake before it
    expect(store.phase).toBe("done");
    expect(await transcriptOf(store.visitNo)).toHaveLength(2);
  });

  it("back and re-answer keep the earlier answer in the transcript and add the new one", async () => {
    await store.answerText("頭痛");
    store.next();
    store.back();
    expect(store.answer?.text).toBe("頭痛");
    store.reanswer();
    expect(store.answer).toBeUndefined();
    await store.answerText("頭暈");
    await store.finish();
    expect((await transcriptOf(store.visitNo)).map((s) => s.text)).toEqual([
      `問：${questions[0].text} 答：頭痛`,
      `問：${questions[0].text} 答：頭暈`,
    ]);
  });

  it("an answer that failed to send is kept and sent again on finish", async () => {
    const spy = vi.spyOn(api, "addTextInput").mockRejectedValueOnce(new Error("連線失敗"));
    await store.answerText("胸悶");
    expect(store.answer).toMatchObject({ text: "胸悶", state: "failed" });
    expect(store.error).toBe("連線失敗");
    spy.mockRestore();
    await store.finish();
    expect(store.phase).toBe("done");
    expect((await transcriptOf(store.visitNo)).map((s) => s.text)).toEqual([`問：${questions[0].text} 答：胸悶`]);
  });

  it("clears everything for the next patient", async () => {
    await store.answerText("胸悶");
    await store.finish();
    store.reset();
    expect(store.phase).toBe("intro");
    expect(store.answers).toEqual({});
    expect(store.stepIndex).toBe(0);
    expect(store.visitNo).toBe("");
  });

  it("a patient never gets drafts, flags or a triage level back", async () => {
    await store.toggleListening();
    await store.toggleListening();
    await wait(MOCK_TRANSCRIBE_MS + 300);
    await store.finish();
    const [row] = await api.listSessions({ visit_no: store.visitNo });
    const session = await api.getSession(row.session_id);
    expect(Object.values(session.fields).every((f) => f.status === "未提及")).toBe(true);
    expect(session.flags).toHaveLength(0);
    expect(Object.values(store.answers).every((a) => !("status" in a) && !("triage_level" in a))).toBe(true);
  });
});
