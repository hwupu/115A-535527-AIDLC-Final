<script setup lang="ts">
// C6 contract: prop `text` (the report as plain text). PLACEHOLDER(C6): copy text and print only; C6 adds JSON export and a print layout.
import { Check, Copy, Printer } from "@lucide/vue";
import { ref } from "vue";
import { Button } from "@/components/ui/button";

const props = defineProps<{ text: string; report?: unknown }>();
const copied = ref(false);
const error = ref("");

const print = () => window.print();

async function copy() {
  try {
    await navigator.clipboard.writeText(props.text);
    copied.value = true;
    error.value = "";
    setTimeout(() => (copied.value = false), 2000);
  } catch { error.value = "無法使用剪貼簿，請選取下方文字複製。"; }
}
function downloadJson() {
  const url = URL.createObjectURL(new Blob([JSON.stringify(props.report, null, 2)], { type: "application/json" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "confirmed-report.json";
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
</script>

<template>
  <section class="rounded-xl border-2 border-success-foreground/40 bg-success p-4 text-success-foreground">
    <h2 class="flex items-center gap-2 text-xl font-bold">
      <Check class="size-6" aria-hidden="true" />
      報告已儲存
    </h2>
    <p class="mt-1 text-lg">請複製或列印後，手動輸入醫院系統（本系統不會寫入 HIS）。</p>
    <div class="mt-3 flex flex-wrap gap-3 print:hidden">
      <Button size="lg" variant="outline" @click="copy">
        <Copy aria-hidden="true" />
        {{ copied ? "已複製" : "複製文字" }}
      </Button>
      <Button size="lg" variant="outline" @click="print">
        <Printer aria-hidden="true" />
        列印
      </Button>
      <Button v-if="report" size="lg" variant="outline" @click="downloadJson">下載 JSON</Button>
    </div>
    <p v-if="error" role="alert">{{ error }}</p>
    <textarea v-if="error" :value="text" readonly aria-label="報告文字" class="mt-2 w-full bg-white p-3" />
    <pre class="mt-3 hidden whitespace-pre-wrap text-lg text-foreground print:block">{{ text }}</pre>
  </section>
</template>
