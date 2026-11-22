// @vitest-environment happy-dom
import { mount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import RecorderPanel from "./RecorderPanel.vue";
import { RECORDER_MESSAGES } from "@/composables/useRecorder";

const base = { state: "idle", level: 0, error: "" } as const;

describe("RecorderPanel", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("emits start and stop from one large button", async () => {
    const w = mount(RecorderPanel, { props: base });
    await w.find("button").trigger("click");
    expect(w.emitted("start")).toHaveLength(1);
    await w.setProps({ state: "recording" });
    expect(w.find("button").text()).toContain("停止錄音");
    await w.find("button").trigger("click");
    expect(w.emitted("stop")).toHaveLength(1);
  });

  it("cannot start before consent (disabled)", () => {
    const w = mount(RecorderPanel, { props: { ...base, disabled: true } });
    expect(w.find("button").attributes("disabled")).toBeDefined();
  });

  it("shows the recording state in words with an elapsed timer", async () => {
    const w = mount(RecorderPanel, { props: base });
    expect(w.find('[role="status"]').text()).toBe("未錄音");
    await w.setProps({ state: "recording" });
    vi.advanceTimersByTime(65_000);
    await w.vm.$nextTick();
    expect(w.find('[role="status"]').text()).toBe("錄音中 01:05");
    await w.setProps({ state: "idle" });
    expect(w.find('[role="status"]').text()).toBe("未錄音");
  });

  it("while the permission prompt is open, says so and offers cancel (emits stop)", async () => {
    const w = mount(RecorderPanel, { props: { ...base, state: "requesting" } });
    expect(w.find('[role="status"]').text()).toBe("等待麥克風權限…");
    expect(w.text()).toContain("按「允許」");
    await w.find('[data-test="cancel"]').trigger("click");
    expect(w.emitted("stop")).toHaveLength(1);
    expect(w.emitted("start")).toBeUndefined();
  });

  it("shows the volume as a 0–100 meter", () => {
    const w = mount(RecorderPanel, { props: { ...base, state: "recording", level: 0.42 } });
    expect(w.find('[role="meter"]').attributes("aria-valuenow")).toBe("42");
  });

  it.each([
    ["denied", "", RECORDER_MESSAGES.denied],
    ["error", RECORDER_MESSAGES.noDevice, RECORDER_MESSAGES.noDevice],
    ["error", "", RECORDER_MESSAGES.failed],
  ] as const)("state %s shows an alert and a retry button", (state, error, text) => {
    const w = mount(RecorderPanel, { props: { ...base, state, error } });
    expect(w.find('[role="alert"]').text()).toBe(text);
    expect(w.find("button").text()).toContain("重試錄音");
  });

  it.each([
    [undefined, null],
    ["idle", "連線中…"],
    ["open", "已連線"],
    ["closed", "連線中斷"],
  ] as const)("connection %s → %s", (connection, text) => {
    const w = mount(RecorderPanel, { props: { ...base, connection } });
    const el = w.find('[data-test="connection"]');
    if (text === null) expect(el.exists()).toBe(false);
    else expect(el.text()).toBe(text);
  });

  it("warns when the link drops during a recording", () => {
    const w = mount(RecorderPanel, { props: { ...base, state: "recording", connection: "closed" } });
    expect(w.find('[role="alert"]').text()).toContain("連線中斷");
  });
});
