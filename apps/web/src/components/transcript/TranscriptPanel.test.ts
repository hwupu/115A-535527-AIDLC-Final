// @vitest-environment happy-dom
import { flushPromises, mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import TranscriptPanel from "./TranscriptPanel.vue";
import { timestamp } from "./timestamp";
import type { TranscriptSegment } from "@/api";

const seg = (id: string, text: string, start: number, extra: Partial<TranscriptSegment> = {}): TranscriptSegment => ({
  segment_id: id,
  speaker: "patient",
  text,
  start,
  end: start + 3,
  final: true,
  ...extra,
});

// happy-dom has no layout: give the scroll box explicit sizes.
function setScroll(el: HTMLElement, { top, height, client }: { top: number; height: number; client: number }) {
  Object.defineProperty(el, "scrollHeight", { configurable: true, value: height });
  Object.defineProperty(el, "clientHeight", { configurable: true, value: client });
  el.scrollTop = top;
}

describe("timestamp", () => {
  it.each([
    [{ start: 0, end: 2.5 }, "00:00"],
    [{ start: 7.9, end: 9 }, "00:07"],
    [{ start: 65, end: 70 }, "01:05"],
    [{ start: 3600 + 5, end: 3610 }, "60:05"],
    [{ start: 0, end: 0 }, null], // typed text: no audio time
  ])("%o → %s", (s, expected) => expect(timestamp(s)).toBe(expected));
});

describe("TranscriptPanel", () => {
  it("shows an empty-state hint before anything is said", () => {
    const w = mount(TranscriptPanel, { props: { segments: [], highlight: null } });
    expect(w.text()).toContain("尚無內容");
  });

  it("adds lines one by one, each with speaker and timestamp", async () => {
    const w = mount(TranscriptPanel, { props: { segments: [seg("a", "從昨天開始發燒", 0, { speaker: "patient" })], highlight: null } });
    expect(w.findAll("li")).toHaveLength(1);
    await w.setProps({ segments: [seg("a", "從昨天開始發燒", 0), seg("b", "有咳嗽嗎？", 4, { speaker: "nurse" })] });
    const rows = w.findAll("li");
    expect(rows).toHaveLength(2);
    expect(rows[0]!.find("time").text()).toBe("00:00");
    expect(rows[1]!.find("time").text()).toBe("00:04");
    expect(rows[1]!.find("time").attributes("datetime")).toBe("PT4S");
    expect(rows[1]!.text()).toContain("護理師：");
  });

  it("typed lines have no timestamp and are labelled as typed by the patient", () => {
    const w = mount(TranscriptPanel, {
      props: { segments: [seg("t1", "我胸口痛", 0, { end: 0, source: "patient_input" })], highlight: null },
    });
    expect(w.find("time").exists()).toBe(false);
    expect(w.text()).toContain("病患（自行輸入）：");
  });

  it("marks a partial result in words, then replaces it when final", async () => {
    const w = mount(TranscriptPanel, { props: { segments: [seg("a", "從昨天開", 0, { final: false })], highlight: null } });
    expect(w.find('[data-test="partial"]').text()).toBe("（辨識中…）");
    await w.setProps({ segments: [seg("a", "從昨天開始發燒", 0, { final: true })] });
    expect(w.find('[data-test="partial"]').exists()).toBe(false);
    expect(w.findAll("li")).toHaveLength(1);
  });

  it("highlights the source sentence of the selected field", () => {
    const w = mount(TranscriptPanel, { props: { segments: [seg("a", "從昨天開始發燒到三十九度", 0)], highlight: "發燒到三十九度" } });
    expect(w.find("mark").text()).toBe("發燒到三十九度");
  });

  it("follows new lines at the bottom, but offers a button after scrolling up", async () => {
    const lines = [seg("a", "一", 0), seg("b", "二", 4)];
    const w = mount(TranscriptPanel, { props: { segments: lines, highlight: null }, attachTo: document.body });
    const box = w.find('[aria-live="polite"]').element as HTMLElement;

    // At the bottom: a new line scrolls into view, no button.
    setScroll(box, { top: 600, height: 1000, client: 400 });
    await w.find('[aria-live="polite"]').trigger("scroll");
    setScroll(box, { top: 600, height: 1100, client: 400 });
    await w.setProps({ segments: [...lines, seg("c", "三", 8)] });
    await flushPromises();
    expect(box.scrollTop).toBe(1100);
    expect(w.find('[data-test="new-lines"]').exists()).toBe(false);

    // Scrolled up to read: the view stays, and a counter appears.
    setScroll(box, { top: 100, height: 1100, client: 400 });
    await w.find('[aria-live="polite"]').trigger("scroll");
    await w.setProps({ segments: [...lines, seg("c", "三", 8), seg("d", "四", 12), seg("e", "五", 16)] });
    await flushPromises();
    expect(box.scrollTop).toBe(100);
    expect(w.find('[data-test="new-lines"]').text()).toBe("2 則新內容");

    await w.find('[data-test="new-lines"]').trigger("click");
    expect(box.scrollTop).toBe(1100);
    expect(w.find('[data-test="new-lines"]').exists()).toBe(false);
    w.unmount();
  });
});
