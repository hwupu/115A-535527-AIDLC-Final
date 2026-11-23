<script setup lang="ts">
// Print-only triage record (hidden on screen). Layout and wording: src/report/print.ts.
import { computed } from "vue";
import type { Flag, ReportFields } from "@/api";
import { printRecord } from "@/report/print";

const props = defineProps<{
  fields: ReportFields;
  visitNo: string | null;
  triageLevel: number | null;
  flags: Flag[];
  confirmedAt: string | null;
}>();

const record = computed(() =>
  printRecord(props.fields, {
    visitNo: props.visitNo,
    triageLevel: props.triageLevel,
    flags: props.flags,
    confirmedAt: props.confirmedAt,
  }),
);
</script>

<template>
  <article class="hidden bg-white text-[11pt] leading-relaxed text-black print:block" aria-label="列印用檢傷紀錄">
    <header class="border-b-2 border-black pb-2">
      <h1 class="text-center text-[16pt] font-bold">急診檢傷紀錄</h1>
      <p class="text-center text-[9pt]">模擬資料，非真實病歷</p>
      <dl class="mt-2 flex flex-wrap gap-x-6 gap-y-1">
        <div v-for="item in record.header" :key="item.label" class="flex gap-1">
          <dt class="font-bold">{{ item.label }}：</dt>
          <dd>{{ item.value }}</dd>
        </div>
      </dl>
    </header>

    <section v-for="row in record.rows" :key="row.label" class="grid grid-cols-[6rem_1fr] gap-2 border-b border-black/30 py-2">
      <h2 class="font-bold">{{ row.label }}：</h2>
      <div>
        <p v-for="(line, i) in row.lines" :key="i">{{ line }}</p>
      </div>
    </section>

    <section v-if="record.flags.length" class="grid grid-cols-[6rem_1fr] gap-2 border-b border-black/30 py-2">
      <h2 class="font-bold">系統建議：<span class="block text-[9pt] font-normal">僅供參考</span></h2>
      <ul>
        <li v-for="(flag, i) in record.flags" :key="i">{{ flag }}</li>
      </ul>
    </section>

    <footer class="mt-3 text-[9pt]">
      本紀錄由 AI 草稿經檢傷護理師逐項確認；檢傷級數由護理師決定，AI 不判斷級數。本系統不寫入 HIS，請另行輸入醫院系統。
    </footer>
  </article>
</template>
