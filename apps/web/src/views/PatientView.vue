<script setup lang="ts">
import { Check, Mic, Send, Square } from "@lucide/vue";
import { storeToRefs } from "pinia";
import { ref } from "vue";
import RoleHeader from "@/components/common/RoleHeader.vue";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { usePatientInputStore } from "@/stores/patientInput";

const store = usePatientInputStore();
const { phase, entries, listening, visitNo, canFinish, busy, error, offline, level } = storeToRefs(store);

const textDraft = ref("");

async function send() {
  if (await store.addText(textDraft.value)) textDraft.value = "";
}
</script>

<template>
  <RoleHeader role="patient" />

  <!-- Ending screen: the 就診號 is shown only after the session is written. -->
  <main v-if="phase === 'done'" class="mx-auto flex max-w-3xl flex-col items-center gap-6 px-6 py-14 text-center">
    <Check class="size-16 rounded-full bg-success p-3 text-success-foreground" aria-hidden="true" />
    <h2 class="text-3xl font-bold">謝謝您，已完成</h2>
    <p class="text-xl text-muted-foreground">請將下方就診號告訴護理師。</p>
    <p class="rounded-2xl border-2 border-primary bg-card px-10 py-6 text-5xl font-bold tracking-wider text-primary" role="status" aria-label="就診號">
      {{ visitNo }}
    </p>
    <p class="text-lg text-muted-foreground">就診號</p>
    <Button size="lg" variant="outline" @click="store.reset()">下一位</Button>
  </main>

  <main v-else class="mx-auto grid max-w-6xl gap-6 px-6 py-8 md:grid-cols-2">
    <Card>
      <CardHeader>
        <CardTitle>語音輸入</CardTitle>
        <CardDescription>按下按鈕後說話，再按一次結束。</CardDescription>
      </CardHeader>
      <CardContent class="flex flex-col items-center gap-4">
        <Button size="lg" class="h-24 w-full text-2xl" :variant="listening ? 'destructive' : 'default'" @click="store.toggleListening()">
          <component :is="listening ? Square : Mic" class="size-8" aria-hidden="true" />
          {{ listening ? "停止錄音" : "開始說話" }}
        </Button>
        <Badge :variant="listening ? 'destructive' : 'outline'" role="status">
          {{ listening ? "錄音中" : "未錄音" }}
        </Badge>
        <div class="h-4 w-full overflow-hidden rounded-full bg-muted" role="meter" aria-label="音量" :aria-valuenow="Math.round(level * 100)" aria-valuemin="0" aria-valuemax="100">
          <div class="h-full bg-primary transition-all" :style="{ width: `${Math.round(level * 100)}%` }" />
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>文字輸入</CardTitle>
        <CardDescription>也可以用打字說明您的狀況。</CardDescription>
      </CardHeader>
      <CardContent class="grid gap-4">
        <Label for="patient-text" class="sr-only">文字輸入</Label>
        <Textarea id="patient-text" v-model="textDraft" placeholder="例如：從昨天開始發燒、咳嗽" />
        <Button size="lg" :disabled="!textDraft.trim() || busy" @click="send">
          <Send aria-hidden="true" />
          送出
        </Button>
      </CardContent>
    </Card>

    <Card v-if="entries.length" class="md:col-span-2">
      <CardHeader>
        <CardTitle>已送出的內容</CardTitle>
      </CardHeader>
      <CardContent>
        <ul class="grid gap-3">
          <li v-for="e in entries" :key="e.id" class="rounded-lg border-2 border-border bg-muted p-3 text-lg">{{ e.text }}</li>
        </ul>
      </CardContent>
    </Card>

    <div class="md:col-span-2">
      <Button size="lg" class="h-20 w-full text-2xl" :disabled="!canFinish" @click="store.finish()">完成，取得就診號</Button>
      <p v-if="listening" class="mt-2 text-center text-lg text-muted-foreground">請先停止錄音。</p>
      <p v-if="offline" class="mt-2 text-center text-lg font-semibold text-destructive" role="alert">與伺服器的連線中斷，已輸入的內容會保留。</p>
      <p v-if="error" class="mt-2 text-center text-lg font-semibold text-destructive" role="alert">{{ error }}</p>
    </div>
  </main>
</template>
