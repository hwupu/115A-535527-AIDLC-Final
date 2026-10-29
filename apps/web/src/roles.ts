import type { Component } from "vue";
import { FlaskConical, ClipboardList, Stethoscope, UserRound } from "@lucide/vue";

export type RoleId = "patient" | "nurse" | "doctor" | "admin";

export interface Role {
  id: RoleId;
  path: string;
  label: string; // 繁中 UI label
  description: string;
  icon: Component;
}

// Demo-only role switch (no login). Order = order of the buttons on the first screen.
export const roles: Role[] = [
  { id: "patient", path: "/patient", label: "病患", description: "以語音或文字說明狀況，結束時取得就診號", icon: UserRound },
  { id: "nurse", path: "/nurse", label: "檢傷護理師", description: "問診、檢視草稿、確認並決定檢傷級數", icon: Stethoscope },
  { id: "doctor", path: "/doctor", label: "醫師", description: "從病患清單選擇，唯讀檢視已確認的檢傷報告", icon: ClipboardList },
  { id: "admin", path: "/admin", label: "管理者", description: "評估模式：選擇情境、計時、查看事件紀錄", icon: FlaskConical },
];

export const roleById = (id: RoleId): Role => roles.find((r) => r.id === id)!;
