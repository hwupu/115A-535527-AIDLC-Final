// @vitest-environment happy-dom
import { flushPromises, mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import NurseSession from "./NurseSession.vue";
import { useNurseSessionStore } from "@/stores/nurseSession";

// The microphone is mocked here; useRecorder.test.ts covers the recorder itself.
const recorder = vi.hoisted(() => ({ start: vi.fn(), stop: vi.fn(), state: null as null | { value: string } }));
vi.mock("@/composables/useRecorder", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/composables/useRecorder")>();
  const { ref } = await import("vue");
  return {
    ...actual,
    useRecorder: () => {
      const state = ref("idle");
      recorder.state = state;
      return {
        state,
        level: ref(0),
        error: ref(""),
        start: recorder.start.mockImplementation(async () => { state.value = "recording"; }),
        stop: recorder.stop.mockImplementation(() => { state.value = "idle"; }),
      };
    },
  };
});

async function recordingScreen() {
  const store = useNurseSessionStore();
  await store.startNew();
  const wrapper = mount(NurseSession);
  await wrapper.findAll("button").find((b) => b.text().includes("同意，可以錄音"))!.trigger("click");
  await wrapper.findAll("button").find((b) => b.text().includes("開始錄音"))!.trigger("click");
  await flushPromises();
  return { store, wrapper };
}

describe("nurse screen and the microphone", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    recorder.start.mockReset();
    recorder.stop.mockReset();
  });

  it("starts recording only after consent and sends audio through the store", async () => {
    const { store } = await recordingScreen();
    expect(recorder.start).toHaveBeenCalledWith(store.sendAudio);
    expect(store.recording).toBe(true);
  });

  it("cancelling the permission prompt stops the recorder but tells the server nothing", async () => {
    const store = useNurseSessionStore();
    await store.startNew();
    const serverStop = vi.spyOn(store, "stopRecording");
    const wrapper = mount(NurseSession);
    await wrapper.findAll("button").find((b) => b.text().includes("同意，可以錄音"))!.trigger("click");
    recorder.start.mockImplementationOnce(() => {
      recorder.state!.value = "requesting";
      return new Promise(() => {}); // the prompt is never answered
    });
    await wrapper.findAll("button").find((b) => b.text().includes("開始錄音"))!.trigger("click");
    await wrapper.find('[data-test="cancel"]').trigger("click");
    expect(recorder.stop).toHaveBeenCalled();
    expect(serverStop).not.toHaveBeenCalled();
    expect(store.recording).toBe(false);
  });

  it("turns the microphone off when the nurse leaves the screen by any route", async () => {
    const { wrapper } = await recordingScreen();
    expect(recorder.stop).not.toHaveBeenCalled();
    wrapper.unmount();
    expect(recorder.stop).toHaveBeenCalled();
  });
});
