import { effectScope } from "vue";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RECORDER_MESSAGES, useRecorder } from "./useRecorder";

// Fake microphone hardware: getUserMedia, MediaStream tracks and MediaRecorder.
class FakeTrack {
  stop = vi.fn();
  private listeners: Record<string, (() => void)[]> = {};
  addEventListener(type: string, fn: () => void) {
    (this.listeners[type] ??= []).push(fn);
  }
  emit(type: string) {
    this.listeners[type]?.forEach((fn) => fn());
  }
}
class FakeStream {
  track = new FakeTrack();
  getTracks = () => [this.track];
  getAudioTracks = () => [this.track];
}
class FakeMediaRecorder {
  static instances: FakeMediaRecorder[] = [];
  static isTypeSupported = (m: string) => m === "audio/webm";
  state: "inactive" | "recording" = "inactive";
  mimeType: string;
  ondataavailable: ((e: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;
  constructor(_stream: unknown, options?: { mimeType?: string }) {
    this.mimeType = options?.mimeType ?? "";
    FakeMediaRecorder.instances.push(this);
  }
  start() {
    this.state = "recording";
  }
  stop() {
    this.state = "inactive";
    this.ondataavailable?.({ data: new Blob(["audio"], { type: this.mimeType }) });
    this.onstop?.();
  }
}

let stream: FakeStream;
let getUserMedia: ReturnType<typeof vi.fn>;

beforeEach(() => {
  FakeMediaRecorder.instances = [];
  stream = new FakeStream();
  getUserMedia = vi.fn(async () => stream);
  vi.stubGlobal("navigator", { mediaDevices: { getUserMedia } });
  vi.stubGlobal("MediaRecorder", FakeMediaRecorder);
  vi.stubGlobal("AudioContext", undefined); // meter off: recording must still work
});
afterEach(() => vi.unstubAllGlobals());

const domError = (name: string) => new DOMException("fake", name);

describe("useRecorder", () => {
  it("records, then sends one decodable blob and releases the microphone on stop", async () => {
    const r = useRecorder();
    const onChunk = vi.fn();
    await r.start(onChunk);
    expect(getUserMedia).toHaveBeenCalledWith({ audio: true });
    expect(r.state.value).toBe("recording");
    expect(FakeMediaRecorder.instances[0]!.mimeType).toBe("audio/webm");

    r.stop();
    expect(r.state.value).toBe("idle");
    expect(onChunk).toHaveBeenCalledTimes(1);
    expect(onChunk.mock.calls[0]![0]).toBeInstanceOf(Blob);
    expect(stream.track.stop).toHaveBeenCalled();
    expect(r.level.value).toBe(0);
  });

  it("ignores a second start while recording", async () => {
    const r = useRecorder();
    await r.start(vi.fn());
    await r.start(vi.fn());
    expect(getUserMedia).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["NotAllowedError", "denied", RECORDER_MESSAGES.denied],
    ["SecurityError", "denied", RECORDER_MESSAGES.denied],
    ["NotFoundError", "error", RECORDER_MESSAGES.noDevice],
    ["NotReadableError", "error", RECORDER_MESSAGES.busy],
    ["SomethingElse", "error", RECORDER_MESSAGES.failed],
  ])("%s → state %s with a message that offers manual input", async (name, state, message) => {
    getUserMedia.mockRejectedValueOnce(domError(name));
    const r = useRecorder();
    await r.start(vi.fn());
    expect(r.state.value).toBe(state);
    expect(r.error.value).toBe(message);
    expect(r.error.value).toContain("手動輸入");
  });

  it("explains when the browser cannot record at all (no HTTPS / no MediaRecorder)", async () => {
    vi.stubGlobal("navigator", {});
    const r = useRecorder();
    await r.start(vi.fn());
    expect(r.state.value).toBe("error");
    expect(r.error.value).toBe(RECORDER_MESSAGES.unsupported);
  });

  it("clears the previous error when the nurse retries", async () => {
    getUserMedia.mockRejectedValueOnce(domError("NotAllowedError"));
    const r = useRecorder();
    await r.start(vi.fn());
    expect(r.state.value).toBe("denied");
    await r.start(vi.fn());
    expect(r.state.value).toBe("recording");
    expect(r.error.value).toBe("");
  });

  it("does not start if stop() came while the permission prompt was open", async () => {
    let allow!: (s: FakeStream) => void;
    getUserMedia.mockReturnValueOnce(new Promise((res) => (allow = res)));
    const r = useRecorder();
    const pending = r.start(vi.fn());
    r.stop();
    allow(stream);
    await pending;
    expect(r.state.value).toBe("idle");
    expect(FakeMediaRecorder.instances).toHaveLength(0);
    expect(stream.track.stop).toHaveBeenCalled(); // the late microphone is closed again
  });

  it("sends what it has and reports an error when the microphone disappears", async () => {
    const r = useRecorder();
    const onChunk = vi.fn();
    await r.start(onChunk);
    stream.track.emit("ended");
    expect(onChunk).toHaveBeenCalledTimes(1);
    expect(r.state.value).toBe("error");
    expect(r.error.value).toBe(RECORDER_MESSAGES.ended);
  });

  it("stops the microphone when its owner (component or store) goes away", async () => {
    const scope = effectScope();
    const r = scope.run(() => useRecorder())!;
    const onChunk = vi.fn();
    await r.start(onChunk);
    scope.stop();
    expect(stream.track.stop).toHaveBeenCalled();
    expect(onChunk).toHaveBeenCalledTimes(1);
  });
});
