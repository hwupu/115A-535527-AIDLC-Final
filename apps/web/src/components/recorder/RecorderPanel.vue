<script setup lang="ts">
// C2 contract: props (state, level, error, disabled) and emits (start, stop). Keep them; restyle or extend freely.
// `connection` is optional: without it the panel does not show the server link.
import { Mic, Square, Wifi, WifiOff } from "@lucide/vue";
import { computed, onUnmounted, ref, watch } from "vue";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RECORDER_MESSAGES, type RecorderState } from "@/composables/useRecorder";

const props = defineProps<{
  state: RecorderState;
  level: number;
  error: string;
  disabled?: boolean;
  connection?: "idle" | "open" | "closed";
}>();
defineEmits<{ start: []; stop: [] }>();

const recording = computed(() => props.state === "recording");
const percent = computed(() => Math.round(Math.min(1, Math.max(0, props.level)) * 100));

// Elapsed time while recording, so the nurse can tell the microphone is really running.
const seconds = ref(0);
let timer: ReturnType<typeof setInterval> | undefined;
watch(
  recording,
  (on) => {
    clearInterval(timer);
    seconds.value = 0;
    if (on) timer = setInterval(() => seconds.value++, 1000);
  },
  { immediate: true },
);
onUnmounted(() => clearInterval(timer));
const elapsed = computed(() => `${String(Math.floor(seconds.value / 60)).padStart(2, "0")}:${String(seconds.value % 60).padStart(2, "0")}`);

const message = computed(() => {
  if (props.state === "denied") return props.error || RECORDER_MESSAGES.denied;
  if (props.state === "error") return props.error || RECORDER_MESSAGES.failed;
  return "";
});
const link = computed(() =>
  props.connection === "open"
    ? { text: "已連線", icon: Wifi, cls: "text-foreground" }
    : props.connection === "closed"
      ? { text: "連線中斷", icon: WifiOff, cls: "text-destructive" }
      : props.connection === "idle"
        ? { text: "連線中…", icon: Wifi, cls: "text-muted-foreground" }
        : null,
);
</script>

<template>
  <section class="rounded-lg border border-border bg-card px-3 py-2" aria-label="錄音">
    <div class="flex flex-wrap items-center gap-3">
      <Button v-if="!recording" class="min-w-40 text-lg" :disabled="disabled" @click="$emit('start')">
        <Mic class="size-6" aria-hidden="true" />
        {{ state === "denied" || state === "error" ? "重試錄音" : "開始錄音" }}
      </Button>
      <Button v-else variant="destructive" class="min-w-40 text-lg" @click="$emit('stop')">
        <Square class="size-6" aria-hidden="true" />
        停止錄音
      </Button>
      <!-- Text plus a dot, not colour alone. -->
      <Badge :variant="recording ? 'destructive' : 'outline'" role="status" class="gap-1.5 text-base">
        <span class="size-2.5 rounded-full" :class="recording ? 'animate-pulse bg-current' : 'border border-current'" aria-hidden="true" />
        <span>{{ recording ? `錄音中 ${elapsed}` : "未錄音" }}</span>
      </Badge>
      <div
        class="h-3 min-w-24 flex-1 overflow-hidden rounded-full bg-muted"
        role="meter"
        aria-label="音量"
        :aria-valuenow="percent"
        aria-valuemin="0"
        aria-valuemax="100"
      >
        <div class="h-full bg-primary transition-[width] duration-100" :style="{ width: `${percent}%` }" />
      </div>
      <span v-if="link" class="flex items-center gap-1 text-base font-semibold" :class="link.cls" data-test="connection">
        <component :is="link.icon" class="size-5" aria-hidden="true" />
        {{ link.text }}
      </span>
    </div>
    <p v-if="message" class="mt-2 text-lg font-semibold text-destructive" role="alert">{{ message }}</p>
    <p v-else-if="recording && connection === 'closed'" class="mt-2 text-lg font-semibold text-destructive" role="alert">
      與伺服器的連線中斷：錄音停止後可能無法送出，建議先停止並改用手動輸入。
    </p>
  </section>
</template>
