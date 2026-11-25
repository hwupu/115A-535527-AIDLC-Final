<script setup lang="ts">
import { ArrowLeft, ArrowRight, Check, Keyboard, Mic, RotateCcw, Send, SkipForward, Square, Volume2, VolumeX } from "@lucide/vue";
import { storeToRefs } from "pinia";
import { computed, ref, watch } from "vue";
import RoleHeader from "@/components/common/RoleHeader.vue";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useQuestionAudio } from "@/composables/useQuestionAudio";
import { questions, stepId, stepText } from "@/intake/questions";
import { usePatientInputStore } from "@/stores/patientInput";

const store = usePatientInputStore();
const { phase, step, questionNo, isLast, answer, listening, visitNo, canFinish, finishing, error, offline, level } = storeToRefs(store);
const audio = useQuestionAudio();
const totalQuestions = questions.length;

const typing = ref(false);
const textDraft = ref("");
const currentId = computed(() => stepId(step.value));
// Yes/no questions (those with a follow-up) get 「有」「沒有」 buttons; 「有」 brings up the follow-up as the next step.
const isYesNo = computed(() => !!step.value.question.followUp && !step.value.followUp);

watch(currentId, () => {
  typing.value = false;
  textDraft.value = "";
});

// Sound is started from the tap itself (browsers block it otherwise), after the store has moved to the new step.
const speak = () => audio.play(currentId.value);
function start() { store.start(); speak(); }
function next() { store.next(); speak(); }
function skip() { store.skip(); speak(); }
function back() { store.back(); speak(); }

function record() {
  audio.stop(); // keep the question out of the recording
  void store.toggleListening();
}

async function sendText() {
  if (await store.answerText(textDraft.value)) {
    textDraft.value = "";
    typing.value = false;
  }
}

function reanswer() {
  store.reanswer();
  typing.value = false;
}

function nextPatient() {
  audio.stop();
  store.reset();
}
</script>

