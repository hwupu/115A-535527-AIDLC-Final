// @vitest-environment happy-dom
import { flushPromises, mount } from "@vue/test-utils";
import { createPinia } from "pinia";
import { describe, expect, it, vi } from "vitest";
import { createMemoryHistory, createRouter } from "vue-router";
import AdminView from "./AdminView.vue";

describe("admin screen", () => {
  it("picks a scenario, starts a timed run and records events", async () => {
    const router = createRouter({ history: createMemoryHistory(), routes: [{ path: "/", component: AdminView }, { path: "/nurse", component: { template: "<div />" } }] });
    router.push("/");
    await router.isReady();
    const wrapper = mount(AdminView, { global: { plugins: [createPinia(), router] } });
    await vi.waitFor(() => expect(wrapper.text()).toContain("S03 洗腎病人喘、腳腫"));
    expect(wrapper.text()).toContain("留存");

    const button = (label: string) => wrapper.findAll("button").find((b) => b.text().includes(label))!;
    expect(button("建立執行").attributes("disabled")).toBeDefined(); // nothing chosen yet
    await button("S03").trigger("click");
    await wrapper.find("#participant").setValue("N-07");
    await vi.waitFor(() => expect(button("建立執行").attributes("disabled")).toBeUndefined()); // after the initial load
    await wrapper.find("form").trigger("submit");
    await vi.waitFor(() => expect(wrapper.text()).toContain("受試者 N-07"));
    expect(wrapper.find('[role="timer"]').text()).toBe("00:00");

    await button("開始計時").trigger("click");
    await vi.waitFor(() => expect(wrapper.text()).toContain("結束"));
    await button("護理師發現系統錯誤").trigger("click");
    await vi.waitFor(() => expect(wrapper.findAll("li").length).toBe(2)); // start + error
    await vi.waitFor(() => expect(button("結束").attributes("disabled")).toBeUndefined()); // not busy
    await button("結束").trigger("click");
    await vi.waitFor(() => expect(wrapper.findAll("li").length).toBeGreaterThanOrEqual(3)); // start, error, end
    await flushPromises();
    expect(wrapper.text()).toContain("匯出 JSON");
  });
});
