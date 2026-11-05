<script setup lang="ts">
// Nurse entry: open a patient by 就診號, pick from the waiting list, or start a new session.
import { Plus, Search } from "@lucide/vue";
import { onMounted, onUnmounted, ref } from "vue";
import { api } from "@/api";
import type { SessionSummary } from "@/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { clock, statusLabel } from "@/lib/status";
import { useNurseSessionStore } from "@/stores/nurseSession";

const store = useNurseSessionStore();
const visitNo = ref("");
const list = ref<SessionSummary[]>([]);
const listError = ref("");
let timer: ReturnType<typeof setInterval> | undefined;

async function refresh() {
  try {
    list.value = await api.listSessions({ status: ["ready", "in_progress", "confirmed"] });
    listError.value = "";
  } catch (e) {
    listError.value = e instanceof Error ? e.message : "無法取得清單";
  }
}

onMounted(() => {
  refresh();
  timer = setInterval(refresh, 5000);
});
onUnmounted(() => clearInterval(timer));
</script>

<template>
  <main class="mx-auto grid max-w-6xl items-start gap-4 px-4 py-4 md:grid-cols-[2fr_3fr]">
    <Card>
      <CardHeader>
        <CardTitle>輸入就診號</CardTitle>
        <CardDescription>請病患念出螢幕上的就診號（例如 SIM-000001）。</CardDescription>
      </CardHeader>
      <CardContent class="grid gap-3">
        <form class="flex flex-wrap items-end gap-2" @submit.prevent="store.openByVisitNo(visitNo)">
          <div class="grid gap-1">
            <Label for="visit-no">就診號</Label>
            <Input id="visit-no" v-model="visitNo" class="w-52" placeholder="SIM-000001" autocomplete="off" />
          </div>
          <Button type="submit" :disabled="!visitNo.trim() || store.busy">
            <Search aria-hidden="true" />
            開啟
          </Button>
        </form>
        <Button variant="outline" :disabled="store.busy" @click="store.startNew()">
          <Plus aria-hidden="true" />
          開始新的問診（病患沒有先輸入）
        </Button>
        <p v-if="store.error" class="text-lg font-semibold text-destructive" role="alert">{{ store.error }}</p>
      </CardContent>
    </Card>

    <Card class="compact:pb-1">
      <CardHeader>
        <CardTitle>病患清單</CardTitle>
        <CardDescription>病患完成輸入後會出現在這裡，每幾秒更新。</CardDescription>
      </CardHeader>
      <p v-if="listError" class="px-3 text-lg font-semibold text-destructive" role="alert">{{ listError }}</p>
      <p v-else-if="!list.length" class="px-3 pb-2 text-lg text-muted-foreground">目前沒有病患。</p>
      <ul class="divide-y divide-border/15">
        <li v-for="s in list" :key="s.session_id">
          <button
            type="button"
            class="flex min-h-12 w-full items-center gap-3 px-3 py-1.5 text-left hover:bg-muted disabled:opacity-50"
            :disabled="store.busy"
            @click="store.open(s.session_id)"
          >
            <span class="flex-1 text-lg font-bold">{{ s.visit_no }}</span>
            <span class="text-base text-muted-foreground tabular-nums">{{ clock(s.started_at) }}</span>
            <Badge :variant="s.status === 'ready' ? 'default' : 'outline'">{{ statusLabel[s.status] }}</Badge>
          </button>
        </li>
      </ul>
    </Card>
  </main>
</template>
