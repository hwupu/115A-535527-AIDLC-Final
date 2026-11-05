<script setup lang="ts">
// C3 / C5 contract: props (segments, highlight) only. `highlight` is the source sentence of the field the nurse tapped.
// PLACEHOLDER(C3, C5): plain list and exact-substring highlight; C5 adds fuzzy matching across segments.
import { nextTick, ref, watch } from "vue";
import type { TranscriptSegment } from "@/api";

const props = defineProps<{ segments: TranscriptSegment[]; highlight: string | null }>();
const box = ref<HTMLElement | null>(null);

const label = (s: TranscriptSegment) => (s.speaker === "nurse" ? "護理師" : "病患");

function parts(text: string) {
  const span = props.highlight;
  const i = span ? text.indexOf(span) : -1;
  return i < 0 || !span ? { before: text, match: "", after: "" } : { before: text.slice(0, i), match: span, after: text.slice(i + span.length) };
}

watch(
  () => [props.segments.length, props.highlight],
  async () => {
    await nextTick();
    const mark = box.value?.querySelector("mark");
    if (mark) mark.scrollIntoView({ block: "center", behavior: "smooth" });
    else if (box.value) box.value.scrollTop = box.value.scrollHeight;
  },
);
</script>

<template>
  <section class="flex min-h-0 flex-1 flex-col rounded-lg border border-border bg-card" aria-label="逐字稿">
    <h2 class="px-3 pt-2 text-lg font-bold">逐字稿</h2>
    <div ref="box" class="min-h-48 flex-1 overflow-y-auto px-3 pt-1 pb-2" aria-live="polite">
      <p v-if="!segments.length" class="text-lg text-muted-foreground">尚無內容。開始錄音後，對話會顯示在這裡。</p>
      <ul class="grid gap-1.5">
        <li v-for="s in segments" :key="s.segment_id" class="text-lg" :class="!s.final && 'opacity-60'">
          <!-- Speaker as plain text, not a pill: the patient's lines get the darker colour. -->
          <span class="mr-1 font-bold" :class="s.speaker === 'nurse' ? 'text-muted-foreground' : 'text-primary'">{{ label(s) }}<span v-if="s.source === 'patient_input'" class="font-normal">（自行輸入）</span>：</span>
          {{ parts(s.text).before }}<mark v-if="parts(s.text).match" class="rounded bg-warning px-1 text-warning-foreground">{{ parts(s.text).match }}</mark>{{ parts(s.text).after }}
        </li>
      </ul>
    </div>
  </section>
</template>
