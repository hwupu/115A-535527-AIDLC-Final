<script setup lang="ts">
// Elapsed time on the server clock (started_at to finished_at, or to now while running).
import { computed, onMounted, onUnmounted, ref } from "vue";
import type { Run } from "@/api";

const props = defineProps<{ run: Run }>();
const now = ref(Date.now());
let timer: ReturnType<typeof setInterval> | undefined;
onMounted(() => (timer = setInterval(() => (now.value = Date.now()), 250)));
onUnmounted(() => clearInterval(timer));

const text = computed(() => {
  if (!props.run.started_at) return "00:00";
  const end = props.run.finished_at ? Date.parse(props.run.finished_at) : now.value;
  const sec = Math.max(0, Math.floor((end - Date.parse(props.run.started_at)) / 1000));
  return `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`;
});
</script>

<template>
  <p class="text-6xl font-bold tabular-nums" role="timer" aria-label="計時">{{ text }}</p>
</template>
