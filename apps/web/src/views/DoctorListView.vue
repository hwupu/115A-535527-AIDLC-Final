<script setup lang="ts">
// Physician entry: pick a patient from the list. Polls every few seconds and keeps the old list while refreshing.
import { Flag } from "@lucide/vue";
import { storeToRefs } from "pinia";
import RoleHeader from "@/components/common/RoleHeader.vue";
import { Badge } from "@/components/ui/badge";
import { usePolling } from "@/composables/usePolling";
import { clock, statusLabel } from "@/lib/status";
import { useDoctorStore } from "@/stores/doctor";

const store = useDoctorStore();
const { sessions, listError } = storeToRefs(store);
usePolling(store.refreshList, 5000);
</script>

<template>
  <RoleHeader role="doctor" />
  <main class="mx-auto max-w-5xl px-4 py-4">
    <h2 class="flex flex-wrap items-baseline gap-x-3 text-xl font-bold">
      病患清單
      <span class="text-base font-normal text-muted-foreground">點選病患查看護理師確認後的檢傷報告。清單每幾秒自動更新。</span>
    </h2>
    <p v-if="listError" class="mt-2 text-lg font-semibold text-destructive" role="alert">{{ listError }}</p>
    <p v-else-if="!sessions.length" class="mt-4 text-lg text-muted-foreground">目前沒有病患。</p>
    <!-- One line per patient; faint separators instead of a box per row. -->
    <ul v-if="sessions.length" class="mt-2 divide-y divide-border/15 rounded-lg border border-border bg-card">
      <li v-for="s in sessions" :key="s.session_id">
        <RouterLink :to="`/doctor/${s.session_id}`" class="flex min-h-12 flex-wrap items-center gap-x-4 gap-y-1 px-3 py-1.5 hover:bg-muted">
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
