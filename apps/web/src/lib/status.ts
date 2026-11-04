import type { SessionStatus } from "@/api";

export const statusLabel: Record<SessionStatus, string> = {
  intake: "輸入中",
  ready: "等候中",
  in_progress: "進行中",
  confirmed: "已確認",
};

export const clock = (iso: string) => new Date(iso).toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit" });
