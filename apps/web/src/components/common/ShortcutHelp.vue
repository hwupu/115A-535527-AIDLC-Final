<script setup lang="ts">
// The 「?」 button and the list of keyboard shortcuts for the current screen (#28). Opened with the button or 「?」.
import { Keyboard, X } from "@lucide/vue";
import { Button } from "@/components/ui/button";

defineProps<{ items: { keys: string; action: string }[]; note?: string }>();
const open = defineModel<boolean>("open", { default: false });
</script>

<template>
  <div class="relative print:hidden">
    <Button variant="ghost" size="sm" :aria-expanded="open" aria-controls="shortcut-help" @click="open = !open">
      <Keyboard aria-hidden="true" />
      快捷鍵（?）
    </Button>
    <div
      v-if="open"
      id="shortcut-help"
      role="dialog"
      aria-label="鍵盤快捷鍵"
      class="fixed top-20 right-4 z-20 w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-border bg-card p-3 shadow-lg"
      @keydown.esc.stop="open = false"
    >
      <div class="mb-2 flex items-center justify-between">
        <p class="text-lg font-bold">鍵盤快捷鍵</p>
        <Button variant="ghost" size="icon-sm" aria-label="關閉" @click="open = false"><X aria-hidden="true" /></Button>
      </div>
      <dl class="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-base">
        <template v-for="i in items" :key="i.keys">
          <dt><kbd class="rounded border border-border bg-muted px-1.5 font-mono text-sm">{{ i.keys }}</kbd></dt>
          <dd>{{ i.action }}</dd>
        </template>
      </dl>
      <p class="mt-2 text-sm text-muted-foreground">打字時快捷鍵不會作用。{{ note }}</p>
    </div>
  </div>
</template>
