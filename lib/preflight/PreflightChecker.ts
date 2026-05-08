import {
  emptyPreflightStatus,
  PREFLIGHT_THRESHOLDS,
  type PreflightStatus,
} from "./types";

// MediaPipe FaceMesh comes from a CDN <script> tag in app/layout.tsx and
// attaches itself to window.FaceMesh. We avoid an npm dep — same pattern
// the Aurae faceScanJS prototype used (faceScanJS/index.html:26-29).
type Landmark = { x: number; y: number; z: number };
type FaceMeshResults = {
  multiFaceLandmarks?: Landmark[][];
};
type FaceMeshInstance = {
  setOptions: (opts: Record<string, unknown>) => void;
  onResults: (cb: (r: FaceMeshResults) => void) => void;
  send: (input: { image: HTMLVideoElement }) => Promise<void>;
  initialize?: () => Promise<void>;
  close: () => void;
};
type FaceMeshCtor = new (cfg: { locateFile: (f: string) => string }) => FaceMeshInstance;

declare global {
  interface Window {
    FaceMesh?: FaceMeshCtor;
  }
}

async function waitForFaceMesh(timeoutMs = 15000): Promise<FaceMeshCtor> {
  const start = Date.now();
  while (!window.FaceMesh) {
    if (Date.now() - start > timeoutMs) {
      throw new Error("MediaPipe FaceMesh failed to load (CDN blocked?)");
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  return window.FaceMesh;
}

// Composite face size — sqrt(eyeDistance × faceHeight × faceWidth) in
// normalized landmark coords. Lifted from Aurae's calculateFaceMetrics
// (faceScanJS/script.js:616-645).
function computeCompositeSize(lm: Landmark[]): number {
  const leftEye = lm[33];
  const rightEye = lm[263];
  const noseTip = lm[1];
  const chin = lm[175];
  const leftCheek = lm[234];
  const rightCheek = lm[454];
  const eyeDist = Math.hypot(rightEye.x - leftEye.x, rightEye.y - leftEye.y);
  const faceHeight = Math.abs(noseTip.y - chin.y);
  const faceWidth = Math.abs(rightCheek.x - leftCheek.x);
  return Math.sqrt(eyeDist * faceHeight * faceWidth);
}

// Cheek-symmetry ratio. 0 = perfectly facing camera, higher = head turned.
// Lifted from Aurae's checkFaceOrientation (faceScanJS/script.js:647-666).
function computeOrientationRatio(lm: Landmark[]): number {
  const noseTip = lm[1];
  const leftCheek = lm[234];
  const rightCheek = lm[454];
  const left = Math.abs(noseTip.x - leftCheek.x);
  const right = Math.abs(rightCheek.x - noseTip.x);
  const avg = (left + right) / 2;
  if (avg === 0) return 0;
  return Math.abs(left - right) / avg;
}

// Mean luminance over the face bounding box, sampled every 8th pixel
// for speed. Returns 0..255.
function computeFaceLuminance(
  videoEl: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  lm: Landmark[],
): number {
  const top = lm[10];
  const bottom = lm[152];
  const left = lm[234];
  const right = lm[454];
  const w = videoEl.videoWidth;
  const h = videoEl.videoHeight;
  if (!w || !h) return 0;

  const minX = Math.max(0, Math.floor(left.x * w));
  const maxX = Math.min(w, Math.ceil(right.x * w));
  const minY = Math.max(0, Math.floor(top.y * h));
  const maxY = Math.min(h, Math.ceil(bottom.y * h));
  const cw = maxX - minX;
  const ch = maxY - minY;
  if (cw <= 4 || ch <= 4) return 0;

  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext("2d");
  if (!ctx) return 0;
  ctx.drawImage(videoEl, minX, minY, cw, ch, 0, 0, cw, ch);
  const data = ctx.getImageData(0, 0, cw, ch).data;
  let sum = 0;
  let n = 0;
  for (let i = 0; i < data.length; i += 32) {
    sum += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    n++;
  }
  return n > 0 ? sum / n : 0;
}

type VideoFrameMeta = { mediaTime: number; presentedFrames: number };
type VFCVideoElement = HTMLVideoElement & {
  requestVideoFrameCallback?: (cb: (now: number, meta: VideoFrameMeta) => void) => number;
  cancelVideoFrameCallback?: (id: number) => void;
};

export class PreflightChecker {
  private faceMesh: FaceMeshInstance | null = null;
  private timer: number | null = null;
  private rvfcId: number | null = null;
  private rafId: number | null = null;
  private videoEl: VFCVideoElement;
  private hiddenCanvas: HTMLCanvasElement;
  private fpsTimes: number[] = [];
  private status: PreflightStatus = emptyPreflightStatus();
  private listener: ((s: PreflightStatus) => void) | null = null;
  private running = false;
  private inFlight = false;

  constructor(videoEl: HTMLVideoElement) {
    this.videoEl = videoEl as VFCVideoElement;
    this.hiddenCanvas = document.createElement("canvas");
  }

  onUpdate(cb: (s: PreflightStatus) => void): void {
    this.listener = cb;
  }

  async start(): Promise<void> {
    const FaceMesh = await waitForFaceMesh();
    const fm = new FaceMesh({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
    });
    fm.setOptions({
      maxNumFaces: 1,
      refineLandmarks: false,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });
    fm.onResults((r) => this.handleResults(r));
    if (fm.initialize) await fm.initialize();
    this.faceMesh = fm;
    this.running = true;
    this.startFpsMeasurement();
    this.scheduleNext();
  }

  stop(): void {
    this.running = false;
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    if (
      this.rvfcId !== null &&
      typeof this.videoEl.cancelVideoFrameCallback === "function"
    ) {
      this.videoEl.cancelVideoFrameCallback(this.rvfcId);
      this.rvfcId = null;
    }
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    if (this.faceMesh) {
      try {
        this.faceMesh.close();
      } catch {
        // best-effort
      }
      this.faceMesh = null;
    }
    this.fpsTimes = [];
  }

  private startFpsMeasurement(): void {
    if (typeof this.videoEl.requestVideoFrameCallback === "function") {
      const onFrame = (now: number) => {
        this.fpsTimes.push(now);
        const cutoff = now - 2000;
        while (this.fpsTimes.length && this.fpsTimes[0] < cutoff) {
          this.fpsTimes.shift();
        }
        if (this.running && this.videoEl.requestVideoFrameCallback) {
          this.rvfcId = this.videoEl.requestVideoFrameCallback(onFrame);
        }
      };
      this.rvfcId = this.videoEl.requestVideoFrameCallback(onFrame);
    } else {
      // Fallback: rAF tick rate, capped at display refresh. Less accurate
      // for true camera FPS but good enough to detect catastrophic drops.
      const onTick = () => {
        const now = performance.now();
        this.fpsTimes.push(now);
        const cutoff = now - 2000;
        while (this.fpsTimes.length && this.fpsTimes[0] < cutoff) {
          this.fpsTimes.shift();
        }
        if (this.running) this.rafId = requestAnimationFrame(onTick);
      };
      this.rafId = requestAnimationFrame(onTick);
    }
  }

  private currentFps(): number {
    if (this.fpsTimes.length < 2) return 0;
    const span =
      (this.fpsTimes[this.fpsTimes.length - 1] - this.fpsTimes[0]) / 1000;
    if (span <= 0) return 0;
    return (this.fpsTimes.length - 1) / span;
  }

  private scheduleNext(): void {
    if (!this.running) return;
    this.timer = window.setTimeout(() => void this.tick(), 100);
  }

  private async tick(): Promise<void> {
    if (!this.running || !this.faceMesh) return;
    if (this.inFlight) {
      this.scheduleNext();
      return;
    }
    if (this.videoEl.readyState >= 2 && this.videoEl.videoWidth > 0) {
      this.inFlight = true;
      try {
        await this.faceMesh.send({ image: this.videoEl });
      } catch {
        // swallow — will retry on next tick
      } finally {
        this.inFlight = false;
      }
    } else {
      // Camera not yet emitting frames — still publish FPS-only status
      // so the panel updates.
      this.publish(emptyPreflightStatus());
    }
    this.scheduleNext();
  }

  private handleResults(results: FaceMeshResults): void {
    const fpsValue = this.currentFps();
    const fpsPass = fpsValue >= PREFLIGHT_THRESHOLDS.fpsMin;

    if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
      this.publish({
        ...emptyPreflightStatus(),
        fps: { value: fpsValue, pass: fpsPass },
      });
      return;
    }

    const lm = results.multiFaceLandmarks[0];
    const proximityVal = computeCompositeSize(lm);
    const orientationVal = computeOrientationRatio(lm);
    const luminanceVal = computeFaceLuminance(this.videoEl, this.hiddenCanvas, lm);

    const proximityPass =
      proximityVal >= PREFLIGHT_THRESHOLDS.proximityMin &&
      proximityVal <= PREFLIGHT_THRESHOLDS.proximityMax;
    const orientationPass = orientationVal <= PREFLIGHT_THRESHOLDS.orientationMax;
    const lightingPass =
      luminanceVal >= PREFLIGHT_THRESHOLDS.luminanceMin &&
      luminanceVal <= PREFLIGHT_THRESHOLDS.luminanceMax;

    const next: PreflightStatus = {
      faceDetected: true,
      proximity: { value: proximityVal, pass: proximityPass },
      orientation: { value: orientationVal, pass: orientationPass },
      lighting: { value: luminanceVal, pass: lightingPass },
      fps: { value: fpsValue, pass: fpsPass },
      ready: proximityPass && orientationPass && lightingPass && fpsPass,
    };
    this.publish(next);
  }

  private publish(s: PreflightStatus): void {
    this.status = s;
    this.listener?.(s);
  }
}
