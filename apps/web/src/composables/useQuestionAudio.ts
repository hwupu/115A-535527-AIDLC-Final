import { ref } from "vue";
import { audioUrl } from "@/intake/questions";

// Reads a fixed question aloud from its pre-made file (public/audio/questions). Never reads AI output.
// Browsers only allow sound after a tap, so the first question is played from the 「開始」 tap.
// Call stop() before the microphone starts, so the recording does not pick up the question.
export function useQuestionAudio() {
  const enabled = ref(true);
  const playing = ref(false);
  let el: HTMLAudioElement | null = null;

  function stop() {
    el?.pause();
    el = null;
    playing.value = false;
  }

  function play(id: string, force = false) {
    stop();
    if ((!enabled.value && !force) || typeof Audio === "undefined") return;
    const a = new Audio(audioUrl(id));
    el = a;
    a.onended = a.onerror = () => {
      if (el === a) playing.value = false;
    };
    playing.value = true;
    // A missing file or a blocked autoplay only means no sound; the question is always on screen.
    a.play().catch(() => {
      if (el === a) playing.value = false;
    });
  }

  function toggle() {
    enabled.value = !enabled.value;
    if (!enabled.value) stop();
  }

  return { enabled, playing, play, stop, toggle };
}
