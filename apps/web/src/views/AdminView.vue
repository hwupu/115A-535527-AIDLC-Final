<script setup lang="ts">
// Evaluation mode (admin). Lives on its own route so evaluation controls never appear on the nurse's working screen.
import { Download, Play, Square } from "@lucide/vue";
import { storeToRefs } from "pinia";
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import RoleHeader from "@/components/common/RoleHeader.vue";
import RunTimer from "@/components/admin/RunTimer.vue";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePolling } from "@/composables/usePolling";
import { clock } from "@/lib/status";
import { useAdminRunStore } from "@/stores/adminRun";
import { useNurseSessionStore } from "@/stores/nurseSession";
import type { RunEvent } from "@/api";

const store = useAdminRunStore();
const nurse = useNurseSessionStore();
const router = useRouter();
const { scenarios, runs, run, events, error, busy, state } = storeToRefs(store);

const scenarioId = ref("");
const participant = ref("");
const note = ref("");

onMounted(() => store.init());
usePolling(() => state.value === "running" && store.refreshEvents(), 2000);

const typeLabel: Record<RunEvent["type"], string> = {
  task_start: "開始",
  task_end: "結束",
  field_edit: "欄位修改／確認",
  level_entered: "護理師輸入檢傷級數",
  error_found: "護理師發現系統錯誤",
  note: "備註",
};
const detail = (e: RunEvent) => {
  const p = e.payload ?? {};
  if (e.type === "field_edit") return `${p.path}（${p.kind === "confirm" ? "直接確認" : "修改"}）`;
  if (e.type === "level_entered") return `第 ${p.triage_level} 級`;
  return typeof p.text === "string" ? p.text : "";
};

