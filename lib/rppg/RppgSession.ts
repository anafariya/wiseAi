// Adapter around the Wise AI SDK. The rest of the app talks to this class so
// we can swap SDKs or methods without touching UI code. The SDK ships as a
// browser ES module under /public/wiseai-sdk and is imported dynamically.

import type {
  WiseAIInstance,
  WiseAIOptions,
  WiseAIResult,
} from "./types";

export type RppgEvent =
  | { type: "vitals"; result: WiseAIResult; tMs: number }
  | { type: "faceDetected"; faceDetected: boolean; tMs: number }
  | { type: "fileProgress"; message: string }
  | { type: "streamReset"; message: string }
  | { type: "error"; message: string; fatal: boolean };

type Listener = (e: RppgEvent) => void;

let cachedCtor: (new (opts: WiseAIOptions) => WiseAIInstance) | null = null;

async function loadWiseAI() {
  if (cachedCtor) return cachedCtor;
  // The SDK is a static asset at /wiseai-sdk/wiseai-sdk.browser.js. We use a
  // dynamic import with a runtime-resolved URL so Next/webpack doesn't try
  // to bundle it.
  const url = "/wiseai-sdk/wiseai-sdk.browser.js";
  const mod = await import(/* webpackIgnore: true */ /* @vite-ignore */ url);
  if (!mod?.WiseAI) {
    throw new Error("Wise AI SDK loaded but WiseAI export is missing.");
  }
  cachedCtor = mod.WiseAI as new (opts: WiseAIOptions) => WiseAIInstance;
  return cachedCtor;
}

export class RppgSession {
  private instance: WiseAIInstance | null = null;
  private listeners = new Set<Listener>();
  private startTime = 0;
  private initStart = 0;
  private initialized = false;

  constructor(private options: WiseAIOptions) {}

  on(listener: Listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(e: RppgEvent) {
    for (const l of this.listeners) l(e);
  }

  /** Time in ms since the session started (or 0 before start). */
  now() {
    return this.startTime ? performance.now() - this.startTime : 0;
  }

  /** Initialize SDK. Returns init duration in ms. */
  async init(): Promise<number> {
    this.initStart = performance.now();
    const Ctor = await loadWiseAI();
    this.instance = new Ctor(this.options);
    this.wireEvents();
    this.initialized = true;
    return performance.now() - this.initStart;
  }

  private wireEvents() {
    if (!this.instance) return;
    this.instance.addEventListener("vitals", (data) => {
      const result = data as WiseAIResult;
      this.emit({ type: "vitals", result, tMs: this.now() });
    });
    this.instance.addEventListener("faceDetected", (data) => {
      // SDK passes either a face object, an array, or null.
      const detected = data !== null && data !== undefined;
      this.emit({ type: "faceDetected", faceDetected: detected, tMs: this.now() });
    });
    this.instance.addEventListener("fileProgress", (data) => {
      this.emit({ type: "fileProgress", message: String(data ?? "") });
    });
    this.instance.addEventListener("streamReset", (data) => {
      const obj = data as { message?: string } | string | null;
      const msg = typeof obj === "string" ? obj : obj?.message ?? "stream reset";
      this.emit({ type: "streamReset", message: msg });
    });
  }

  /** Live webcam path. Resolves once the SDK is bound to the stream. */
  async startStream(stream: MediaStream, videoEl: HTMLVideoElement) {
    if (!this.instance) throw new Error("RppgSession.init() must be called first.");
    await this.instance.setVideoStream(stream, videoEl);
    this.startTime = performance.now();
    this.instance.startVideoStream();
  }

  pauseStream() {
    this.instance?.pauseVideoStream();
  }

  resumeStream() {
    this.instance?.startVideoStream();
  }

  stopStream() {
    this.instance?.stopVideoStream();
  }

  /** File path. Marks startTime when invocation begins. */
  async processFile(file: File): Promise<WiseAIResult> {
    if (!this.instance) throw new Error("RppgSession.init() must be called first.");
    this.startTime = performance.now();
    try {
      return await this.instance.processVideoFile(file);
    } catch (err) {
      const e = err as { name?: string; message?: string };
      this.emit({
        type: "error",
        message: e?.message ?? "Processing failed",
        fatal: e?.name === "WiseAIAPIKeyError",
      });
      throw err;
    }
  }

  async close() {
    if (this.instance) {
      try {
        this.instance.stopVideoStream();
      } catch {
        // best-effort
      }
      try {
        await this.instance.close();
      } catch {
        // best-effort
      }
    }
    this.instance = null;
    this.initialized = false;
    this.listeners.clear();
  }

  isInitialized() {
    return this.initialized;
  }
}
