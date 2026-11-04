<script setup lang="ts">
import { WifiOff } from "@lucide/vue";
import { computed } from "vue";
import type { Connection } from "@/stores/nurseSession";

const props = defineProps<{ connection: Connection }>();

// A failure never blocks triage: every message says the manual form still works.
const messages = computed(() => {
  const c = props.connection;
  const out: string[] = [];
  if (c.ws === "closed") out.push("與伺服器的連線中斷，已輸入的內容會保留，仍可手動填寫。");
  if (c.stt === "down") out.push("語音辨識目前無法使用，請改用手動輸入。");
  if (c.llm === "slow") out.push("草稿產生較慢，逐字稿仍會持續顯示。");
  if (c.llm === "down") out.push("草稿功能暫停，請手動填寫欄位。");
  return out;
});
</script>

<template>
  <div v-if="messages.length" class="grid gap-2" role="alert">
    <p v-for="m in messages" :key="m" class="flex items-center gap-2 rounded-xl border-2 border-destructive bg-card px-4 py-3 text-lg font-semibold text-destructive">
      <WifiOff class="size-6 shrink-0" aria-hidden="true" />
      {{ m }}
    </p>
  </div>
</template>
