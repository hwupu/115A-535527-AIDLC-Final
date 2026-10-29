import type { ServerMessage } from "../types";

// Fictional scripted conversation (based on scenario S01 in docs/SCENARIOS.md) for mock mode only.
export const mockScript: { delayMs: number; message: ServerMessage; nurseOnly?: boolean }[] = [
  {
    delayMs: 800,
    message: { type: "transcript.segment", segment_id: "m1", speaker: "nurse", text: "請問今天哪裡不舒服？", start: 0, end: 2, final: true },
  },
  {
    delayMs: 1800,
    message: { type: "transcript.segment", segment_id: "m2", speaker: "patient", text: "從昨天開始發燒、咳嗽，喉嚨也很痛。", start: 2, end: 6, final: true },
  },
  {
    delayMs: 2600,
    nurseOnly: true,
    message: { type: "field.update", path: "chief_complaint", value: "發燒、咳嗽、喉嚨痛", status: "AI 草稿", source_span: "從昨天開始發燒、咳嗽，喉嚨也很痛。", source: "ai" },
  },
];
