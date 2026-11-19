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

// Whole WebM/MP4 recording sent at stop: arbitrary MediaRecorder fragments are not independently decodable.
export function useRecorder(): Recorder {
  const state = ref<RecorderState>("idle");
  const level = ref(0);
  const error = ref("");
  let timer: ReturnType<typeof setInterval> | undefined;
  let media: MediaRecorder | undefined;
  let stream: MediaStream | undefined;
  let context: AudioContext | undefined;
  function release() {
    clearInterval(timer);
    stream?.getTracks().forEach((track) => track.stop());
    void context?.close();
    context = undefined;
    level.value = 0;
  }
  onScopeDispose(() => { if (media?.state === "recording") media.stop(); release(); });

  return {
    state,
    level,
    error,
    async start(onChunk) {
      error.value = "";
      if (state.value === "recording") return;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mimeType = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"].find((m) => MediaRecorder.isTypeSupported(m));
        media = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
        const chunks: Blob[] = [];
        media.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
        media.onstop = () => {
          const blob = new Blob(chunks, { type: media?.mimeType });
          if (blob.size) onChunk(blob);
          release();
        };
        context = new AudioContext();
        const analyser = context.createAnalyser();
        context.createMediaStreamSource(stream).connect(analyser);
        const samples = new Uint8Array(analyser.fftSize);
        timer = setInterval(() => {
          analyser.getByteTimeDomainData(samples);
          level.value = Math.min(1, Math.sqrt(samples.reduce((sum, n) => sum + ((n - 128) / 128) ** 2, 0) / samples.length) * 5);
        }, 100);
        media.start();
        state.value = "recording";
      } catch (e) {
        release();
        state.value = e instanceof DOMException && e.name === "NotAllowedError" ? "denied" : "error";
        error.value = "無法使用麥克風，請允許錄音或改用文字輸入。";
      }
    },
    stop() {
      if (media?.state === "recording") media.stop();
      else release();
      state.value = "idle";
    },
  };
}
