<script setup lang="ts">
// Measured vitals at a glance. Values only: which ones are worrying is the backend's flag (B8) and the nurse's call.
import { computed } from "vue";
import type { ReportFields } from "@/api";

const props = defineProps<{ fields: ReportFields }>();

const v = (path: string) => props.fields[`measurement.vitals.${path}`]?.value;
const items = computed(() => {
  const bp = v("bp_sys") != null && v("bp_dia") != null ? `${v("bp_sys")}/${v("bp_dia")}` : null;
  return [
    { label: "血壓", value: bp, unit: "mmHg", note: v("bp_site") ? `量測部位：${v("bp_site")}` : "" },
    { label: "脈搏", value: v("hr"), unit: "次/分", note: "" },
    { label: "血氧", value: v("spo2"), unit: "%", note: "" },
    { label: "體溫", value: v("temp_c"), unit: "°C", note: "" },
  ];
});
</script>

<template>
  <!-- One strip, four cells: no box per vital. -->
  <section class="grid grid-cols-2 gap-x-4 gap-y-2 rounded-lg border border-border bg-card px-4 py-2 md:grid-cols-4" aria-label="生命徵象">
    <div v-for="i in items" :key="i.label">
      <p class="text-base font-semibold text-muted-foreground">{{ i.label }}</p>
      <p class="font-bold" :class="i.value == null ? 'text-xl text-muted-foreground' : 'text-2xl'">
        {{ i.value ?? "未提及" }}<span v-if="i.value != null" class="ml-1 text-base font-normal text-muted-foreground">{{ i.unit }}</span>
      </p>
      <p v-if="i.note" class="text-base text-muted-foreground">{{ i.note }}</p>
    </div>
  </section>
</template>
