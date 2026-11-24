import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { api } from "@/api";
import type { RealtimeConnection } from "@/api";
import { useRecorder } from "@/composables/useRecorder";
import { questions, stepId, transcriptLine, type Step } from "@/intake/questions";

// One answer per step (question or follow-up). `text` is only the patient's own words: what they typed, tapped,
// or what their recording was transcribed to. Never an AI draft, flag or triage level.
export interface PatientAnswer {
  kind: "text" | "voice" | "choice" | "skipped";
  text: string;
  state: "sending" | "sent" | "failed" | "transcribing" | "no_speech";
}

// 就診號 is assigned by the system (api) when the intake is finished, never typed by the patient.
// It is a simulated number (format SIM-######), not a real hospital number.
export const VISIT_NO_PATTERN = /^SIM-\d{6}$/;

// A recording with no speech gets no transcript back; stop waiting after this long.
export const VOICE_TIMEOUT_MS = 45_000;

const message = (e: unknown, fallback: string) => (e instanceof Error ? e.message : fallback);

// The question as written into the transcript. A follow-up carries its main question, so 「是哪些症狀？」 has context.
const transcriptQuestion = (s: Step) => (s.followUp ? `${s.question.text}${s.followUp.text}` : s.question.text);

// The patient answers fixed questions one at a time (#86). Each answer is sent as typed text together with its
// question (「問：… 答：…」) so the AI can map a short answer like 「沒有」 to the right field. For a voice answer the
// question is sent as text when recording starts, then the recording's transcript follows it.
// Sends do not block the next question; finishing waits until everything has been written.
export const usePatientInputStore = defineStore("patientInput", () => {
  const phase = ref<"intro" | "questions" | "done">("intro");
  const stepIndex = ref(0);
  const answers = ref<Record<string, PatientAnswer>>({});
  const listening = ref(false);
  const visitNo = ref("");
  const finishing = ref(false);
  const error = ref("");
  const offline = ref(false);
  const recorder = useRecorder();
  let sessionId: string | null = null;
  let conn: RealtimeConnection | null = null;
  let inflight = new Set<Promise<boolean>>();
  let unsent: string[] = []; // lines that failed to send, retried in order on finish
  let sentLines = new Set<string>(); // our own text inputs, so their echo is not taken for a voice transcript
  let voiceQueue: string[] = []; // step ids waiting for a transcript, oldest recording first
  const timers = new Set<ReturnType<typeof setTimeout>>();

  // Yes/no questions show their follow-up only after the patient tapped 「有」.
  const steps = computed<Step[]>(() =>
    questions.flatMap((q) => (q.followUp && answers.value[q.id]?.kind === "choice" && answers.value[q.id]?.text === "有" ? [{ question: q }, { question: q, followUp: q.followUp }] : [{ question: q }])),
  );
  const step = computed(() => steps.value[Math.min(stepIndex.value, steps.value.length - 1)]);
  const answer = computed(() => answers.value[stepId(step.value)]);
  const questionNo = computed(() => questions.indexOf(step.value.question) + 1);
  const isLast = computed(() => stepIndex.value >= steps.value.length - 1);
  const answeredCount = computed(() => Object.values(answers.value).filter((a) => a.kind !== "skipped" && a.state !== "no_speech").length);
  const canFinish = computed(() => answeredCount.value > 0 && !listening.value && !finishing.value);

  // The session is created lazily on the first answer, so opening the screen writes nothing.
  async function ensureSession() {
    if (!sessionId) sessionId = (await api.createSession("patient")).session_id;
    return sessionId;
  }

  function ensureConnection(id: string) {
    conn ??= api.connect(id, "patient", {
      onMessage: (m) => {
        offline.value = false;
        if (m.type === "transcript.segment" && m.speaker === "patient" && !sentLines.has(m.text)) {
          const id = voiceQueue.shift();
          if (id && answers.value[id]?.state === "transcribing") answers.value[id] = { kind: "voice", text: m.text, state: "sent" };
        }
        if (m.type === "error") {
          error.value = m.message;
          const id = voiceQueue.shift();
          if (id && answers.value[id]?.state === "transcribing") answers.value[id] = { kind: "voice", text: "", state: "failed" };
        }
      },
      onClose: () => {
        offline.value = true;
        conn = null;
      },
    });
    return conn;
  }

  function send(line: string): Promise<boolean> {
    sentLines.add(line);
    const p = (async () => {
      try {
        await api.addTextInput(await ensureSession(), line, "patient");
        return true;
      } catch (e) {
        unsent.push(line);
        error.value = message(e, "回答還沒送出，按「完成」時會再試一次");
        return false;
      }
    })();
    inflight.add(p);
    void p.finally(() => inflight.delete(p));
    return p;
  }

  function setAnswer(id: string, a: PatientAnswer) {
    answers.value = { ...answers.value, [id]: a };
  }

  async function answerWith(kind: "text" | "choice", raw: string): Promise<boolean> {
    const text = raw.trim();
    if (!text || listening.value) return false;
    const s = step.value;
    const id = stepId(s);
    error.value = "";
    setAnswer(id, { kind, text, state: "sending" });
    const ok = await send(transcriptLine(transcriptQuestion(s), text));
    if (answers.value[id]?.text === text) setAnswer(id, { kind, text, state: ok ? "sent" : "failed" });
    return true;
  }

  const answerText = (text: string) => answerWith("text", text);
  const answerChoice = (choice: "有" | "沒有") => answerWith("choice", choice);

  async function toggleListening() {
    const id = stepId(step.value);
    if (listening.value) {
      recorder.stop();
      conn?.send({ type: "recording.stop" });
      listening.value = false;
      setAnswer(id, { kind: "voice", text: "", state: "transcribing" });
      voiceQueue.push(id);
      const t = setTimeout(() => {
        timers.delete(t);
        if (answers.value[id]?.state !== "transcribing") return;
        voiceQueue = voiceQueue.filter((x) => x !== id);
        setAnswer(id, { kind: "voice", text: "", state: "no_speech" });
      }, VOICE_TIMEOUT_MS);
      timers.add(t);
      return;
    }
    error.value = "";
    try {
      const c = ensureConnection(await ensureSession());
      await recorder.start((chunk) => c.sendAudio(chunk));
      if (recorder.state.value !== "recording") {
        error.value =
          recorder.state.value === "denied"
            ? "無法使用麥克風：請允許瀏覽器使用麥克風，或改用打字回答。"
            : recorder.error.value || "無法使用麥克風，請改用打字回答。";
        return;
      }
      // The question goes in first, so the transcript reads question → spoken answer.
      void send(transcriptLine(transcriptQuestion(step.value)));
      c.send({ type: "recording.start" });
      listening.value = true;
    } catch (e) {
      error.value = message(e, "無法開始錄音，請改用打字回答");
    }
  }

  function start() {
    phase.value = "questions";
    stepIndex.value = 0;
  }

  function next() {
    if (listening.value) return;
    const id = stepId(step.value);
    if (!answers.value[id]) setAnswer(id, { kind: "skipped", text: "", state: "sent" });
    if (!isLast.value) stepIndex.value++;
  }

  function skip() {
    if (listening.value) return;
    setAnswer(stepId(step.value), { kind: "skipped", text: "", state: "sent" });
    if (!isLast.value) stepIndex.value++;
  }

  function back() {
    if (!listening.value && stepIndex.value > 0) stepIndex.value--;
  }

  // Clears the answer on screen so the patient can answer again. What was already sent stays in the transcript;
  // the new answer is added after it, so the nurse sees both.
  function reanswer() {
    if (listening.value) return;
    const { [stepId(step.value)]: _old, ...rest } = answers.value;
    answers.value = rest;
  }

  const waitFor = (cond: () => boolean) =>
    new Promise<void>((resolve) => {
      const tick = () => (cond() ? resolve() : setTimeout(tick, 100));
      tick();
    });

  async function finish() {
    if (!canFinish.value) return;
    finishing.value = true;
    error.value = "";
    try {
      const id = await ensureSession();
      // A transcript that arrives after finishing would be rejected by the api, so wait for recordings first.
      await waitFor(() => !Object.values(answers.value).some((a) => a.state === "transcribing"));
      await Promise.all(inflight);
      while (unsent.length) {
        await api.addTextInput(id, unsent[0], "patient");
        unsent.shift();
      }
      visitNo.value = (await api.finishIntake(id)).visit_no;
      conn?.close();
      conn = null;
      phase.value = "done";
    } catch (e) {
      error.value = message(e, "無法完成，您的回答還在，請再試一次");
    } finally {
      finishing.value = false;
    }
  }

  function reset() {
    recorder.stop();
    conn?.close();
    conn = null;
    for (const t of timers) clearTimeout(t);
    timers.clear();
    phase.value = "intro";
    stepIndex.value = 0;
    answers.value = {};
    listening.value = false;
    visitNo.value = "";
    error.value = "";
    offline.value = false;
    finishing.value = false;
    sessionId = null;
    inflight = new Set();
    unsent = [];
    sentLines = new Set();
    voiceQueue = [];
  }

  return {
    phase, step, steps, stepIndex, questionNo, isLast, answer, answers, listening, visitNo,
    finishing, error, offline, level: recorder.level, canFinish,
    start, next, skip, back, reanswer, answerText, answerChoice, toggleListening, finish, reset,
  };
});
