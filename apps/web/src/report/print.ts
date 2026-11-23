// The printed triage record. Its layout follows an ED record (patient line, 主訴, 現在病史 with a TOCC block,
// 過去病史, 生命徵象) but prints no hospital, staff or patient identifier: only the simulated 就診號.
// Diagnoses and the physical exam are left out on purpose; the AI drafts neither.
import type { Flag, ReportFields } from "@/api";
import { fieldDefByPath, formatValue } from "./schema";

export interface PrintRow {
  label: string;
  lines: string[];
}

export interface PrintRecord {
  header: { label: string; value: string }[];
  rows: PrintRow[];
  flags: string[];
}

const MISSING = "未提及";

function value(fields: ReportFields, path: string): string {
  const def = fieldDefByPath(path);
  const f = fields[path];
  return def && f ? formatValue(def, f.value) : "";
}

// Raw number or text without the unit, for the one-line vital signs.
const raw = (fields: ReportFields, path: string) => {
  const v = fields[path]?.value;
  return v === null || v === undefined || v === "" ? "—" : String(v);
};

// 有／無 plus the free-text details, e.g. 「有（班上多位學童請病假）」.
function yesNo(fields: ReportFields, path: string): string {
  const answer = value(fields, path);
  const details = value(fields, `${path}_details`);
  if (!answer) return details || MISSING;
  return details ? `${answer}（${details}）` : answer;
}

function confirmedTime(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function printRecord(
  fields: ReportFields,
  opts: { visitNo: string | null; triageLevel: number | null; flags: Flag[]; confirmedAt: string | null },
): PrintRecord {
  const or = (text: string) => text || MISSING;

  const hpi = [
    ["發作時間", "hpi.onset"],
    ["部位", "hpi.location"],
    ["性質", "hpi.quality"],
    ["嚴重度", "hpi.severity"],
    ["病程", "hpi.course"],
    ["加重／緩解", "hpi.aggravating_relieving"],
    ["伴隨症狀", "hpi.associated_symptoms"],
  ]
    .map(([label, path]) => [label, value(fields, path)])
    .filter(([, text]) => text)
    .map(([label, text]) => `${label}：${text}`);

  const site = value(fields, "measurement.vitals.bp_site");
  const vitals =
    `血壓：${raw(fields, "measurement.vitals.bp_sys")}/${raw(fields, "measurement.vitals.bp_dia")} mmHg` +
    (site ? `（${site}）` : "") +
    `　脈搏：${raw(fields, "measurement.vitals.hr")} 次/分` +
    `　血氧：${raw(fields, "measurement.vitals.spo2")} %` +
    `　體溫：${raw(fields, "measurement.vitals.temp_c")} °C`;

  return {
    header: [
      { label: "就診號", value: opts.visitNo ?? "—" },
      { label: "出生年月日", value: or(value(fields, "patient.dob")) },
      { label: "陪同者", value: or(value(fields, "patient.accompanied_by")) },
      { label: "行動能力", value: or(value(fields, "patient.mobility")) },
      { label: "確認時間", value: confirmedTime(opts.confirmedAt) },
    ],
    rows: [
      { label: "主訴", lines: [or(value(fields, "chief_complaint"))] },
      {
        label: "現在病史",
        lines: [
          ...(hpi.length ? hpi : [MISSING]),
          "TOCC：",
          `T（兩個月內旅遊史）：${yesNo(fields, "tocc.travel")}`,
          `O（職業）：${or(value(fields, "tocc.occupation"))}`,
          `C（接觸史）：${yesNo(fields, "tocc.contact")}`,
          `C（群聚史）：${yesNo(fields, "tocc.cluster")}`,
          `發燒／咳嗽／感冒症狀：${yesNo(fields, "tocc.fever_cough_cold")}`,
        ],
      },
      { label: "過去病史", lines: [or(value(fields, "hpi.relevant_history"))] },
      {
        label: "生命徵象",
        lines: [
          vitals,
          `量測禁忌：${or(value(fields, "measurement.restrictions"))}`,
          `「禁止治療」手圈：${or(value(fields, "measurement.wristband_no_treatment"))}`,
        ],
      },
      { label: "檢傷級數", lines: [opts.triageLevel ? `第 ${opts.triageLevel} 級（護理師判定）` : "—"] },
    ],
    flags: opts.flags.map((f) => f.text),
  };
}
