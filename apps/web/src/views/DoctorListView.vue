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
  <main class="mx-auto max-w-4xl px-6 py-8">
    <h2 class="text-2xl font-bold">病患清單</h2>
    <p class="text-lg text-muted-foreground">點選病患查看護理師確認後的檢傷報告。清單每幾秒自動更新。</p>
    <p v-if="listError" class="mt-3 text-lg font-semibold text-destructive" role="alert">{{ listError }}</p>
    <p v-else-if="!sessions.length" class="mt-6 text-xl text-muted-foreground">目前沒有病患。</p>
    <ul class="mt-4 grid gap-3">
      <li v-for="s in sessions" :key="s.session_id">
        <RouterLink
          :to="`/doctor/${s.session_id}`"
          class="flex min-h-20 flex-wrap items-center justify-between gap-3 rounded-xl border-2 border-border bg-card px-5 py-3 transition hover:border-primary active:scale-[0.99]"
        >
          <div class="min-w-0">
            <p class="text-2xl font-bold">{{ s.visit_no }}</p>
            <p class="text-lg text-muted-foreground">{{ s.chief_complaint || (s.status === "confirmed" ? "未提及主訴" : "尚未確認") }}</p>
          </div>
          <div class="flex items-center gap-3">
            <span v-if="s.has_flags" class="flex items-center gap-1 text-base font-semibold text-warning-foreground">
              <Flag class="size-5" aria-hidden="true" />
              有建議留意
            </span>
            <span class="text-lg text-muted-foreground">{{ clock(s.started_at) }}</span>
            <Badge :variant="s.status === 'confirmed' ? 'default' : 'outline'">{{ statusLabel[s.status] }}</Badge>
          </div>
        </RouterLink>
      </li>
    </ul>
  </main>
</template>
