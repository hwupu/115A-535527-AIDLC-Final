import { describe, expect, it } from "vitest";
import { emptyFields, fieldDefByPath, fieldDefs, formatValue, parseInput, reportToText } from "./schema";

const def = (path: string) => fieldDefByPath(path)!;

describe("report schema", () => {
  it("starts every field as 未提及 and has no triage level field", () => {
    const fields = emptyFields();
    expect(Object.keys(fields)).toHaveLength(fieldDefs.length);
    expect(Object.values(fields).every((f) => f.status === "未提及" && f.value === null)).toBe(true);
    expect(fieldDefs.some((d) => /triage|level|級數/i.test(d.path + d.label))).toBe(false);
  });

  it("stores dates as ISO and shows 民國", () => {
    expect(parseInput(def("patient.dob"), "民國47年3月9日")).toBe("1958-03-09");
    expect(formatValue(def("patient.dob"), "1958-03-09")).toBe("民國47年3月9日");
    expect(parseInput(def("patient.dob"), "不是日期")).toBeUndefined();
  });

  it("parses numbers, lists and empty input", () => {
    expect(parseInput(def("measurement.vitals.spo2"), "93")).toBe(93);
    expect(parseInput(def("measurement.vitals.spo2"), "abc")).toBeUndefined();
    expect(parseInput(def("hpi.associated_symptoms"), "喘，腳腫、咳嗽")).toEqual(["喘", "腳腫", "咳嗽"]);
    expect(parseInput(def("chief_complaint"), "   ")).toBeNull();
  });

  it("exports plain text with 未提及 for empty fields and a dash for an empty level", () => {
    const text = reportToText(emptyFields(), { visitNo: "SIM-000001", triageLevel: null, flags: [{ text: "血氧 93%", basis: "x" }] });
    expect(text).toContain("就診號：SIM-000001");
    expect(text).toContain("檢傷級數（護理師填寫）：—");
    expect(text).toContain("主訴：未提及");
    expect(text).toContain("系統建議留意");
  });
});
