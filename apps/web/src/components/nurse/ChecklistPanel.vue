<script setup lang="ts">
// C18 (#87): the 查核表 questions, ticked when their report fields have a value. A fixed list, never AI-generated.
// Tapping a question jumps to its field. Collapsible so it never pushes the report off a tablet screen.
import { Check, ChevronDown, ChevronUp, Circle, CircleDot, Sparkles } from "@lucide/vue";
import { computed, ref } from "vue";
import type { ReportFields } from "@/api";
import { Button } from "@/components/ui/button";
import { checklistRows, type ChecklistStatus } from "@/intake/nurseChecklist";

const props = defineProps<{ fields: ReportFields }>();
defineEmits<{ jump: [path: string] }>();

const open = ref(true);
const rows = computed(() => checklistRows(props.fields));
const answered = computed(() => rows.value.filter((r) => r.status === "AI 草稿" || r.status === "護理師已確認").length);

// Status is shown with text and icon, never colour alone (same looks as FieldStatusBadge).
const look: Record<ChecklistStatus, { icon: typeof Check; cls: string }> = {
  未問: { icon: Circle, cls: "text-muted-foreground" },
  部分: { icon: CircleDot, cls: "text-foreground" },
  "AI 草稿": { icon: Sparkles, cls: "bg-warning text-warning-foreground" },
  護理師已確認: { icon: Check, cls: "bg-success text-success-foreground" },
};
</script>

<template>
  <section class="rounded-xl border border-border bg-card" aria-labelledby="checklist-title">
    <button
      type="button"
      class="flex w-full items-center justify-between gap-3 px-4 py-2 text-left"
      :aria-expanded="open"
      aria-controls="checklist-body"
      @click="open = !open"
    >
      <h2 id="checklist-title" class="text-lg font-bold">問診提示（查核表） <span class="font-normal text-muted-foreground">已回答 {{ answered }} / {{ rows.length }}</span></h2>
      <component :is="open ? ChevronUp : ChevronDown" class="size-6 shrink-0" aria-hidden="true" />
      <span class="sr-only">{{ open ? "收合" : "展開" }}</span>
    </button>
    <ol v-show="open" id="checklist-body" class="grid gap-1 px-2 pb-2 md:grid-cols-2">
      <li v-for="r in rows" :key="r.id">
        <Button
          variant="ghost"
          class="h-auto w-full items-start justify-start gap-2 whitespace-normal px-2 py-1.5 text-left font-normal"
          :data-testid="`checklist-${r.id}`"
          :data-status="r.status"
          @click="$emit('jump', r.jumpTo)"
        >
          <component :is="look[r.status].icon" class="mt-1 size-5 shrink-0" :class="r.status === '未問' ? 'text-muted-foreground' : ''" aria-hidden="true" />
          <span class="grid min-w-0 gap-0.5">
            <span class="text-base" :class="r.status === '未問' ? 'font-semibold' : 'text-muted-foreground'">{{ r.question }}</span>
            <span class="flex flex-wrap gap-1 text-sm">
              <span class="rounded px-1.5" :class="look[r.status].cls">{{ r.status }}</span>
              <span v-if="r.status === '部分'" class="text-muted-foreground">還沒問：{{ r.missing.join("、") }}</span>
              <span v-if="r.note" class="text-muted-foreground">{{ r.note }}</span>
            </span>
          </span>
        </Button>
      </li>
    </ol>
  </section>
</template>
