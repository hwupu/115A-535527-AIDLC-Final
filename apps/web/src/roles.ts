export type RoleId = "patient" | "nurse" | "doctor";

export interface Role {
  id: RoleId;
  path: string;
  label: string; // 繁中 UI label
  description: string;
  icon: string;
}

// Demo-only role switch (no login). Order = order of the buttons on the first screen.
export const roles: Role[] = [
  { id: "patient", path: "/patient", label: "病患", description: "查看錄音狀態與核對自己的資料", icon: "🧑" },
  { id: "nurse", path: "/nurse", label: "檢傷護理師", description: "問診、檢視草稿、確認並決定檢傷級數", icon: "🩺" },
  { id: "doctor", path: "/doctor", label: "醫師", description: "唯讀檢視護理師已確認的檢傷報告", icon: "👨‍⚕️" },
];

export const roleById = (id: RoleId): Role => roles.find((r) => r.id === id)!;
