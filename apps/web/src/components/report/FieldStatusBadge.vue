<script setup lang="ts">
// C13 contract: <FieldStatusBadge :status="..." />. Status is shown with text and icon, never colour alone.
import { Check, CircleDashed, Sparkles } from "@lucide/vue";
import { Badge } from "@/components/ui/badge";
import type { FieldStatus } from "@/api";

defineProps<{ status: FieldStatus }>();

const look = {
  未提及: { icon: CircleDashed, cls: "border-border bg-muted text-muted-foreground" },
  "AI 草稿": { icon: Sparkles, cls: "border-warning-foreground/40 bg-warning text-warning-foreground" },
  護理師已確認: { icon: Check, cls: "border-success-foreground/40 bg-success text-success-foreground" },
} as const;
</script>

<template>
  <Badge variant="outline" :class="look[status].cls">
    <component :is="look[status].icon" aria-hidden="true" />
    {{ status }}
  </Badge>
</template>
