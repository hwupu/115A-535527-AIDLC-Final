import { onMounted, onUnmounted } from "vue";

// Keyboard shortcuts for a screen (#28). Keys are matched on KeyboardEvent.key ("ArrowUp", " ", "e", "?").
// A shortcut never fires while the user is typing: in an input, textarea, select or contenteditable, or while an
// IME is composing (注音 input uses Space to pick characters). Keys with Ctrl/Cmd/Alt are left to the browser.
// Space is taken over everywhere else, including on a focused button: after a tap the button keeps focus, and
// Space would otherwise press it again (for example 「確認」 a second time). Enter still presses focused buttons.
export type ShortcutMap = Record<string, (e: KeyboardEvent) => void>;

export function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  return target.closest("input, textarea, select, [contenteditable='true']") !== null;
}

export function shortcutHandler(map: () => ShortcutMap) {
  return (e: KeyboardEvent) => {
    if (e.defaultPrevented || e.isComposing || e.ctrlKey || e.metaKey || e.altKey) return;
    if (isTyping(e.target)) return;
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    const action = map()[key];
    if (!action) return;
    // Enter on a focused button or link keeps its normal meaning (press it).
    if (key === "Enter" && e.target instanceof HTMLElement && e.target.closest("button, a, [role='button'], [role='tab'], summary")) return;
    if (key === " " && e.repeat) return e.preventDefault(); // holding Space must not toggle the microphone on and off
    e.preventDefault();
    action(e);
  };
}

// `map` is a function so the current state decides which keys are active (for example no Space before consent).
export function useShortcuts(map: () => ShortcutMap) {
  const handler = shortcutHandler(map);
  onMounted(() => window.addEventListener("keydown", handler));
  onUnmounted(() => window.removeEventListener("keydown", handler));
}
