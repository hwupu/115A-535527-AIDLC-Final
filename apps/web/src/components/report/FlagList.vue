<script setup lang="ts">
// C7: danger-sign flags. Styled as suggestions for the nurse to judge, never as findings or orders.
import { Lightbulb } from "@lucide/vue";
import type { Flag } from "@/api";

defineProps<{ flags: Flag[] }>();
</script>

<template>
  <section v-if="flags.length" class="rounded-lg border border-dashed border-primary bg-card px-3 py-2" aria-label="系統建議留意">
    <h3 class="flex flex-wrap items-center gap-x-2 text-lg font-bold">
      <Lightbulb class="size-5 text-primary" aria-hidden="true" />
      建議留意
      <span class="text-base font-normal text-muted-foreground">系統根據對話提示，非診斷，由護理師判斷。</span>
    </h3>
    <ul class="mt-1 grid gap-1">
      <li v-for="f in flags" :key="f.text" class="text-lg">
        <span class="font-semibold">・{{ f.text }}</span>
        <span class="ml-2 text-base text-muted-foreground">依據：「{{ f.basis }}」</span>
      </li>
    </ul>
  </section>
</template>
