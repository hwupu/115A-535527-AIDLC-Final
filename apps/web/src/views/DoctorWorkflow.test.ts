// @vitest-environment happy-dom
import { flushPromises, mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMemoryHistory, createRouter } from "vue-router";
import DoctorListView from "./DoctorListView.vue";
import DoctorReportView from "./DoctorReportView.vue";
import { api } from "@/api";

async function open(path: string) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: "/doctor", component: DoctorListView },
      { path: "/doctor/:id", component: DoctorReportView, props: true },
      { path: "/", component: { template: "<div />" } },
    ],
  });
  router.push(path);
  await router.isReady();
  const wrapper = mount({ template: "<RouterView />" }, { global: { plugins: [createPinia(), router] } });
  return { wrapper, router };
}

describe("physician workflow", () => {
  beforeEach(() => setActivePinia(createPinia()));

  it("lists patients newest first with status, and previews the main complaint only once confirmed", async () => {
    const { wrapper } = await open("/doctor");
    await vi.waitFor(() => expect(wrapper.findAll("li").length).toBeGreaterThanOrEqual(3));
    const text = wrapper.text();
    expect(text).toContain("等候中");
    expect(text).toContain("進行中");
    expect(text).toContain("已確認");
    expect(text).toContain("呼吸喘、下肢水腫"); // confirmed patient
    expect(text).not.toContain("發燒、咳嗽、喉嚨痛"); // in-progress draft is not shown to the physician
    expect(text).toContain("有建議留意");
  });

  it("opens a confirmed report read-only, with the nurse's level and which fields she changed", async () => {
    const rows = await api.listSessions({ status: ["confirmed"] });
    const { wrapper } = await open(`/doctor/${rows[0].session_id}`);
    await vi.waitFor(() => expect(wrapper.text()).toContain("檢傷級數（護理師判定）"));
    expect(wrapper.text()).toContain("158/92");
    expect(wrapper.text()).toContain("量測禁忌：左手：洗腎瘻管");
    expect(wrapper.text()).toContain("護理師修改");
    // Nothing to edit: no inputs, and the only buttons/links are for navigation.
    expect(wrapper.findAll("input, textarea, select")).toHaveLength(0);
    expect(wrapper.text()).not.toContain("確認並儲存");
  });

  it("shows 尚未確認 for a report the nurse has not saved yet, and then shows it once she does", async () => {
    const { session_id } = await api.createSession("nurse");
    const { wrapper } = await open(`/doctor/${session_id}`);
    await vi.waitFor(() => expect(wrapper.text()).toContain("尚未確認"));
    await api.confirmSession(session_id, { triage_level: 2 });
    await vi.waitFor(() => expect(wrapper.text()).toContain("檢傷級數（護理師判定）"), { timeout: 6000 });
    expect(wrapper.text()).toContain("2");
    await flushPromises();
  }, 10000);
});
