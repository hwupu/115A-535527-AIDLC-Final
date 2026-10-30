<script setup lang="ts">
// C7: danger-sign flags. Styled as suggestions for the nurse to judge, never as findings or orders.
import { Lightbulb } from "@lucide/vue";
import type { Flag } from "@/api";

defineProps<{ flags: Flag[] }>();
</script>

<template>
  <section v-if="flags.length" class="rounded-xl border-2 border-dashed border-primary bg-card p-4" aria-label="系統建議留意">
    <h3 class="flex items-center gap-2 text-xl font-bold">
      <Lightbulb class="size-6 text-primary" aria-hidden="true" />
      建議留意
    </h3>
    <p class="text-base text-muted-foreground">系統根據對話提示，非診斷，由護理師判斷。</p>
    <ul class="mt-2 grid gap-2">
      <li v-for="f in flags" :key="f.text" class="rounded-lg bg-muted px-3 py-2 text-lg">
        <span class="font-semibold">{{ f.text }}</span>
        <span class="block text-base text-muted-foreground">依據：「{{ f.basis }}」</span>
      </li>
    </ul>
  </section>
</template>
