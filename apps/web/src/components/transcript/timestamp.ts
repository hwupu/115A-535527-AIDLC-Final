import type { TranscriptSegment } from "@/api";

// Seconds from the start of the recording → mm:ss. Typed lines have no audio time (start = end = 0) → null.
export function timestamp(s: Pick<TranscriptSegment, "start" | "end">): string | null {
  if (!(s.end > 0) && !(s.start > 0)) return null;
  const total = Math.max(0, Math.floor(s.start));
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}
