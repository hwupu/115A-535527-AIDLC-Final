<script setup lang="ts">
// C7: 量測禁忌 and 「禁止治療」手圈 reminder. A reminder for the nurse, not a decision.
import { ShieldAlert } from "@lucide/vue";
import { computed } from "vue";
import { Button } from "@/components/ui/button";
import type { FieldValue, ReportFields } from "@/api";

const props = defineProps<{ fields: ReportFields; readonly?: boolean }>();
const emit = defineEmits<{ edit: [path: string, value: FieldValue] }>();

const restrictions = computed(() => {
  const v = props.fields["measurement.restrictions"]?.value;
  return Array.isArray(v) ? v : [];
});
const wristband = computed(() => props.fields["measurement.wristband_no_treatment"]?.value === true);
const fromAi = computed(() => props.fields["measurement.restrictions"]?.status === "AI 草稿");
</script>

<template>
  <section v-if="restrictions.length" class="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-warning-foreground/40 bg-warning px-3 py-2 text-warning-foreground" role="note" aria-label="量測禁忌提醒">
    <div class="min-w-0 flex-1">
      <h3 class="flex items-center gap-2 text-lg font-bold">
        <ShieldAlert class="size-6 shrink-0" aria-hidden="true" />
        量測禁忌：{{ restrictions.join("、") }}
      </h3>
      <p class="text-base">
        請避開該側量測血壓與注射，並確認已戴「禁止治療」手圈。<span v-if="fromAi">（系統從對話偵測，請確認。）</span>
      </p>
    </div>
    <Button v-if="!readonly" :variant="wristband ? 'default' : 'outline'" :aria-pressed="wristband" @click="emit('edit', 'measurement.wristband_no_treatment', !wristband)">
      {{ wristband ? "已戴手圈 ✓" : "尚未確認手圈：按此標示已戴" }}
    </Button>
  </section>
</template>
