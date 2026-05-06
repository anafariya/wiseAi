// Lightweight perf instrumentation. Measures init time, time-to-first-estimate,
// per-chunk end-to-end latency, sustained FPS reported by the SDK, and total
// runtime. All times in ms via performance.now().

import {
  CHUNK_DURATION_MS,
  TOTAL_CHUNKS,
  type ChunkResult,
  type Metrics,
  type WiseAIResult,
} from "./types";

export class MetricsCollector {
  private sessionStart: number | null = null;
  private firstEstimateAt: number | null = null;
  private lastFps: number | null = null;
  private chunkLatency: Array<number | null> = Array.from({ length: TOTAL_CHUNKS }, () => null);
  private endAt: number | null = null;
  private validCount = 0;
  private flaggedCount = 0;
  public sdkInitMs: number | null = null;

  startSession() {
    this.sessionStart = performance.now();
  }

  recordSdkInit(ms: number) {
    this.sdkInitMs = ms;
  }

  /**
   * Called for each SDK 'vitals' event. Captures TTFE on first call and
   * the SDK's reported FPS.
   */
  recordVitalsEvent(_tMs: number, result: WiseAIResult) {
    if (this.sessionStart !== null && this.firstEstimateAt === null) {
      this.firstEstimateAt = performance.now() - this.sessionStart;
    }
    if (typeof result.fps === "number") this.lastFps = result.fps;
  }

  /**
   * Called when a chunk is finalized. End-to-end latency = wall-clock at
   * finalization minus the chunk's nominal start time (in session ms).
   */
  recordChunkFinalized(c: ChunkResult) {
    if (this.sessionStart === null) return;
    const wallNow = c.emittedAt - this.sessionStart;
    this.chunkLatency[c.index] = wallNow - c.startMs;
    if (c.faceDetected && c.hr !== null) this.validCount++;
    else this.flaggedCount++;
  }

  endSession() {
    if (this.sessionStart !== null) {
      this.endAt = performance.now() - this.sessionStart;
    }
  }

  snapshot(): Metrics {
    return {
      sdkInitMs: this.sdkInitMs,
      timeToFirstEstimateMs: this.firstEstimateAt,
      perChunkLatencyMs: [...this.chunkLatency],
      sustainedFps: this.lastFps,
      totalRuntimeMs: this.endAt,
      validChunks: this.validCount,
      flaggedChunks: this.flaggedCount,
    };
  }

  /** Total elapsed session ms, useful for live UI countdown. */
  elapsedMs(): number {
    if (this.sessionStart === null) return 0;
    return performance.now() - this.sessionStart;
  }

  /** True once all 12 chunks should be finalized (60s elapsed). */
  isComplete(): boolean {
    return this.elapsedMs() >= TOTAL_CHUNKS * CHUNK_DURATION_MS;
  }
}
