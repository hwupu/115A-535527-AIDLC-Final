<script setup lang="ts">
import { Mic, Square, Send } from "@lucide/vue";
import { storeToRefs } from "pinia";
import { ref } from "vue";
import RoleHeader from "@/components/common/RoleHeader.vue";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PATIENT_ID_PATTERN, usePatientInputStore } from "@/stores/patientInput";

const store = usePatientInputStore();
const { patientId, entries, listening, hasPatient } = storeToRefs(store);

const idDraft = ref(patientId.value);
const idError = ref("");
const textDraft = ref("");

function confirmId() {
  const id = idDraft.value.trim().toUpperCase();
  if (!PATIENT_ID_PATTERN.test(id)) {
    idError.value = "格式為 P- 加四位數字，例如 P-0001";
    return;
  }
  idError.value = "";
  idDraft.value = id;
  store.setPatientId(id);
}

function send() {
  store.addText(textDraft.value);
  textDraft.value = "";
}
</script>

<template>
  <RoleHeader role="patient" />
  <main class="mx-auto grid max-w-6xl gap-6 px-6 py-8 md:grid-cols-2">
    <Card class="md:col-span-2">
      <CardHeader>
        <CardTitle>病患編號</CardTitle>
        <CardDescription>請輸入模擬病患編號。請勿輸入身分證字號或病歷號。</CardDescription>
      </CardHeader>
      <CardContent>
        <form class="flex flex-wrap items-end gap-4" @submit.prevent="confirmId">
          <div class="grid gap-2">
            <Label for="patient-id">病患編號</Label>
            <Input id="patient-id" v-model="idDraft" class="w-56" placeholder="P-0001" autocomplete="off" :aria-invalid="!!idError" />
          </div>
          <Button type="submit" size="lg">確認</Button>
          <Badge v-if="hasPatient" variant="secondary">目前病患：{{ patientId }}</Badge>
        </form>
        <p v-if="idError" class="mt-2 text-base font-medium text-destructive" role="alert">{{ idError }}</p>
      </CardContent>
    </Card>

    <Card :class="!hasPatient && 'opacity-60'">
      <CardHeader>
        <CardTitle>語音輸入</CardTitle>
        <CardDescription>按下按鈕後說話，再按一次結束。</CardDescription>
      </CardHeader>
      <CardContent class="flex flex-col items-center gap-4">
        <Button size="lg" class="h-24 w-full text-2xl" :variant="listening ? 'destructive' : 'default'" :disabled="!hasPatient" @click="store.toggleListening()">
          <component :is="listening ? Square : Mic" class="size-8" aria-hidden="true" />
          {{ listening ? "停止錄音" : "開始說話" }}
        </Button>
        <Badge :variant="listening ? 'destructive' : 'outline'" role="status">
          {{ listening ? "錄音中" : "未錄音" }}
        </Badge>
      </CardContent>
    </Card>

    <Card :class="!hasPatient && 'opacity-60'">
      <CardHeader>
        <CardTitle>文字輸入</CardTitle>
        <CardDescription>也可以用打字說明您的狀況。</CardDescription>
      </CardHeader>
      <CardContent class="grid gap-4">
        <Label for="patient-text" class="sr-only">文字輸入</Label>
        <Textarea id="patient-text" v-model="textDraft" :disabled="!hasPatient" placeholder="例如：從昨天開始發燒、咳嗽" />
        <Button size="lg" :disabled="!hasPatient || !textDraft.trim()" @click="send">
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
  </main>
</template>
