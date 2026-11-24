<script setup lang="ts">
// Physician entry: pick a patient from the list. Polls every few seconds and keeps the old list while refreshing.
import { Flag } from "@lucide/vue";
import { storeToRefs } from "pinia";
import RoleHeader from "@/components/common/RoleHeader.vue";
import { Badge } from "@/components/ui/badge";
import { usePolling } from "@/composables/usePolling";
import { clock, statusLabel } from "@/lib/status";
import { ref } from "vue";
import ShortcutHelp from "@/components/common/ShortcutHelp.vue";
import { useShortcuts } from "@/composables/useShortcuts";
import { useDoctorStore } from "@/stores/doctor";

const store = useDoctorStore();
const { sessions, listError } = storeToRefs(store);
usePolling(store.refreshList, 5000);

// ↑ ↓ move between patients, Enter opens the one in focus (#28). Focus, not an index, so the list refreshing
// every few seconds never moves the selection to another patient.
function move(step: number) {
  const links = [...document.querySelectorAll<HTMLElement>("[data-patient-link]")];
  if (!links.length) return;
  const i = links.indexOf(document.activeElement as HTMLElement);
  links[i < 0 ? (step > 0 ? 0 : links.length - 1) : Math.min(links.length - 1, Math.max(0, i + step))].focus();
}
const helpOpen = ref(false);
const shortcutItems = [
  { keys: "↑ ↓", action: "選病患" },
  { keys: "Enter", action: "打開選到的病患" },
  { keys: "?", action: "顯示／隱藏這個說明" },
];
useShortcuts(() => ({
  ArrowDown: () => move(1),
  ArrowUp: () => move(-1),
  "?": () => (helpOpen.value = !helpOpen.value),
  Escape: () => (helpOpen.value = false),
}));
</script>

<template>
  <RoleHeader role="doctor">
    <template #actions><ShortcutHelp v-model:open="helpOpen" :items="shortcutItems" /></template>
  </RoleHeader>
  <main class="mx-auto max-w-5xl px-4 py-4">
    <h2 class="flex flex-wrap items-baseline gap-x-3 text-xl font-bold">
      病患清單
      <span class="text-base font-normal text-muted-foreground">點選病患查看護理師確認後的檢傷報告（鍵盤：↑ ↓ 選病患，Enter 打開）。清單每幾秒自動更新。</span>
    </h2>
    <p v-if="listError" class="mt-2 text-lg font-semibold text-destructive" role="alert">{{ listError }}</p>
    <p v-else-if="!sessions.length" class="mt-4 text-lg text-muted-foreground">目前沒有病患。</p>
    <!-- One line per patient; faint separators instead of a box per row. -->
    <ul v-if="sessions.length" class="mt-2 divide-y divide-border/15 rounded-lg border border-border bg-card">
      <li v-for="s in sessions" :key="s.session_id">
        <RouterLink :to="`/doctor/${s.session_id}`" data-patient-link class="flex min-h-12 flex-wrap items-center gap-x-4 gap-y-1 px-3 py-1.5 outline-none hover:bg-muted focus-visible:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50">
          <span class="w-36 shrink-0 text-lg font-bold">{{ s.visit_no }}</span>
          <span class="min-w-0 flex-1 truncate text-lg" :class="!s.chief_complaint && 'text-muted-foreground'">
            {{ s.chief_complaint || (s.status === "confirmed" ? "未提及主訴" : "尚未確認") }}
          </span>
          <span v-if="s.has_flags" class="flex items-center gap-1 text-base font-semibold text-warning-foreground">
            <Flag class="size-5" aria-hidden="true" />
            有建議留意
          </span>
          <span class="text-base text-muted-foreground tabular-nums">{{ clock(s.started_at) }}</span>
          <Badge :variant="s.status === 'confirmed' ? 'default' : 'outline'">{{ statusLabel[s.status] }}</Badge>
        </RouterLink>
      </li>
    </ul>
  </main>
</template>
