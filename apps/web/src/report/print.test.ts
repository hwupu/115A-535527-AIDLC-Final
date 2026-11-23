import { describe, expect, it } from "vitest";
import type { FieldValue } from "@/api";
import { printRecord } from "./print";
import { emptyFields } from "./schema";

function filled(values: Record<string, FieldValue>) {
  const fields = emptyFields();
  for (const [path, value] of Object.entries(values)) {
    fields[path] = { value, status: "護理師已確認", source_span: null, source: "ai" };
  }
  return fields;
}

const text = (r: ReturnType<typeof printRecord>) =>
  [...r.header.map((h) => `${h.label}：${h.value}`), ...r.rows.flatMap((row) => [row.label, ...row.lines])].join("\n");

describe("printed triage record", () => {
  it("prints the key sections in record order, with the TOCC block and one-line vitals", () => {
    const record = printRecord(
      filled({
        chief_complaint: "發燒、咳嗽",
        "hpi.onset": "昨天晚上",
        "hpi.associated_symptoms": ["喉嚨痛", "全身痠痛"],
        "hpi.relevant_history": ["高血壓"],
        "tocc.travel": "無",
        "tocc.contact": "有",
        "tocc.contact_details": "班上多位學童請病假",
        "measurement.vitals.bp_sys": 122,
        "measurement.vitals.bp_dia": 80,
        "measurement.vitals.bp_site": "右手",
        "measurement.vitals.hr": 92,
        "measurement.vitals.spo2": 97,
        "measurement.vitals.temp_c": 38.5,
        "patient.dob": "1998-05-14",
      }),
      { visitNo: "SIM-000001", triageLevel: 3, flags: [{ text: "發燒 38.5°C", basis: "x" }], confirmedAt: null },
    );
    expect(record.rows.map((r) => r.label)).toEqual(["主訴", "現在病史", "過去病史", "生命徵象", "檢傷級數"]);
    const all = text(record);
    expect(all).toContain("發作時間：昨天晚上");
    expect(all).toContain("伴隨症狀：喉嚨痛、全身痠痛");
    expect(all).toContain("T（兩個月內旅遊史）：無");
    expect(all).toContain("C（接觸史）：有（班上多位學童請病假）");
    expect(all).toContain("血壓：122/80 mmHg（右手）　脈搏：92 次/分　血氧：97 %　體溫：38.5 °C");
    expect(all).toContain("出生年月日：民國87年5月14日");
    expect(all).toContain("第 3 級（護理師判定）");
    expect(record.flags).toEqual(["發燒 38.5°C"]);
  });

  it("shows 未提及 or a dash for what was not said, and no level until the nurse enters one", () => {
    const record = printRecord(emptyFields(), { visitNo: "SIM-000002", triageLevel: null, flags: [], confirmedAt: null });
    const all = text(record);
    expect(all).toContain("主訴\n未提及");
    expect(all).toContain("血壓：—/— mmHg　脈搏：— 次/分");
    expect(record.rows.find((r) => r.label === "檢傷級數")!.lines).toEqual(["—"]);
  });

  it("prints no identifier other than the simulated 就診號", () => {
    const record = printRecord(emptyFields(), { visitNo: "SIM-000003", triageLevel: null, flags: [], confirmedAt: null });
    expect(record.header.map((h) => h.label)).toEqual(["就診號", "出生年月日", "陪同者", "行動能力", "確認時間"]);
    expect(text(record)).not.toMatch(/姓名|病歷號|身分證|電話|醫院|醫師/);
  });
});
