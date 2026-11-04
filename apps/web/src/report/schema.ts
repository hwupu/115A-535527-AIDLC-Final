// The triage report as the nurse sees it: sections, fields, labels and value formatting.
// Field paths are the keys of ReportFields and the `path` used by the api (docs/frontend/API_INTERFACE.md).
// Field set follows the 醫院檢傷問診病人查核表 and docs/SCENARIOS.md §1. There is no triage-level field here on purpose.
import type { FieldValue, Flag, ReportFields } from "@/api";

export type FieldKind = "yesno" | "text" | "longtext" | "list" | "number" | "bool" | "choice" | "date";
export type SectionId = "patient" | "tocc" | "measurement" | "chief_complaint" | "hpi";

export interface FieldDef {
  path: string;
  label: string;
  kind: FieldKind;
  section: SectionId;
  unit?: string;
  options?: string[]; // for kind "choice"
  hint?: string;
}

export const sections: { id: SectionId; label: string }[] = [
  { id: "chief_complaint", label: "主訴" },
  { id: "tocc", label: "TOCC 篩檢" },
  { id: "measurement", label: "量測禁忌與生命徵象" },
  { id: "hpi", label: "現在病史（HPI）" },
  { id: "patient", label: "基本資料" },
];

export const fieldDefs: FieldDef[] = [
  { path: "chief_complaint", label: "主訴", kind: "text", section: "chief_complaint", hint: "短句，例如「發燒、咳嗽」" },

  { path: "tocc.fever_cough_cold", label: "發燒／咳嗽／感冒症狀", kind: "yesno", section: "tocc" },
  { path: "tocc.fever_cough_cold_details", label: "症狀說明", kind: "text", section: "tocc" },
  { path: "tocc.travel", label: "兩個月內旅遊史", kind: "yesno", section: "tocc" },
  { path: "tocc.travel_details", label: "旅遊地點／時間", kind: "text", section: "tocc" },
  { path: "tocc.occupation", label: "職業", kind: "text", section: "tocc" },
  { path: "tocc.contact", label: "接觸史", kind: "yesno", section: "tocc" },
  { path: "tocc.contact_details", label: "接觸說明", kind: "text", section: "tocc" },
  { path: "tocc.cluster", label: "群聚史", kind: "yesno", section: "tocc" },
  { path: "tocc.cluster_details", label: "群聚說明", kind: "text", section: "tocc" },

  { path: "measurement.restrictions", label: "量測禁忌（部位：原因）", kind: "list", section: "measurement", hint: "用逗號分隔，例如「左手：洗腎瘻管」" },
  { path: "measurement.wristband_no_treatment", label: "已戴「禁止治療」手圈", kind: "bool", section: "measurement" },
  { path: "measurement.vitals.bp_site", label: "血壓量測部位", kind: "text", section: "measurement" },
  { path: "measurement.vitals.bp_sys", label: "收縮壓", kind: "number", unit: "mmHg", section: "measurement" },
  { path: "measurement.vitals.bp_dia", label: "舒張壓", kind: "number", unit: "mmHg", section: "measurement" },
  { path: "measurement.vitals.hr", label: "脈搏", kind: "number", unit: "次/分", section: "measurement" },
  { path: "measurement.vitals.spo2", label: "血氧", kind: "number", unit: "%", section: "measurement" },
  { path: "measurement.vitals.temp_c", label: "體溫（量測）", kind: "number", unit: "°C", section: "measurement" },

  { path: "hpi.onset", label: "發作時間", kind: "text", section: "hpi" },
  { path: "hpi.location", label: "部位", kind: "text", section: "hpi" },
  { path: "hpi.quality", label: "性質", kind: "text", section: "hpi" },
  { path: "hpi.severity", label: "嚴重度", kind: "text", section: "hpi" },
  { path: "hpi.course", label: "病程", kind: "longtext", section: "hpi" },
  { path: "hpi.aggravating_relieving", label: "加重／緩解因素", kind: "text", section: "hpi" },
  { path: "hpi.associated_symptoms", label: "伴隨症狀", kind: "list", section: "hpi" },
  { path: "hpi.relevant_history", label: "相關病史", kind: "list", section: "hpi" },

  { path: "patient.dob", label: "出生年月日", kind: "date", section: "patient", hint: "例如 民國47年3月9日" },
  { path: "patient.accompanied_by", label: "陪同者", kind: "text", section: "patient" },
  { path: "patient.mobility", label: "行動能力", kind: "choice", options: ["步行", "輪椅", "其他"], section: "patient" },
];

export const fieldDefByPath = (path: string): FieldDef | undefined => fieldDefs.find((d) => d.path === path);

// Every field starts as 未提及 (empty beats invented).
export function emptyFields(): ReportFields {
  return Object.fromEntries(
    fieldDefs.map((d) => [d.path, { value: null, status: "未提及" as const, source_span: null, source: "ai" as const }]),
  );
}

const isEmpty = (v: FieldValue) => v === null || v === "" || (Array.isArray(v) && v.length === 0);

// Dates are stored as ISO and shown in 民國.
function isoToMinguo(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return m ? `民國${Number(m[1]) - 1911}年${Number(m[2])}月${Number(m[3])}日` : iso;
}

export function formatValue(def: FieldDef, value: FieldValue): string {
  if (isEmpty(value)) return "";
  if (def.kind === "bool") return value ? "是" : "否";
  if (def.kind === "list") return (value as string[]).join("、");
  if (def.kind === "date") return isoToMinguo(String(value));
  return def.unit ? `${value} ${def.unit}` : String(value);
}

// Turn what the nurse typed or picked into a stored value. Returns undefined when the input is not valid.
export function parseInput(def: FieldDef, raw: string): FieldValue | undefined {
  const text = raw.trim();
  if (!text) return null;
  switch (def.kind) {
    case "number": {
      const n = Number(text);
      return Number.isFinite(n) && n >= 0 ? n : undefined;
    }
    case "bool":
      return text === "是" || text === "true" ? true : text === "否" || text === "false" ? false : undefined;
    case "list":
      return text.split(/[,，、]/).map((t) => t.trim()).filter(Boolean);
    case "date": {
      if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
      const m = /^民國\s*(\d{1,3})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日?$/.exec(text);
      if (!m) return undefined;
      const [, y, mo, d] = m;
      return `${Number(y) + 1911}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`;
    }
    default:
      return text;
  }
}

// Plain text for copying into the HIS by hand. Contains only what is in the report; the triage level is the nurse's.
export function reportToText(fields: ReportFields, opts: { visitNo: string | null; triageLevel: number | null; flags: Flag[] }): string {
  const lines: string[] = [`就診號：${opts.visitNo ?? "—"}`, `檢傷級數（護理師填寫）：${opts.triageLevel ?? "—"}`, ""];
  for (const section of sections) {
    lines.push(`【${section.label}】`);
    for (const def of fieldDefs.filter((d) => d.section === section.id)) {
      const f = fields[def.path];
      const shown = f && !isEmpty(f.value) ? formatValue(def, f.value) : "未提及";
      lines.push(`${def.label}：${shown}`);
    }
    lines.push("");
  }
  if (opts.flags.length) lines.push("【系統建議留意（僅供參考）】", ...opts.flags.map((f) => `- ${f.text}`));
  return lines.join("\n").trim();
}
