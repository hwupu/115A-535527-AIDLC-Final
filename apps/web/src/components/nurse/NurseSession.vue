<script setup lang="ts">
// The nurse's working screen. Landscape tablet: transcript on the left, report on the right, confirm bar at the bottom.
// Narrow or portrait: the two columns become tabs. Every part below is replaceable behind its own contract.
// 返回清單 and the 就診號 sit in the role header (NurseView.vue).
import { storeToRefs } from "pinia";
import { nextTick, onUnmounted, ref } from "vue";
import ConfirmBar from "./ConfirmBar.vue";
import ConnectionBanner from "./ConnectionBanner.vue";
import ConsentGate from "./ConsentGate.vue";
import ExportPanel from "./ExportPanel.vue";
import RecorderPanel from "@/components/recorder/RecorderPanel.vue";
import FlagList from "@/components/report/FlagList.vue";
import ReportForm from "@/components/report/ReportForm.vue";
import SafetyBanner from "@/components/report/SafetyBanner.vue";
import TranscriptPanel from "@/components/transcript/TranscriptPanel.vue";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRecorder } from "@/composables/useRecorder";
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
  store.stopRecording();
}
function leave() {
  recorder.stop();
  store.leave();
}
async function sendNote() {
  if (await store.addNurseText(note.value)) note.value = "";
}

// Jump from the confirm bar's list to the field that still needs a decision.
async function jump(path: string) {
  tab.value = "report";
  store.selectField(path);
  await nextTick();
  document.getElementById(`field-${path}`)?.scrollIntoView({ block: "center", behavior: "smooth" });
}
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
          @start="startRecording"
          @stop="stopRecording"
        />
        <TranscriptPanel :segments="segments" :highlight="highlight" />
        <form class="flex gap-2" @submit.prevent="sendNote">
          <Input v-model="note" aria-label="補充文字" placeholder="補充文字（例如口述不便時打字）" />
          <Button type="submit" :disabled="!note.trim()">加入</Button>
        </form>
      </div>
      <div class="content-start gap-3" :class="tab === 'report' ? 'grid' : 'hidden lg:grid'">
        <SafetyBanner :fields="fields" @edit="store.editField" />
        <FlagList :flags="flags" />
        <ReportForm :fields="fields" :selected-path="selectedPath" @select="select" @edit="store.editField" @confirm="store.confirmField" />
      </div>
    </div>

    <div v-else class="grid flex-1 content-start gap-3 px-4 py-3">
      <ExportPanel :text="reportText" />
      <Button variant="outline" class="w-fit print:hidden" @click="leave">下一位</Button>
    </div>

    <ConfirmBar
      v-if="!confirmed"
      class="sticky bottom-0"
      :level="triageLevel"
      :drafts="drafts"
      :blockers="blockers"
      :busy="busy"
      @update:level="store.setTriageLevel"
      @confirm="store.confirmSession"
      @jump="jump"
    />
  </div>
</template>
