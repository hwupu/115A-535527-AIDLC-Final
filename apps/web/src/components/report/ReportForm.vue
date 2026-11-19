<script setup lang="ts">
// C4: the editable draft form. Rows come from the schema; every change goes up as an event.
import FieldRow from "./FieldRow.vue";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import type { FieldValue, ReportFields } from "@/api";
import { fieldDefs, sections } from "@/report/schema";

defineProps<{ fields: ReportFields; selectedPath: string | null; readonly?: boolean }>();
defineEmits<{
  select: [path: string];
  edit: [path: string, value: FieldValue];
  confirm: [path: string];
}>();

const draftCount = (fields: ReportFields, section: string) =>
  fieldDefs.filter((d) => d.section === section && fields[d.path]?.status === "AI 草稿").length;
</script>

<template>
  <div class="grid gap-3">
    <Card v-for="section in sections" :key="section.id" class="compact:gap-1 compact:pt-2 compact:pb-1">
      <CardHeader>
        <CardTitle class="flex items-center justify-between gap-3">
          {{ section.label }}
          <span v-if="draftCount(fields, section.id)" class="text-base font-semibold text-warning-foreground">
            {{ draftCount(fields, section.id) }} 項待確認
          </span>
        </CardTitle>
      </CardHeader>
      <!-- Faint separators only: rows are told apart by spacing, not boxes. -->
      <ul class="divide-y divide-border/15">
        <FieldRow
          v-for="def in fieldDefs.filter((d) => d.section === section.id)"
          :key="def.path"
          :def="def"
          :field="fields[def.path]"
          :selected="selectedPath === def.path"
          :readonly="readonly"
          @select="$emit('select', $event)"
          @edit="(p, v) => $emit('edit', p, v)"
          @confirm="$emit('confirm', $event)"
        />
      </ul>
    </Card>
  </div>
</template>
