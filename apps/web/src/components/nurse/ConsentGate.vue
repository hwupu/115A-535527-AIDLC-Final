<script setup lang="ts">
import { Button } from "@/components/ui/button";
import type { Consent } from "@/stores/nurseSession";

defineProps<{ consent: Consent }>();
defineEmits<{ set: [value: Consent] }>();
</script>

<template>
  <section class="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-primary bg-card px-3 py-2" aria-label="錄音同意">
    <div class="min-w-0 flex-1">
      <h2 class="text-lg font-bold">病患是否同意錄音，並由系統協助整理問診內容？</h2>
      <p class="text-base text-muted-foreground">
        錄音只用於整理這次問診，預設不保存音檔。若不同意，請直接手動填寫右側報告。
      </p>
    </div>
    <div class="flex flex-wrap gap-2">
      <Button :variant="consent === 'yes' ? 'default' : 'outline'" @click="$emit('set', 'yes')">同意，可以錄音</Button>
      <Button :variant="consent === 'no' ? 'default' : 'outline'" @click="$emit('set', 'no')">不同意，改手動填寫</Button>
    </div>
  </section>
</template>
