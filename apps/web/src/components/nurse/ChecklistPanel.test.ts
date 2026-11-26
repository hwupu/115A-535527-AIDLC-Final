// @vitest-environment happy-dom
import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import ChecklistPanel from "./ChecklistPanel.vue";
import type { FieldStatus, ReportFields } from "@/api";
import { checklistRows, nurseChecklist } from "@/intake/nurseChecklist";
import { emptyFields, fieldDefByPath } from "@/report/schema";

function withFields(set: Record<string, FieldStatus>): ReportFields {
  const f = emptyFields();
  for (const [path, status] of Object.entries(set)) f[path] = { value: "x", status, source_span: null, source: status === "AI 草稿" ? "ai" : "nurse_edit" };
  return f;
}

describe("nurse checklist (#87)", () => {
  it("follows the 查核表 order, TOCC first, and maps only to real fields", () => {
    expect(nurseChecklist.map((i) => i.id)).toEqual(["fever", "travel", "occ", "arms", "cc", "dob", "with", "walk"]);
    for (const i of nurseChecklist) for (const p of i.fields) expect(fieldDefByPath(p), p).toBeDefined();
  });

  it("ticks from field status only, and tells AI drafts apart from nurse-confirmed answers", () => {
    const rows = checklistRows(withFields({
      "tocc.travel": "AI 草稿",
      "tocc.fever_cough_cold": "護理師已確認",
      "tocc.occupation": "護理師已確認",
      "tocc.cluster": "AI 草稿",
    }));
    const by = Object.fromEntries(rows.map((r) => [r.id, r]));
    expect(by.fever.status).toBe("護理師已確認");
    expect(by.travel.status).toBe("AI 草稿");
    expect(by.occ).toMatchObject({ status: "部分", missing: ["接觸史"], jumpTo: "tocc.contact" });
    expect(by.dob).toMatchObject({ status: "未問", jumpTo: "patient.dob" });
  });

  it("an item with every field filled but one still a draft is a draft, and jumps to that draft", () => {
    const [occ] = checklistRows(withFields({ "tocc.occupation": "護理師已確認", "tocc.contact": "AI 草稿", "tocc.cluster": "護理師已確認" })).filter((r) => r.id === "occ");
    expect(occ).toMatchObject({ status: "AI 草稿", jumpTo: "tocc.contact" });
  });

  it("jumps to the field when a question is tapped, and can be collapsed", async () => {
    const wrapper = mount(ChecklistPanel, { props: { fields: withFields({ "tocc.travel": "AI 草稿" }) } });
    expect(wrapper.text()).toContain("已回答 1 / 8");
    await wrapper.find('[data-testid="checklist-dob"]').trigger("click");
    expect(wrapper.emitted("jump")).toEqual([["patient.dob"]]);
    const toggle = wrapper.find("button[aria-expanded]");
    await toggle.trigger("click");
    expect(toggle.attributes("aria-expanded")).toBe("false");
    expect(wrapper.find("#checklist-body").attributes("style")).toContain("display: none");
  });
});
