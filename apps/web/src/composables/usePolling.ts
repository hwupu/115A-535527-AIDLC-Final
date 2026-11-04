import { onMounted, onUnmounted } from "vue";

// Run `fn` now and then every `ms` until the component is unmounted. Errors are the caller's to handle.
export function usePolling(fn: () => unknown, ms = 5000) {
  let timer: ReturnType<typeof setInterval> | undefined;
  onMounted(() => {
    fn();
    timer = setInterval(fn, ms);
  });
  onUnmounted(() => clearInterval(timer));
}
