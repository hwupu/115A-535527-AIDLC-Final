// Types for the frontend-to-api contract. Source of truth: docs/frontend/API_INTERFACE.md (proposal)
// and the report schema in docs/SCENARIOS.md §1. Keep in sync when the backend schema (B1) lands.

export type FieldStatus = "未提及" | "AI 草稿" | "護理師已確認";
export type FieldSource = "ai" | "nurse_edit" | "patient_input";

export interface Field<T = string | null> {
  value: T;
  status: FieldStatus;
  source_span: string | null; // exact quote from the transcript; null when not mentioned
  source: FieldSource;
}

export type YesNoUnknown = "有" | "無" | "未提及";

export interface Report {
  patient: { dob: Field; accompanied_by: Field; mobility: Field };
  tocc: {
    fever_cough_cold: Field<YesNoUnknown>;
    travel: Field<YesNoUnknown>;
    occupation: Field;
    contact: Field<YesNoUnknown>;
    cluster: Field<YesNoUnknown>;
  };
  measurement: {
    restrictions: Field<{ site: string; reason: string }[]>;
    wristband_no_treatment: Field<boolean | null>;
    vitals: Field<{
      bp_sys: number | null;
      bp_dia: number | null;
      hr: number | null;
      spo2: number | null;
      temp_c: number | null;
    }>;
  };
  chief_complaint: Field;
  hpi: Record<string, Field<string | string[] | null>>;
  flags: { text: string; basis: string }[]; // suggestions only
  // There is deliberately no triage_level here: the AI never produces one. The nurse enters it on confirm.
}

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
  report: Report | null;
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

export type Role = "patient" | "nurse";

// WebSocket messages
export type ClientMessage =
  | { type: "recording.start" | "recording.stop" }
  | { type: "field.edit"; path: string; value: unknown };

export type ServerMessage =
  | ({ type: "transcript.segment" } & TranscriptSegment)
  | { type: "field.update"; path: string; value: unknown; status: FieldStatus; source_span: string | null; source: FieldSource }
  | { type: "recording.state"; recording: boolean; by: Role }
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
