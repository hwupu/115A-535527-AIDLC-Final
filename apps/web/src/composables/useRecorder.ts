import { ref, type Ref } from "vue";

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

// PLACEHOLDER(C2): simulated, never touches the microphone, so the workflow can be developed and demoed with the mock api.
export function useRecorder(): Recorder {
  const state = ref<RecorderState>("idle");
  const level = ref(0);
  const error = ref("");
  let timer: ReturnType<typeof setInterval> | undefined;

  return {
    state,
    level,
    error,
    async start() {
      error.value = "";
      state.value = "recording";
      timer = setInterval(() => (level.value = 0.2 + Math.random() * 0.6), 200);
    },
    stop() {
      clearInterval(timer);
      level.value = 0;
      state.value = "idle";
    },
  };
}
