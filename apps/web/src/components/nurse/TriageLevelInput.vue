<script setup lang="ts">
// 檢傷級數 is decided and entered by the nurse only. It starts empty and nothing from the api or AI can set it.
import { Button } from "@/components/ui/button";
import type { TriageLevel } from "@/api";

defineProps<{ modelValue: TriageLevel | null; disabled?: boolean }>();
defineEmits<{ "update:modelValue": [value: TriageLevel | null] }>();

const levels: TriageLevel[] = [1, 2, 3, 4, 5];
</script>

<template>
  <fieldset class="flex flex-wrap items-center gap-2" :disabled="disabled">
    <legend class="sr-only">檢傷級數</legend>
    <span class="text-lg font-bold">檢傷級數（由護理師決定）</span>
    <Button
      v-for="n in levels"
      :key="n"
      :variant="modelValue === n ? 'default' : 'outline'"
      size="icon-lg"
      class="text-xl"
      :aria-pressed="modelValue === n"
      :aria-label="`第 ${n} 級`"
      @click="$emit('update:modelValue', modelValue === n ? null : n)"
    >
      {{ n }}
    </Button>
  </fieldset>
</template>
