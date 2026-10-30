<script setup lang="ts">
import { Button } from "@/components/ui/button";
import type { Consent } from "@/stores/nurseSession";

defineProps<{ consent: Consent }>();
defineEmits<{ set: [value: Consent] }>();
</script>

<template>
  <section class="rounded-xl border-2 border-primary bg-card p-4" aria-label="錄音同意">
    <h2 class="text-xl font-bold">病患是否同意錄音，並由系統協助整理問診內容？</h2>
    <p class="mt-1 text-lg text-muted-foreground">
      錄音只用於整理這次問診，預設不保存音檔。若不同意，請直接手動填寫右側報告。
    </p>
    <div class="mt-3 flex flex-wrap gap-3">
      <Button size="lg" :variant="consent === 'yes' ? 'default' : 'outline'" @click="$emit('set', 'yes')">同意，可以錄音</Button>
      <Button size="lg" :variant="consent === 'no' ? 'default' : 'outline'" @click="$emit('set', 'no')">不同意，改手動填寫</Button>
    </div>
  </section>
</template>
