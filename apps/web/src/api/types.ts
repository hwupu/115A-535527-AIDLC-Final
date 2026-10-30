// Types for the frontend-to-api contract. Source of truth: docs/frontend/API_INTERFACE.md (proposal)
// and the report schema in docs/SCENARIOS.md §1. Keep in sync when the backend schema (B1) lands.

export type FieldStatus = "未提及" | "AI 草稿" | "護理師已確認";
export type FieldSource = "ai" | "nurse_edit" | "patient_input";

export interface Field<T = FieldValue> {
  value: T;
  status: FieldStatus;
  source_span: string | null; // exact quote from the transcript; null when not mentioned
  source: FieldSource;
}

// Leaf values: text, numbers (vitals), booleans (wristband), lists (symptoms, restrictions as "部位：原因").
export type FieldValue = string | number | boolean | string[] | null;

// The report is a flat map keyed by field path (for example "tocc.travel", "measurement.vitals.spo2").
// The paths and their labels are defined in src/report/schema.ts.
// There is deliberately no triage level in it: the AI never produces one. The nurse enters it on confirm.
export type ReportFields = Record<string, Field<FieldValue>>;

// Danger-sign suggestion shown to the nurse. Never a finding or an order.
export interface Flag {
  text: string;
  basis: string; // quote from the transcript that triggered it
}

export type TriageLevel = 1 | 2 | 3 | 4 | 5;

// intake: patient entering; ready: intake finished, waiting for the nurse; in_progress: nurse working.
export type SessionStatus = "intake" | "ready" | "in_progress" | "confirmed";

export type Speaker = "patient" | "nurse";

export interface TranscriptSegment {
  segment_id: string;
  speaker: Speaker;
  text: string;
  start: number;
  end: number;
  final: boolean;
  source?: "patient_input"; // set for text/voice the patient entered on their own screen
}

export interface Session {
  session_id: string;
  status: SessionStatus;
  visit_no: string | null; // SIM-######, null until intake is finished
  segments: TranscriptSegment[];
  fields: ReportFields;
  flags: Flag[];
  confirmed_at?: string;
  triage_level?: TriageLevel; // the nurse's own entry, present once confirmed
}

// What the physician reads: only available after the nurse confirmed. Read-only.
export interface ConfirmedReport {
  session_id: string;
  visit_no: string;
  confirmed_at: string;
  triage_level: TriageLevel; // decided and entered by the nurse
  fields: ReportFields;
  flags: Flag[];
}

export interface SessionSummary {
  session_id: string;
  visit_no: string | null;
  status: SessionStatus;
  started_at: string;
  confirmed_at?: string;
  chief_complaint?: string;
  has_flags: boolean;
}

// Evaluation mode (admin). Participant codes are anonymous (for example N-01), never names.
export interface Scenario {
  id: string;
  title: string;
  split: "dev" | "held_out";
  demo: boolean;
}

export type RunEventType = "task_start" | "task_end" | "field_edit" | "level_entered" | "error_found" | "note";

export interface RunEvent {
  at: string; // ISO time on the server clock
  type: RunEventType;
  payload?: Record<string, unknown>;
}

export interface Run {
  run_id: string;
  scenario_id: string;
  participant_code: string;
  session_id: string;
  visit_no: string | null;
  created_at: string;
  started_at?: string;
  finished_at?: string;
}

export type Role = "patient" | "nurse";

// WebSocket messages
export type ClientMessage =
  | { type: "recording.start" | "recording.stop" }
  | { type: "field.edit"; path: string; value: unknown };

export type ServerMessage =
  | ({ type: "transcript.segment" } & TranscriptSegment)
  | { type: "field.update"; path: string; value: unknown; status: FieldStatus; source_span: string | null; source: FieldSource }
  | { type: "recording.state"; recording: boolean; by: Role }
  | { type: "flags.update"; flags: Flag[] }
  | { type: "status"; stt: "ok" | "down"; llm: "ok" | "slow" | "down" }
  | { type: "error"; code: string; message: string };

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}
