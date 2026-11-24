<script setup lang="ts">
// The nurse's working screen. Landscape tablet: transcript on the left, report on the right, confirm bar at the bottom.
// Narrow or portrait: the two columns become tabs. Every part below is replaceable behind its own contract.
// 返回清單 and the 就診號 sit in the role header (NurseView.vue).
import { storeToRefs } from "pinia";
import { nextTick, onUnmounted, ref } from "vue";
import ChecklistPanel from "./ChecklistPanel.vue";
import ConfirmBar from "./ConfirmBar.vue";
import ConnectionBanner from "./ConnectionBanner.vue";
import ConsentGate from "./ConsentGate.vue";
import ExportPanel from "./ExportPanel.vue";
import PrintRecord from "./PrintRecord.vue";
import ShortcutHelp from "@/components/common/ShortcutHelp.vue";
import RecorderPanel from "@/components/recorder/RecorderPanel.vue";
import FlagList from "@/components/report/FlagList.vue";
import ReportForm from "@/components/report/ReportForm.vue";
import SafetyBanner from "@/components/report/SafetyBanner.vue";
import TranscriptPanel from "@/components/transcript/TranscriptPanel.vue";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRecorder } from "@/composables/useRecorder";
import { useShortcuts } from "@/composables/useShortcuts";
import { fieldDefs } from "@/report/schema";
import { useNurseSessionStore } from "@/stores/nurseSession";

const store = useNurseSessionStore();
const { segments, fields, flags, triageLevel, consent, connection, selectedPath, highlight, drafts, blockers, confirmed, busy, error, reportText } = storeToRefs(store);
const recorder = useRecorder();
const tab = ref<"transcript" | "report">("report");
const note = ref("");

// Leaving by any route (返回清單, 切換角色) must not leave the microphone on.
onUnmounted(() => recorder.stop());

async function startRecording() {
  await recorder.start(store.sendAudio);
  if (recorder.state.value === "recording") store.startRecording();
}
function stopRecording() {
  recorder.stop();
  // Cancelling the permission prompt never started a recording on the server.
  if (store.recording) store.stopRecording();
}
function leave() {
  recorder.stop();
  store.leave();
}
async function sendNote() {
  if (await store.addNurseText(note.value)) note.value = "";
}

// Jump from the confirm bar's list or the checklist to a field.
async function jump(path: string) {
  tab.value = "report";
  store.selectField(path);
  await nextTick();
  document.getElementById(`field-${path}`)?.scrollIntoView({ block: "center", behavior: "smooth" });
}
// Keyboard (#28): one hand on the keyboard while the other holds the patient or the cuff.
// There is deliberately no key that sets the 檢傷級數: the nurse picks it on screen, so a stray key cannot set it.
const helpOpen = ref(false);
const shortcutItems = [
  { keys: "Space", action: "開始／停止錄音" },
  { keys: "↑ ↓", action: "在欄位之間移動" },
  { keys: "Enter", action: "確認選到的 AI 草稿" },
  { keys: "E", action: "修改選到的欄位（Esc 取消）" },
  { keys: "N", action: "跳到下一個未確認的 AI 草稿" },
  { keys: "Esc", action: "取消選取" },
  { keys: "?", action: "顯示／隱藏這個說明" },
];
async function moveTo(path: string) {
  // Leave the last tapped button, so Enter means 「確認 the selected field」 and not 「press that button again」.
  (document.activeElement as HTMLElement | null)?.blur?.();
  tab.value = "report";
  store.selectField(path);
  await nextTick();
  document.getElementById(`field-${path}`)?.scrollIntoView({ block: "nearest", behavior: "smooth" });
}
function moveBy(step: number) {
  const i = fieldDefs.findIndex((d) => d.path === selectedPath.value);
  const next = i < 0 ? (step > 0 ? 0 : fieldDefs.length - 1) : Math.min(fieldDefs.length - 1, Math.max(0, i + step));
  void moveTo(fieldDefs[next].path);
}
function nextDraft() {
  const i = fieldDefs.findIndex((d) => d.path === selectedPath.value);
  const order = [...fieldDefs.slice(i + 1), ...fieldDefs.slice(0, i + 1)];
  const d = order.find((x) => fields.value[x.path]?.status === "AI 草稿");
  if (d) void moveTo(d.path);
}
function toggleRecording() {
  // While the permission prompt is open, Space cancels like the 「取消」 button.
  if (recorder.state.value === "recording" || recorder.state.value === "requesting") stopRecording();
  else if (consent.value === "yes") void startRecording();
}
useShortcuts(() => ({
  "?": () => (helpOpen.value = !helpOpen.value),
  Escape: () => (helpOpen.value ? (helpOpen.value = false) : store.selectField(null)),
  ...(confirmed.value
    ? {}
    : {
        " ": toggleRecording,
        ArrowDown: () => moveBy(1),
        ArrowUp: () => moveBy(-1),
        n: nextDraft,
        ...(selectedPath.value
          ? {
              Enter: () => selectedPath.value && fields.value[selectedPath.value]?.status === "AI 草稿" && store.confirmField(selectedPath.value),
              e: () => document.querySelector<HTMLElement>(`[id="field-${selectedPath.value}"] [data-action="edit"]`)?.click(),
            }
          : {}),
      }),
}));

