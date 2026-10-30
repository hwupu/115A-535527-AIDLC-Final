import type { ServerMessage } from "../types";

export interface ScriptStep {
  delayMs: number;
  message: ServerMessage;
  nurseOnly?: boolean; // drafts and flags never go to the patient connection
}

const seg = (id: string, speaker: "nurse" | "patient", text: string, start: number) =>
  ({ type: "transcript.segment", segment_id: id, speaker, text, start, end: start + 3, final: true }) as const;

const draft = (path: string, value: unknown, span: string) =>
  ({ type: "field.update", path, value, status: "AI 草稿", source_span: span, source: "ai" }) as ServerMessage;

// Fictional conversation based on scenario S03 (docs/SCENARIOS.md), used by the mock server only.
export const mockScript: ScriptStep[] = [
  { delayMs: 600, message: seg("m1", "nurse", "請問目前有發燒、咳嗽或感冒症狀嗎？", 0) },
  { delayMs: 1500, message: seg("m2", "patient", "沒有發燒，但是有一點咳嗽，躺著比較喘。", 3) },
  { delayMs: 1900, nurseOnly: true, message: draft("tocc.fever_cough_cold", "有", "有一點咳嗽") },
  { delayMs: 2000, nurseOnly: true, message: draft("tocc.fever_cough_cold_details", "輕微咳嗽，平躺較喘；無發燒", "沒有發燒，但是有一點咳嗽，躺著比較喘") },
  { delayMs: 2800, message: seg("m3", "nurse", "請問您的兩隻手都可以量血壓嗎？", 6) },
  { delayMs: 3700, message: seg("m4", "patient", "左手不行，我左手有洗腎的瘻管。", 9) },
  { delayMs: 4100, nurseOnly: true, message: draft("measurement.restrictions", ["左手：洗腎瘻管"], "左手不行，我左手有洗腎的瘻管") },
  { delayMs: 5000, message: seg("m5", "nurse", "好，我幫您的左手戴上禁止治療的手圈，血壓量右手。", 12) },
  { delayMs: 5400, nurseOnly: true, message: draft("measurement.wristband_no_treatment", true, "我幫您的左手戴上禁止治療的手圈") },
  { delayMs: 5500, nurseOnly: true, message: draft("measurement.vitals.bp_site", "右手", "血壓量右手") },
  { delayMs: 6400, message: seg("m6", "nurse", "血壓一百五十八，九十二。脈搏八十八，血氧九十三。", 15) },
  { delayMs: 6800, nurseOnly: true, message: draft("measurement.vitals.bp_sys", 158, "血壓一百五十八") },
  { delayMs: 6900, nurseOnly: true, message: draft("measurement.vitals.bp_dia", 92, "九十二") },
  { delayMs: 7000, nurseOnly: true, message: draft("measurement.vitals.hr", 88, "脈搏八十八") },
  { delayMs: 7100, nurseOnly: true, message: draft("measurement.vitals.spo2", 93, "血氧九十三") },
  { delayMs: 8000, message: seg("m7", "patient", "我今天喘到走不動，腳也腫起來。昨天沒有去洗腎，因為感冒不舒服。", 18) },
  { delayMs: 8400, nurseOnly: true, message: draft("chief_complaint", "呼吸喘、下肢水腫", "我今天喘到走不動，腳也腫起來") },
  { delayMs: 8500, nurseOnly: true, message: draft("hpi.onset", "今日", "我今天喘到走不動") },
  { delayMs: 8600, nurseOnly: true, message: draft("hpi.associated_symptoms", ["下肢水腫"], "腳也腫起來") },
  { delayMs: 8700, nurseOnly: true, message: draft("hpi.relevant_history", ["血液透析", "昨日未洗腎"], "昨天沒有去洗腎") },
  {
    delayMs: 9000,
    nurseOnly: true,
    message: {
      type: "flags.update",
      flags: [
        { text: "血氧 93%（建議留意）", basis: "血氧九十三" },
        { text: "昨日未洗腎（建議留意）", basis: "昨天沒有去洗腎" },
      ],
    },
  },
  { delayMs: 10000, message: seg("m8", "nurse", "走路還可以嗎？需要輪椅嗎？", 21) },
  { delayMs: 10900, message: seg("m9", "patient", "我拿拐杖還可以，但是今天喘，給我輪椅好了。", 24) },
  { delayMs: 11300, nurseOnly: true, message: draft("patient.mobility", "輪椅", "給我輪椅好了") },
];

// Scenario list for evaluation mode (docs/SCENARIOS.md §2). Splits and demo flags follow that table.
export const mockScenarios = [
  { id: "S01", title: "流感樣症狀", split: "dev", demo: true },
  { id: "S02", title: "旅遊後腹痛腹瀉", split: "held_out", demo: false },
  { id: "S03", title: "洗腎病人喘、腳腫", split: "dev", demo: true },
  { id: "S04", title: "長者胸悶 + 家屬陪同", split: "dev", demo: true },
  { id: "S05", title: "描述不清、資訊不足", split: "dev", demo: false },
  { id: "S06", title: "台語夾雜國語", split: "held_out", demo: false },
  { id: "S07", title: "幼兒發燒、母親代答", split: "dev", demo: false },
  { id: "S08", title: "生命徵象口述與更正", split: "held_out", demo: false },
  { id: "S09", title: "嘈雜環境與打斷", split: "held_out", demo: false },
  { id: "S10", title: "中途更正答案", split: "held_out", demo: false },
  { id: "S11", title: "機車外傷、手腕疼痛", split: "held_out", demo: false },
] as const;
