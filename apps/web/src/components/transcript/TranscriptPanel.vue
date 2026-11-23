<script setup lang="ts">
// C3 / C5 contract: props (segments, highlight) only. `highlight` is the source sentence of the field the nurse tapped.
// C3: segments appear as they arrive, with a timestamp; partial (not final) results are marked in words.
// PLACEHOLDER(C5): exact-substring highlight; C5 adds fuzzy matching across segments.
import { ArrowDown } from "@lucide/vue";
import { computed, nextTick, ref, watch } from "vue";
import type { TranscriptSegment } from "@/api";
import { timestamp } from "./timestamp";

const props = defineProps<{ segments: TranscriptSegment[]; highlight: string | null }>();
const box = ref<HTMLElement | null>(null);

const label = (s: TranscriptSegment) => (s.speaker === "nurse" ? "護理師" : "病患");

function parts(text: string) {
  const span = props.highlight;
  const i = span ? text.indexOf(span) : -1;
  return i < 0 || !span ? { before: text, match: "", after: "" } : { before: text.slice(0, i), match: span, after: text.slice(i + span.length) };
}

// Follow new lines only while the list is at the bottom; after scrolling up to read, offer a button instead.
const following = ref(true);
const unseen = ref(0);
const NEAR_BOTTOM_PX = 48;
function onScroll() {
  const el = box.value;
  if (!el) return;
  following.value = el.scrollHeight - el.scrollTop - el.clientHeight <= NEAR_BOTTOM_PX;
  if (following.value) unseen.value = 0;
}
function toBottom() {
  const el = box.value;
  if (el) el.scrollTop = el.scrollHeight;
  following.value = true;
  unseen.value = 0;
}

const last = computed(() => props.segments.at(-1));
watch(
  () => [props.segments.length, last.value?.text] as const,
  async ([length], [before]) => {
    await nextTick();
    if (following.value) toBottom();
    else if (length > (before ?? 0)) unseen.value += length - (before ?? 0);
  },
);
watch(
  () => props.highlight,
  async () => {
    await nextTick();
    box.value?.querySelector("mark")?.scrollIntoView({ block: "center", behavior: "smooth" });
  },
);
</script>

<template>
  <section class="relative flex min-h-0 flex-1 flex-col rounded-lg border border-border bg-card" aria-label="逐字稿">
    <h2 class="px-3 pt-2 text-lg font-bold">逐字稿</h2>
    <div ref="box" class="min-h-48 flex-1 overflow-y-auto px-3 pt-1 pb-2" aria-live="polite" @scroll="onScroll">
      <p v-if="!segments.length" class="text-lg text-muted-foreground">尚無內容。開始錄音後，對話會顯示在這裡。</p>
      <ul class="grid gap-1.5">
        <li
          v-for="s in segments"
          :key="s.segment_id"
          class="grid grid-cols-[3.25rem_1fr] items-baseline gap-x-2 text-lg"
          :data-final="s.final"
        >
          <time
            v-if="timestamp(s)"
            class="text-base text-muted-foreground tabular-nums"
            :datetime="`PT${Math.floor(s.start)}S`"
            :aria-label="`錄音第 ${timestamp(s)}`"
          >{{ timestamp(s) }}</time>
          <span v-else class="text-base text-muted-foreground" aria-hidden="true">—</span>
          <span :class="!s.final && 'text-muted-foreground'">
            <!-- Speaker as plain text, not a pill: the patient's lines get the darker colour. -->
            <span class="mr-1 font-bold" :class="s.speaker === 'nurse' ? 'text-muted-foreground' : 'text-primary'">{{ label(s) }}<span v-if="s.source === 'patient_input'" class="font-normal">（自行輸入）</span>：</span>
            {{ parts(s.text).before }}<mark v-if="parts(s.text).match" class="rounded bg-warning px-1 text-warning-foreground">{{ parts(s.text).match }}</mark>{{ parts(s.text).after }}
            <span v-if="!s.final" class="ml-1 text-base italic" data-test="partial">（辨識中…）</span>
          </span>
        </li>
      </ul>
    </div>
    <button
      v-if="unseen > 0"
      type="button"
      class="absolute bottom-3 left-1/2 flex min-h-12 -translate-x-1/2 items-center gap-1.5 rounded-full bg-primary px-4 text-base font-semibold text-primary-foreground shadow"
      data-test="new-lines"
      @click="toBottom"
    >
      <ArrowDown class="size-5" aria-hidden="true" />
      {{ unseen }} 則新內容
    </button>
  </section>
</template>
