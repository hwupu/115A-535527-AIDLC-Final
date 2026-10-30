<script setup lang="ts">
// Confirm is a deliberate action: tapping it while something is missing lists what is missing instead of saving.
import { ref } from "vue";
import TriageLevelInput from "./TriageLevelInput.vue";
import { Button } from "@/components/ui/button";
import type { TriageLevel } from "@/api";
import type { FieldDef } from "@/report/schema";

const props = defineProps<{ level: TriageLevel | null; drafts: FieldDef[]; blockers: string[]; busy: boolean }>();
const emit = defineEmits<{ "update:level": [value: TriageLevel | null]; confirm: []; jump: [path: string] }>();

const showBlockers = ref(false);

function tryConfirm() {
  if (props.blockers.length) showBlockers.value = true;
  else emit("confirm");
}
</script>

<template>
  <div class="border-t-2 border-border bg-card px-4 py-3 shadow-[0_-4px_12px_rgb(0_0_0/0.08)] print:hidden">
    <div v-if="showBlockers && blockers.length" class="mb-3 rounded-xl border-2 border-warning-foreground/50 bg-warning p-3 text-warning-foreground" role="alert">
      <p class="text-lg font-bold">還不能儲存：{{ blockers.join("；") }}</p>
      <ul v-if="drafts.length" class="mt-2 flex flex-wrap gap-2">
        <li v-for="d in drafts" :key="d.path">
          <Button variant="outline" size="sm" @click="$emit('jump', d.path)">{{ d.label }}</Button>
        </li>
      </ul>
    </div>
    <div class="flex flex-wrap items-center justify-between gap-3">
      <TriageLevelInput :model-value="level" @update:model-value="$emit('update:level', $event)" />
      <Button size="lg" class="h-14 min-w-56 text-xl" :disabled="busy" @click="tryConfirm">確認並儲存</Button>
    </div>
  </div>
</template>
