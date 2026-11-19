import { onScopeDispose, ref, type Ref } from "vue";

// C2 contract: the nurse screen only depends on this shape. Replace the body, keep the return type.
//   start(onChunk): ask for the microphone, then call onChunk with audio chunks until stop().
//   state "denied" = permission refused; "error" = no device or other failure (message in `error`).
//   level: 0..1 input volume for the meter.
export type RecorderState = "idle" | "recording" | "denied" | "error";

export interface Recorder {
  state: Ref<RecorderState>;
  level: Ref<number>;
  error: Ref<string>;
  start(onChunk: (chunk: Blob) => void): Promise<void>;
  stop(): void;
}

// Every message says what to do next; recording is never the only way to fill the report.
export const RECORDER_MESSAGES = {
  unsupported: "此瀏覽器無法錄音（需要 HTTPS 或 localhost），請改用手動輸入。",
  denied: "麥克風權限被拒絕。請在瀏覽器網址列允許使用麥克風，或改用手動輸入。",
  noDevice: "找不到麥克風，請確認裝置已連接，或改用手動輸入。",
  busy: "麥克風正被其他程式使用，請關閉該程式後再試，或改用手動輸入。",
  ended: "麥克風連線中斷，已錄到的內容已送出。請檢查裝置後重新開始，或改用手動輸入。",
  failed: "無法使用麥克風，請改用手動輸入。",
} as const;

function describe(e: unknown): { state: RecorderState; message: string } {
  const name = e instanceof DOMException || e instanceof Error ? e.name : "";
  switch (name) {
    case "NotAllowedError":
    case "SecurityError":
      return { state: "denied", message: RECORDER_MESSAGES.denied };
    case "NotFoundError":
    case "OverconstrainedError":
      return { state: "error", message: RECORDER_MESSAGES.noDevice };
    case "NotReadableError":
    case "AbortError":
      return { state: "error", message: RECORDER_MESSAGES.busy };
    default:
      return { state: "error", message: RECORDER_MESSAGES.failed };
  }
}

// Whole WebM/MP4 recording sent at stop: arbitrary MediaRecorder fragments are not independently decodable.
export function useRecorder(): Recorder {
  const state = ref<RecorderState>("idle");
  const level = ref(0);
  const error = ref("");
  let timer: ReturnType<typeof setInterval> | undefined;
  let media: MediaRecorder | undefined;
  let stream: MediaStream | undefined;
  let context: AudioContext | undefined;
  // Bumped by every start and stop, so a permission prompt answered after stop() does not start recording.
  let attempt = 0;

  function release() {
    clearInterval(timer);
    timer = undefined;
    stream?.getTracks().forEach((track) => track.stop());
    stream = undefined;
    void context?.close();
    context = undefined;
    level.value = 0;
  }
  function finish() {
    if (media?.state === "recording") media.stop(); // onstop sends the audio, then releases
    else release();
  }
  onScopeDispose(() => {
    attempt++;
    finish();
  });

  async function start(onChunk: (chunk: Blob) => void) {
    if (state.value === "recording") return;
    const mine = ++attempt;
    error.value = "";
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      state.value = "error";
      error.value = RECORDER_MESSAGES.unsupported;
      return;
    }
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (mine !== attempt) {
        s.getTracks().forEach((track) => track.stop()); // stopped or unmounted while the prompt was open
        return;
      }
      stream = s;
      const mimeType = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"].find((m) => MediaRecorder.isTypeSupported(m));
      const recorder = new MediaRecorder(s, mimeType ? { mimeType } : undefined);
      media = recorder;
      const chunks: Blob[] = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size) chunks.push(event.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: recorder.mimeType });
        if (blob.size) onChunk(blob);
        release();
      };
      // Unplugged headset or the OS took the microphone away: send what we have and say so.
      s.getAudioTracks().forEach((track) =>
        track.addEventListener("ended", () => {
          if (mine !== attempt || state.value !== "recording") return;
          finish();
          state.value = "error";
          error.value = RECORDER_MESSAGES.ended;
        }),
      );
      startMeter(s);
      recorder.start();
      state.value = "recording";
    } catch (e) {
      if (mine !== attempt) return;
      release();
      const { state: next, message } = describe(e);
      state.value = next;
      error.value = message;
    }
  }

  // The meter is a nice-to-have: if Web Audio is unavailable, recording still works with the bar at 0.
  function startMeter(s: MediaStream) {
    if (typeof AudioContext === "undefined") return;
    try {
      context = new AudioContext();
      const analyser = context.createAnalyser();
      context.createMediaStreamSource(s).connect(analyser);
      const samples = new Uint8Array(analyser.fftSize);
      timer = setInterval(() => {
        analyser.getByteTimeDomainData(samples);
        const rms = Math.sqrt(samples.reduce((sum, n) => sum + ((n - 128) / 128) ** 2, 0) / samples.length);
        level.value = Math.min(1, rms * 5);
      }, 100);
    } catch {
      level.value = 0;
    }
  }

  return {
    state,
    level,
    error,
    start,
    stop() {
      attempt++;
      finish();
      state.value = "idle";
    },
  };
}