async function create() {
  if (scenarioId.value) await store.createRun(scenarioId.value, participant.value.trim().toUpperCase());
}
async function openInNurse() {
  if (!run.value) return;
  await nurse.open(run.value.session_id);
  if (nurse.active) router.push("/nurse");
}
async function sendNote() {
  if (note.value.trim()) await store.addEvent("note", { text: note.value.trim() });
  note.value = "";
}
async function download(runId: string, format: "json" | "csv") {
  const content = await store.exportRun(runId, format);
  if (content === undefined) return;
  const url = URL.createObjectURL(new Blob([content], { type: format === "json" ? "application/json" : "text/csv" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: `${runId}.${format}` });
  a.click();
  URL.revokeObjectURL(url);
}
</script>

<template>
  <RoleHeader role="admin" />
  <main class="mx-auto grid max-w-6xl gap-6 px-6 py-8">
    <p v-if="error" class="rounded-xl border-2 border-destructive bg-card px-4 py-3 text-lg font-semibold text-destructive" role="alert">{{ error }}</p>

    <template v-if="state === 'none'">
      <Card>
        <CardHeader>
          <CardTitle>選擇情境</CardTitle>
          <CardDescription>每位受試者依序做同一組情境。留存（held-out）情境只用於最終評估。</CardDescription>
        </CardHeader>
        <CardContent class="grid gap-6">
          <ul class="grid gap-3 md:grid-cols-2">
            <li v-for="s in scenarios" :key="s.id">
              <button
                type="button"
                class="flex min-h-16 w-full items-center justify-between gap-3 rounded-xl border-2 px-4 py-3 text-left transition"
                :class="scenarioId === s.id ? 'border-primary bg-accent' : 'border-border bg-card hover:border-primary'"
                :aria-pressed="scenarioId === s.id"
                @click="scenarioId = s.id"
              >
                <span class="text-xl font-bold">{{ s.id }} {{ s.title }}</span>
                <span class="flex shrink-0 gap-2">
                  <Badge variant="outline">{{ s.split === "dev" ? "開發" : "留存" }}</Badge>
                  <Badge v-if="s.demo" variant="secondary">展示</Badge>
                </span>
              </button>
            </li>
          </ul>
          <form class="flex flex-wrap items-end gap-3" @submit.prevent="create">
            <div class="grid gap-2">
              <Label for="participant">受試者代碼（匿名，不要用姓名）</Label>
              <Input id="participant" v-model="participant" class="w-48" placeholder="N-01" autocomplete="off" />
            </div>
            <Button type="submit" size="lg" :disabled="!scenarioId || !participant.trim() || busy">建立執行</Button>
          </form>
        </CardContent>
      </Card>

      <Card v-if="runs.length">
        <CardHeader>
          <CardTitle>歷史執行</CardTitle>
        </CardHeader>
        <CardContent>
          <ul class="grid gap-3">
            <li v-for="r in runs" :key="r.run_id" class="flex flex-wrap items-center justify-between gap-3 rounded-xl border-2 border-border p-3">
              <span class="text-lg font-semibold">{{ r.scenario_id }}・{{ r.participant_code }}・{{ r.finished_at ? "已結束" : r.started_at ? "進行中" : "尚未開始" }}</span>
              <span class="flex gap-2">
                <Button variant="outline" @click="store.select(r)">查看</Button>
                <Button variant="outline" @click="download(r.run_id, 'json')"><Download aria-hidden="true" />JSON</Button>
                <Button variant="outline" @click="download(r.run_id, 'csv')"><Download aria-hidden="true" />CSV</Button>
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </template>

    <template v-else-if="run">
      <Card>
        <CardHeader>
          <CardTitle>{{ run.scenario_id }}・受試者 {{ run.participant_code }}</CardTitle>
          <CardDescription>就診號 {{ run.visit_no }}。受試者請在「檢傷護理師」畫面輸入此就診號開啟，或按下方按鈕在此裝置開啟。</CardDescription>
        </CardHeader>
        <CardContent class="flex flex-wrap items-center gap-6">
          <RunTimer :run="run" />
          <div class="flex flex-wrap gap-3">
            <Button v-if="state === 'ready'" size="lg" class="h-14 text-xl" :disabled="busy" @click="store.start()"><Play aria-hidden="true" />開始計時</Button>
            <Button v-if="state === 'running'" size="lg" variant="destructive" class="h-14 text-xl" :disabled="busy" @click="store.finish()"><Square aria-hidden="true" />結束</Button>
            <Button variant="outline" size="lg" @click="openInNurse">在護理師畫面開啟</Button>
            <Button variant="outline" size="lg" @click="store.leave()">返回情境清單</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>事件紀錄</CardTitle>
          <CardDescription>護理師修改欄位、輸入檢傷級數會自動記錄；錯誤與備註由您手動加入。</CardDescription>
        </CardHeader>
        <CardContent class="grid gap-4">
          <div v-if="state !== 'finished'" class="flex flex-wrap gap-3">
            <Button variant="outline" size="lg" :disabled="state !== 'running'" @click="store.addEvent('error_found')">護理師發現系統錯誤</Button>
            <form class="flex flex-1 gap-2" @submit.prevent="sendNote">
              <Input v-model="note" aria-label="備註" placeholder="備註" :disabled="state !== 'running'" />
              <Button type="submit" size="lg" :disabled="state !== 'running' || !note.trim()">加入備註</Button>
            </form>
          </div>
          <p v-if="!events.length" class="text-lg text-muted-foreground">尚無事件。按下「開始計時」後開始記錄。</p>
          <ul class="grid gap-2">
            <li v-for="(e, i) in events" :key="i" class="flex flex-wrap items-center gap-3 rounded-lg bg-muted px-3 py-2 text-lg">
              <span class="tabular-nums text-muted-foreground">{{ clock(e.at) }}</span>
              <span class="font-semibold">{{ typeLabel[e.type] }}</span>
              <span class="text-muted-foreground">{{ detail(e) }}</span>
            </li>
          </ul>
          <div class="flex gap-3">
            <Button variant="outline" size="lg" @click="download(run.run_id, 'json')"><Download aria-hidden="true" />匯出 JSON</Button>
            <Button variant="outline" size="lg" @click="download(run.run_id, 'csv')"><Download aria-hidden="true" />匯出 CSV</Button>
          </div>
        </CardContent>
      </Card>
    </template>
  </main>
</template>
