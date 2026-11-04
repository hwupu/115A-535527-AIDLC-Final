<script setup lang="ts">
// Read-only confirmed report for the physician. No inputs, no buttons that change data.
import { computed } from "vue";
import VitalsStrip from "./VitalsStrip.vue";
import FlagList from "@/components/report/FlagList.vue";
import SafetyBanner from "@/components/report/SafetyBanner.vue";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ConfirmedReport } from "@/api";
import { fieldDefs, formatValue, sections } from "@/report/schema";

const props = defineProps<{ report: ConfirmedReport }>();

const isVital = (path: string) => path.startsWith("measurement.vitals.");
const rows = computed(() =>
  sections.map((section) => {
    const defs = fieldDefs.filter((d) => d.section === section.id && !isVital(d.path));
    const filled = defs
      .map((def) => ({ def, field: props.report.fields[def.path] }))
      .filter((r) => r.field && r.field.value !== null && formatValue(r.def, r.field.value) !== "");
    const empty = defs.filter((d) => !filled.some((r) => r.def.path === d.path));
    return { section, filled, empty };
  }),
);
const time = computed(() => new Date(props.report.confirmed_at).toLocaleString("zh-TW", { hour12: false }));
</script>

<template>
  <div class="grid gap-4">
    <section class="flex flex-wrap items-center justify-between gap-4 rounded-xl border-2 border-primary bg-card p-4">
      <div>
        <p class="text-lg text-muted-foreground">就診號</p>
        <p class="text-3xl font-bold">{{ report.visit_no }}</p>
        <p class="text-base text-muted-foreground">護理師確認於 {{ time }}</p>
      </div>
      <div class="text-right">
        <p class="text-lg text-muted-foreground">檢傷級數（護理師判定）</p>
        <p class="text-5xl font-bold text-primary">{{ report.triage_level }}</p>
      </div>
    </section>

    <p class="text-lg text-muted-foreground">
      以下內容皆經護理師確認；標示「護理師修改」的項目是護理師更正過系統草稿。
    </p>

    <SafetyBanner :fields="report.fields" readonly />
    <FlagList :flags="report.flags" />
    <VitalsStrip :fields="report.fields" />

    <Card v-for="r in rows" :key="r.section.id">
      <CardHeader>
        <CardTitle>{{ r.section.label }}</CardTitle>
      </CardHeader>
      <CardContent class="grid gap-3">
        <p v-if="!r.filled.length" class="text-lg text-muted-foreground">未提及</p>
        <div v-for="row in r.filled" :key="row.def.path" class="rounded-xl border-2 border-border p-3">
          <div class="flex flex-wrap items-center gap-2">
            <p class="text-base font-semibold text-muted-foreground">{{ row.def.label }}</p>
            <Badge v-if="row.field.source === 'nurse_edit'" variant="outline">護理師修改</Badge>
          </div>
          <p class="text-xl font-semibold wrap-break-word">{{ formatValue(row.def, row.field.value) }}</p>
          <p v-if="row.field.source_span" class="text-base text-muted-foreground">來源：「{{ row.field.source_span }}」</p>
        </div>
        <details v-if="r.empty.length && r.filled.length" class="text-base text-muted-foreground">
          <summary class="min-h-12 cursor-pointer py-2">未提及的項目（{{ r.empty.length }}）</summary>
          <p>{{ r.empty.map((d) => d.label).join("、") }}</p>
        </details>
      </CardContent>
    </Card>
  </div>
</template>
