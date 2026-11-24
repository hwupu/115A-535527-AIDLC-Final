<script setup lang="ts">
// The 「快捷鍵」 call to action and the list of keyboard shortcuts for the current screen (#28).
// Meant to sit at the bottom right of the screen; the list opens above the button. Also toggled with 「?」.
// The parent places it (fixed, or floating above a sticky bar).
import { Keyboard, X } from "@lucide/vue";
import { Button } from "@/components/ui/button";

defineProps<{ items: { keys: string; action: string }[]; note?: string }>();
const open = defineModel<boolean>("open", { default: false });
</script>

<template>
  <!-- No position here: the parent gives it one (fixed or absolute), which also anchors the list above the button. -->
  <div class="print:hidden">
    <div
      v-if="open"
      id="shortcut-help"
      role="dialog"
      aria-label="鍵盤快捷鍵"
      class="absolute right-0 bottom-full mb-2 w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-border bg-card p-3 shadow-lg"
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
    <Button
      variant="secondary"
      class="rounded-full border border-border shadow-md"
      :aria-expanded="open"
      aria-controls="shortcut-help"
      @click="open = !open"
    >
      <Keyboard aria-hidden="true" />
      鍵盤快捷鍵
      <kbd class="rounded border border-border bg-card px-1.5 font-mono text-sm">?</kbd>
    </Button>
  </div>
</template>
