import type { Flag, ReportFields } from "../types";
import { emptyFields } from "@/report/schema";

// Fictional demo patients so the physician list is not empty in mock mode (scenarios S03 and S01, docs/SCENARIOS.md).
type Patch = Record<string, Partial<ReportFields[string]> & { value: ReportFields[string]["value"] }>;

function build(patch: Patch, status: "AI 草稿" | "護理師已確認", edited: string[] = []): ReportFields {
  const fields = emptyFields();
  for (const [path, p] of Object.entries(patch)) {
    fields[path] = {
      value: p.value,
      status,
      source_span: p.source_span ?? null,
      source: edited.includes(path) ? "nurse_edit" : "ai",
    };
  }
  return fields;
}

export const seedDialysis = {
  fields: build(
    {
      chief_complaint: { value: "呼吸喘、下肢水腫", source_span: "我今天喘到走不動，腳也腫起來" },
      "tocc.fever_cough_cold": { value: "有", source_span: "有一點咳嗽" },
      "tocc.fever_cough_cold_details": { value: "輕微咳嗽，平躺較喘；無發燒" },
      "tocc.travel": { value: "無", source_span: "沒有。" },
      "measurement.restrictions": { value: ["左手：洗腎瘻管"], source_span: "左手不行，我左手有洗腎的瘻管" },
      "measurement.wristband_no_treatment": { value: true },
      "measurement.vitals.bp_site": { value: "右手" },
      "measurement.vitals.bp_sys": { value: 158 },
      "measurement.vitals.bp_dia": { value: 92 },
      "measurement.vitals.hr": { value: 88 },
      "measurement.vitals.spo2": { value: 93 },
      "hpi.onset": { value: "今日", source_span: "我今天喘到走不動" },
      "hpi.associated_symptoms": { value: ["下肢水腫"], source_span: "腳也腫起來" },
      "hpi.relevant_history": { value: ["血液透析（週一三五）", "昨日未洗腎"] },
      "patient.dob": { value: "1958-03-09" },
      "patient.accompanied_by": { value: "兒子（在停車）" },
      "patient.mobility": { value: "輪椅" },
    },
    "護理師已確認",
    ["hpi.relevant_history", "patient.accompanied_by", "measurement.wristband_no_treatment"],
  ),
  flags: [
    { text: "血氧 93%（建議留意）", basis: "血氧九十三" },
    { text: "昨日未洗腎（建議留意）", basis: "昨天沒有去洗腎" },
  ] as Flag[],
  triageLevel: 3 as const,
};

export const seedFever = {
  fields: build(
    {
      chief_complaint: { value: "發燒、咳嗽、喉嚨痛", source_span: "從昨天開始發燒、咳嗽，喉嚨也很痛" },
      "tocc.fever_cough_cold": { value: "有", source_span: "發燒、咳嗽" },
      "hpi.onset": { value: "昨天", source_span: "從昨天開始" },
    },
    "AI 草稿",
  ),
  segments: [
    { speaker: "nurse", text: "請問今天哪裡不舒服？" },
    { speaker: "patient", text: "從昨天開始發燒、咳嗽，喉嚨也很痛。" },
  ] as const,
};

export const seedWaiting = { text: "頭很暈，而且胸口悶悶的，大概一個小時了。" };