function select(path: string) {
  store.selectField(selectedPath.value === path ? null : path);
  if (window.innerWidth < 1024 && selectedPath.value) tab.value = "transcript";
}
</script>

<template>
  <!-- 4rem = role header, so the confirm bar starts at the bottom of the screen. -->
  <div class="flex min-h-[calc(100dvh-4rem)] flex-col">
    <div class="grid gap-2 px-4 pt-3 print:hidden">
      <ConnectionBanner :connection="connection" />
      <p v-if="error" class="rounded-lg border border-destructive bg-card px-3 py-2 text-lg font-semibold text-destructive" role="alert">{{ error }}</p>
      <ConsentGate v-if="consent === 'unknown' && !confirmed" :consent="consent" @set="store.setConsent" />
      <p v-else-if="consent === 'no' && !confirmed" class="text-lg font-semibold">病患不同意錄音：請手動填寫報告。<Button variant="link" @click="store.setConsent('unknown')">重新詢問</Button></p>
    </div>

    <div class="px-4 pt-3 lg:hidden print:hidden" role="tablist" aria-label="畫面切換">
      <div class="grid grid-cols-2 gap-2">
        <Button role="tab" :variant="tab === 'transcript' ? 'default' : 'outline'" :aria-selected="tab === 'transcript'" @click="tab = 'transcript'">逐字稿</Button>
        <Button role="tab" :variant="tab === 'report' ? 'default' : 'outline'" :aria-selected="tab === 'report'" @click="tab = 'report'">報告</Button>
      </div>
    </div>

    <div v-if="!confirmed" class="grid flex-1 items-start gap-3 px-4 py-3 lg:grid-cols-[2fr_3fr] print:hidden">
      <!-- Landscape: the transcript column stays in view while the report scrolls. -->
      <div
        class="min-h-0 flex-col gap-2 lg:sticky lg:top-3 lg:h-[calc(100dvh-10rem)]"
        :class="tab === 'transcript' ? 'flex' : 'hidden lg:flex'"
      >
        <RecorderPanel
          :state="recorder.state.value"
          :level="recorder.level.value"
          :error="recorder.error.value"
          :disabled="consent !== 'yes'"
          :connection="connection.ws"
          @start="startRecording"
          @stop="stopRecording"
        />
        <TranscriptPanel :segments="segments" :highlight="highlight" />
        <form class="flex gap-2" @submit.prevent="sendNote">
          <Input v-model="note" aria-label="補充文字" placeholder="補充文字（例如口述不便時打字）" />
          <Button type="submit" :disabled="!note.trim()">加入</Button>
        </form>
      </div>
      <!-- pb-16: room for the floating 鍵盤快捷鍵 button, so the last field can scroll out from under it. -->
      <div class="content-start gap-3 pb-16" :class="tab === 'report' ? 'grid' : 'hidden lg:grid'">
        <SafetyBanner :fields="fields" @edit="store.editField" />
        <FlagList :flags="flags" />
        <ChecklistPanel :fields="fields" @jump="jump" />
        <ReportForm :fields="fields" :selected-path="selectedPath" @select="select" @edit="store.editField" @confirm="store.confirmField" />
      </div>
    </div>

    <div v-else class="grid flex-1 content-start gap-3 px-4 py-3">
      <ExportPanel :text="reportText" :report="{ session_id: store.sessionId, visit_no: store.visitNo, confirmed_at: store.confirmedAt, triage_level: triageLevel, fields, flags }" />
      <PrintRecord :fields="fields" :visit-no="store.visitNo" :triage-level="triageLevel" :flags="flags" :confirmed-at="store.confirmedAt" />
      <Button variant="outline" class="w-fit print:hidden" @click="leave">下一位</Button>
    </div>

    <!-- The shortcut call to action floats at the bottom right, just above the confirm bar. -->
    <div v-if="!confirmed" class="sticky bottom-0 z-10">
      <ShortcutHelp v-model:open="helpOpen" class="absolute right-4 bottom-full mb-3" :items="shortcutItems" note="檢傷級數沒有快捷鍵，請在畫面上選。" />
      <ConfirmBar
        :level="triageLevel"
        :drafts="drafts"
        :blockers="blockers"
        :busy="busy"
        @update:level="store.setTriageLevel"
        @confirm="store.confirmSession"
        @jump="jump"
      />
    </div>
  </div>
</template>
