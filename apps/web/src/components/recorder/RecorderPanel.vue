<script setup lang="ts">
// C2 contract: props (state, level, error, disabled) and emits (start, stop). Keep them; restyle or extend freely.
import { Mic, Square } from "@lucide/vue";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { RecorderState } from "@/composables/useRecorder";

defineProps<{ state: RecorderState; level: number; error: string; disabled?: boolean }>();
defineEmits<{ start: []; stop: [] }>();
</script>

<template>
  <section class="rounded-lg border border-border bg-card px-3 py-2" aria-label="錄音">
    <div class="flex flex-wrap items-center gap-3">
      <Button v-if="state !== 'recording'" class="min-w-40 text-lg" :disabled="disabled" @click="$emit('start')">
        <Mic class="size-6" aria-hidden="true" />
        開始錄音
      </Button>
      <Button v-else variant="destructive" class="min-w-40 text-lg" @click="$emit('stop')">
        <Square class="size-6" aria-hidden="true" />
        停止錄音
      </Button>
      <Badge :variant="state === 'recording' ? 'destructive' : 'outline'" role="status">
        {{ state === "recording" ? "錄音中" : "未錄音" }}
      </Badge>
      <div class="h-3 min-w-24 flex-1 overflow-hidden rounded-full bg-muted" role="meter" aria-label="音量" :aria-valuenow="Math.round(level * 100)" aria-valuemin="0" aria-valuemax="100">
        <div class="h-full bg-primary transition-all" :style="{ width: `${Math.round(level * 100)}%` }" />
      </div>
    </div>
    <p v-if="state === 'denied'" class="mt-2 text-lg font-semibold text-destructive" role="alert">
      麥克風權限被拒絕。請在瀏覽器網址列允許使用麥克風，或改用手動輸入。
    </p>
    <p v-else-if="state === 'error'" class="mt-2 text-lg font-semibold text-destructive" role="alert">
      {{ error || "無法使用麥克風，請改用手動輸入。" }}
    </p>
  </section>
</template>
