// @vitest-environment happy-dom
import { flushPromises, mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import NurseSession from "./NurseSession.vue";
import { shortcutHandler } from "@/composables/useShortcuts";
import { fieldDefs } from "@/report/schema";
import { useNurseSessionStore } from "@/stores/nurseSession";

const recorder = vi.hoisted(() => ({ start: vi.fn(), stop: vi.fn() }));
vi.mock("@/composables/useRecorder", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/composables/useRecorder")>();
  const { ref } = await import("vue");
  return {
    ...actual,
    useRecorder: () => {
      const state = ref("idle");
      return {
        state, level: ref(0), error: ref(""),
        start: recorder.start.mockImplementation(async () => { state.value = "recording"; }),
        stop: recorder.stop.mockImplementation(() => { state.value = "idle"; }),
      };
    },
  };
});

const press = async (key: string, target: EventTarget = document.body, init: KeyboardEventInit = {}) => {
  target.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true, ...init }));
  await flushPromises();
};

describe("shortcut handler", () => {
  const run = vi.fn();
  const handler = shortcutHandler(() => ({ " ": run, Enter: run }));
  const fire = (key: string, target: HTMLElement, init: KeyboardEventInit = {}) => {
    const e = new KeyboardEvent("keydown", { key, cancelable: true, ...init });
    Object.defineProperty(e, "target", { value: target });
    handler(e);
    return e;
  };
  beforeEach(() => run.mockReset());

  it("never fires while typing, while the IME is composing, or with Ctrl/Cmd", () => {
    for (const tag of ["input", "textarea", "select"]) fire(" ", document.createElement(tag));
    fire(" ", document.body, { isComposing: true });
    fire(" ", document.body, { metaKey: true });
    expect(run).not.toHaveBeenCalled();
  });

  it("Space wins over a focused button, but Enter still presses it; holding Space does nothing", () => {
    const button = document.createElement("button");
    expect(fire(" ", button).defaultPrevented).toBe(true);
    expect(run).toHaveBeenCalledTimes(1);
    expect(fire("Enter", button).defaultPrevented).toBe(false);
    fire(" ", document.body, { repeat: true });
    expect(run).toHaveBeenCalledTimes(1);
  });
});

describe("nurse screen keyboard (#28)", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    recorder.start.mockReset();
    recorder.stop.mockReset();
  });

  async function screen() {
    const store = useNurseSessionStore();
    await store.startNew();
    const wrapper = mount(NurseSession, { attachTo: document.body });
    return { store, wrapper };
  }

  it("Space records only after consent, and stops again", async () => {
    const { store, wrapper } = await screen();
    await press(" ");
    expect(recorder.start).not.toHaveBeenCalled();
    await wrapper.findAll("button").find((b) => b.text().includes("同意，可以錄音"))!.trigger("click");
    await press(" ");
    expect(store.recording).toBe(true);
    await press(" ");
    expect(store.recording).toBe(false);
    wrapper.unmount();
  });

  it("Space typed into the note box is just a space", async () => {
    const { store, wrapper } = await screen();
    await wrapper.findAll("button").find((b) => b.text().includes("同意，可以錄音"))!.trigger("click");
    await press(" ", wrapper.find('input[aria-label="補充文字"]').element);
    expect(store.recording).toBe(false);
    wrapper.unmount();
  });

  it("↑ ↓ move between fields, N finds the next draft, Enter confirms it, E opens the editor", async () => {
    const { store, wrapper } = await screen();
    await press("ArrowDown");
    expect(store.selectedPath).toBe(fieldDefs[0].path);
    await press("ArrowDown");
    expect(store.selectedPath).toBe(fieldDefs[1].path);
    await press("ArrowUp");
    expect(store.selectedPath).toBe(fieldDefs[0].path);

    store.applyServerMessage({ type: "field.update", path: "tocc.travel", value: "無", status: "AI 草稿", source_span: "沒有出國", source: "ai" });
    await press("n");
    expect(store.selectedPath).toBe("tocc.travel");
    await press("Enter");
    expect(store.fields["tocc.travel"].status).toBe("護理師已確認");

    await press("e");
    expect(wrapper.find('[id="field-tocc.travel"]').text()).toContain("取消");
    wrapper.unmount();
  });

  it("there is no key for the 檢傷級數", async () => {
    const { store, wrapper } = await screen();
    for (const k of ["1", "2", "3", "4", "5"]) await press(k);
    expect(store.triageLevel).toBeNull();
    wrapper.unmount();
  });

  it("? shows the list of shortcuts and Esc hides it", async () => {
    const { wrapper } = await screen();
    await press("?");
    expect(document.body.textContent).toContain("跳到下一個未確認的 AI 草稿");
    await press("Escape");
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false);
    wrapper.unmount();
  });
});
