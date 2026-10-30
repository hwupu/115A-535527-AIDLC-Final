// @vitest-environment happy-dom
import { mount, flushPromises } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import NurseSession from "./NurseSession.vue";
import { useNurseSessionStore } from "@/stores/nurseSession";

// Smoke test of the whole nurse workflow through the real components and the mock api.
describe("nurse session screen", () => {
  beforeEach(() => setActivePinia(createPinia()));

  it("goes from consent to a saved report, and never fills the triage level itself", async () => {
    const store = useNurseSessionStore();
    await store.startNew();
    const wrapper = mount(NurseSession);

    expect(wrapper.text()).toContain("病患是否同意錄音");
    await wrapper.findAll("button").find((b) => b.text().includes("同意，可以錄音"))!.trigger("click");
    expect(wrapper.text()).not.toContain("病患是否同意錄音");

    // AI drafts a field and flags something: both are labelled as suggestions for the nurse.
    store.applyServerMessage({ type: "field.update", path: "chief_complaint", value: "呼吸喘", status: "AI 草稿", source_span: "我喘到走不動", source: "ai" });
    store.applyServerMessage({ type: "flags.update", flags: [{ text: "血氧 93%（建議留意）", basis: "血氧九十三" }] });
    await flushPromises();
    expect(wrapper.text()).toContain("AI 草稿");
    expect(wrapper.text()).toContain("建議留意");
    expect(wrapper.text()).toContain("來源：「我喘到走不動」");

    // The triage level starts empty and saving is refused, with the reasons listed.
    expect(store.triageLevel).toBeNull();
    const save = () => wrapper.findAll("button").find((b) => b.text().includes("確認並儲存"))!;
    await save().trigger("click");
    expect(wrapper.text()).toContain("還不能儲存");
    expect(wrapper.text()).toContain("1 項 AI 草稿未確認");

    // The nurse confirms the draft, picks the level herself and saves.
    await wrapper.findAll("button").find((b) => b.text().trim() === "確認")!.trigger("click");
    await flushPromises();
    await wrapper.find('button[aria-label="第 3 級"]').trigger("click");
    await save().trigger("click");
    await flushPromises();
    await vi.waitFor(() => expect(store.confirmed).toBe(true)); // the mock api answers after a short delay
    await flushPromises();
    expect(wrapper.text()).toContain("報告已儲存");
    expect(wrapper.text()).toContain("檢傷級數（護理師填寫）：3");
  });

  it("shows the 量測禁忌 reminder and asks for the wristband", async () => {
    const store = useNurseSessionStore();
    await store.startNew();
    const wrapper = mount(NurseSession);
    store.applyServerMessage({ type: "field.update", path: "measurement.restrictions", value: ["左手：洗腎瘻管"], status: "AI 草稿", source_span: "左手有洗腎的瘻管", source: "ai" });
    await flushPromises();
    expect(wrapper.text()).toContain("量測禁忌：左手：洗腎瘻管");
    expect(wrapper.text()).toContain("尚未確認手圈");
    await wrapper.findAll("button").find((b) => b.text().includes("尚未確認手圈"))!.trigger("click");
    await flushPromises();
    expect(wrapper.text()).toContain("已戴手圈 ✓");
  });
});