<template>
  <!-- Exactly one screen from tablet up; phones may scroll. -->
  <div class="flex min-h-dvh flex-col md:h-dvh">
    <RoleHeader role="patient" class="shrink-0" />

    <!-- Ending screen: the 就診號 is shown only after the session is written. -->
    <main v-if="phase === 'done'" class="mx-auto flex max-w-3xl flex-1 flex-col items-center justify-center gap-5 px-6 py-6 text-center">
      <Check class="size-16 rounded-full bg-success p-3 text-success-foreground" aria-hidden="true" />
      <h2 class="text-3xl font-bold">謝謝您，已完成</h2>
      <p class="text-xl text-muted-foreground">請將下方就診號告訴護理師。</p>
      <p class="rounded-2xl border-2 border-primary bg-card px-10 py-6 text-5xl font-bold tracking-wider text-primary" role="status" aria-label="就診號">
        {{ visitNo }}
      </p>
      <p class="text-lg text-muted-foreground">就診號</p>
      <Button size="lg" variant="outline" @click="nextPatient">下一位</Button>
    </main>

    <main v-else-if="phase === 'intro'" class="mx-auto flex max-w-3xl flex-1 flex-col items-center justify-center gap-6 px-6 py-6 text-center">
      <h2 class="text-3xl font-bold">等候時，請先回答幾個問題</h2>
      <p class="text-xl leading-relaxed text-muted-foreground">
        一共 {{ totalQuestions }} 題，一次一題。<br />
        每一題都可以用說的或打字回答，不想回答可以跳過。<br />
        護理師稍後會再和您確認。
      </p>
      <Button size="lg" class="h-20 w-full max-w-md text-2xl" @click="start">
        開始
        <ArrowRight class="size-8" aria-hidden="true" />
      </Button>
      <Button variant="ghost" size="lg" :aria-pressed="audio.enabled.value" @click="audio.toggle()">
        <component :is="audio.enabled.value ? Volume2 : VolumeX" aria-hidden="true" />
        {{ audio.enabled.value ? "會念出題目（按這裡關閉聲音）" : "不念出題目（按這裡開啟聲音）" }}
      </Button>
    </main>

    <main v-else class="mx-auto flex min-h-0 w-full max-w-4xl flex-1 flex-col gap-4 overflow-y-auto px-6 py-4">
      <!-- Progress -->
      <div class="flex shrink-0 flex-wrap items-center justify-between gap-3">
        <p class="text-xl font-semibold" aria-live="polite">
          第 {{ questionNo }} 題 / 共 {{ totalQuestions }} 題<span v-if="step.followUp" class="text-muted-foreground">（補充）</span>
        </p>
        <Button variant="ghost" size="sm" :aria-pressed="audio.enabled.value" @click="audio.toggle()">
          <component :is="audio.enabled.value ? Volume2 : VolumeX" aria-hidden="true" />
          {{ audio.enabled.value ? "聲音：開" : "聲音：關" }}
        </Button>
      </div>
      <div class="flex shrink-0 gap-1" aria-hidden="true">
        <span v-for="n in totalQuestions" :key="n" class="h-3 flex-1 rounded-full" :class="n <= questionNo ? 'bg-primary' : 'bg-muted'" />
      </div>

      <!-- Question -->
      <section class="flex shrink-0 flex-col gap-3 rounded-2xl border-2 border-border bg-card p-6">
        <h2 class="text-3xl font-bold leading-snug" data-testid="question">{{ stepText(step) }}</h2>
        <div>
          <Button variant="outline" size="sm" :disabled="listening" @click="audio.play(currentId, true)">
            <Volume2 aria-hidden="true" />
            再聽一次
          </Button>
        </div>
      </section>

      <!-- Answer -->
      <section class="flex shrink-0 flex-col gap-4" aria-label="回答">
        <template v-if="listening">
          <Button size="lg" variant="destructive" class="h-24 w-full text-2xl" @click="record">
            <Square class="size-8" aria-hidden="true" />
            說完了，停止錄音
          </Button>
          <div class="h-4 w-full overflow-hidden rounded-full bg-muted" role="meter" aria-label="音量" :aria-valuenow="Math.round(level * 100)" aria-valuemin="0" aria-valuemax="100">
            <div class="h-full bg-primary transition-all" :style="{ width: `${Math.round(level * 100)}%` }" />
          </div>
        </template>

        <div v-else-if="answer && answer.kind !== 'skipped'" class="rounded-2xl border-2 border-primary/40 bg-muted p-5" role="status">
          <p class="text-lg text-muted-foreground">您的回答：</p>
          <p v-if="answer.state === 'transcribing'" class="text-2xl">正在把您說的話轉成文字…</p>
          <p v-else-if="answer.state === 'no_speech'" class="text-2xl">沒有聽到您的聲音，請按「重新回答」再說一次，或改用打字。</p>
          <p v-else-if="answer.kind === 'voice' && answer.state === 'failed'" class="text-2xl">語音辨識失敗，請按「重新回答」改用打字。</p>
          <p v-else class="text-2xl font-semibold" data-testid="own-answer">「{{ answer.text }}」</p>
          <p v-if="answer.kind !== 'voice' && answer.state === 'failed'" class="mt-2 text-lg text-destructive">這個回答還沒送出，按「完成」時會再試一次。</p>
        </div>

        <template v-else-if="typing">
          <Label for="patient-text" class="sr-only">打字回答</Label>
          <Textarea id="patient-text" v-model="textDraft" class="max-h-32 overflow-y-auto text-xl" placeholder="請在這裡輸入您的回答" autofocus />
          <div class="grid grid-cols-2 gap-3">
            <Button size="lg" variant="outline" @click="typing = false">取消</Button>
            <Button size="lg" :disabled="!textDraft.trim()" @click="sendText">
              <Send aria-hidden="true" />
              送出
            </Button>
          </div>
        </template>

        <template v-else>
          <div v-if="isYesNo" class="grid grid-cols-2 gap-3">
            <Button size="lg" variant="outline" class="h-20 text-2xl" @click="store.answerChoice('有')">有</Button>
            <Button size="lg" variant="outline" class="h-20 text-2xl" @click="store.answerChoice('沒有')">沒有</Button>
          </div>
          <div class="grid gap-3 sm:grid-cols-2">
            <Button size="lg" class="h-20 text-2xl" @click="record">
              <Mic class="size-8" aria-hidden="true" />
              用說的回答
            </Button>
            <Button size="lg" variant="secondary" class="h-20 text-2xl" @click="typing = true">
              <Keyboard class="size-8" aria-hidden="true" />
              用打字回答
            </Button>
          </div>
        </template>
      </section>

      <!-- Navigation -->
      <div class="mt-auto flex shrink-0 flex-col gap-3 pt-2">
        <div class="grid grid-cols-3 gap-3">
          <Button size="lg" variant="outline" :disabled="listening || store.stepIndex === 0" @click="back">
            <ArrowLeft aria-hidden="true" />
            上一題
          </Button>
          <Button v-if="answer && answer.kind !== 'skipped'" size="lg" variant="outline" :disabled="listening" @click="reanswer">
            <RotateCcw aria-hidden="true" />
            重新回答
          </Button>
          <Button v-else size="lg" variant="outline" :disabled="listening || isLast" @click="skip">
            <SkipForward aria-hidden="true" />
            跳過
          </Button>
          <Button v-if="!isLast" size="lg" :disabled="listening" @click="next">
            下一題
            <ArrowRight aria-hidden="true" />
          </Button>
          <Button v-else size="lg" :disabled="!canFinish" @click="store.finish()">完成</Button>
        </div>
        <Button v-if="!isLast" size="lg" variant="ghost" :disabled="!canFinish" @click="store.finish()">已經回答完了，取得就診號</Button>
        <p v-if="isLast && !canFinish && !listening && !finishing" class="text-center text-lg text-muted-foreground">請至少回答一題才能完成。</p>
        <p v-if="finishing" class="text-center text-lg text-muted-foreground" role="status">正在送出您的回答，請稍候…</p>
        <p v-if="listening" class="text-center text-lg text-muted-foreground">請先停止錄音。</p>
        <p v-if="offline" class="text-center text-lg font-semibold text-destructive" role="alert">與伺服器的連線中斷，已回答的內容會保留。</p>
        <p v-if="error" class="text-center text-lg font-semibold text-destructive" role="alert">{{ error }}</p>
      </div>
    </main>
  </div>
</template>
