<script setup lang="ts">
// C6 contract: prop `text` (the report as plain text). PLACEHOLDER(C6): copy text and print only; C6 adds JSON export and a print layout.
import { Check, Copy, Printer } from "@lucide/vue";
import { ref } from "vue";
import { Button } from "@/components/ui/button";

const props = defineProps<{ text: string }>();
const copied = ref(false);

const print = () => window.print();

async function copy() {
  await navigator.clipboard.writeText(props.text);
  copied.value = true;
  setTimeout(() => (copied.value = false), 2000);
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
    </div>
    <pre class="mt-3 hidden whitespace-pre-wrap text-lg text-foreground print:block">{{ text }}</pre>
  </section>
</template>
