<script setup lang="ts">
// Nurse entry: open a patient by 就診號, pick from the waiting list, or start a new session.
import { Plus, Search } from "@lucide/vue";
import { onMounted, onUnmounted, ref } from "vue";
import { api } from "@/api";
import type { SessionStatus, SessionSummary } from "@/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNurseSessionStore } from "@/stores/nurseSession";

const store = useNurseSessionStore();
const visitNo = ref("");
const list = ref<SessionSummary[]>([]);
const listError = ref("");
let timer: ReturnType<typeof setInterval> | undefined;

const statusLabel: Record<SessionStatus, string> = { intake: "輸入中", ready: "等候中", in_progress: "進行中", confirmed: "已確認" };

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

const time = (iso: string) => new Date(iso).toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit" });
</script>

<template>
  <main class="mx-auto grid max-w-6xl gap-6 px-6 py-8 md:grid-cols-2">
    <Card>
      <CardHeader>
        <CardTitle>輸入就診號</CardTitle>
        <CardDescription>請病患念出螢幕上的就診號（例如 SIM-000001）。</CardDescription>
      </CardHeader>
      <CardContent class="grid gap-4">
        <form class="flex flex-wrap items-end gap-3" @submit.prevent="store.openByVisitNo(visitNo)">
          <div class="grid gap-2">
            <Label for="visit-no">就診號</Label>
            <Input id="visit-no" v-model="visitNo" class="w-56" placeholder="SIM-000001" autocomplete="off" />
          </div>
          <Button type="submit" size="lg" :disabled="!visitNo.trim() || store.busy">
            <Search aria-hidden="true" />
            開啟
          </Button>
        </form>
        <Button variant="outline" size="lg" :disabled="store.busy" @click="store.startNew()">
          <Plus aria-hidden="true" />
          開始新的問診（病患沒有先輸入）
        </Button>
        <p v-if="store.error" class="text-lg font-semibold text-destructive" role="alert">{{ store.error }}</p>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>病患清單</CardTitle>
        <CardDescription>病患完成輸入後會出現在這裡，每幾秒更新。</CardDescription>
      </CardHeader>
      <CardContent>
        <p v-if="listError" class="text-lg font-semibold text-destructive" role="alert">{{ listError }}</p>
        <p v-else-if="!list.length" class="text-lg text-muted-foreground">目前沒有病患。</p>
        <ul class="grid gap-3">
          <li v-for="s in list" :key="s.session_id">
            <Button variant="outline" size="lg" class="h-auto w-full justify-between py-3 text-left" :disabled="store.busy" @click="store.open(s.session_id)">
              <span class="text-xl font-bold">{{ s.visit_no }}</span>
              <span class="flex items-center gap-3 text-base font-normal">
                {{ time(s.started_at) }}
                <Badge :variant="s.status === 'ready' ? 'default' : 'outline'">{{ statusLabel[s.status] }}</Badge>
              </span>
            </Button>
          </li>
        </ul>
      </CardContent>
    </Card>
  </main>
</template>
