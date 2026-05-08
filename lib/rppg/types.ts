// Mirrors the Wise AI SDK result shape (see SDK README) so the rest of the
// app can consume a typed surface even though we load the SDK dynamically
// from /public at runtime.

export type Vital = {
  value: number;
  unit: string;
  confidence: number;
};

export type WiseAIResult = {
  face: {
    coordinates?: Array<[number, number, number, number]>;
    confidence?: number[];
  };
  vitals: {
    heart_rate?: Vital;
    respiratory_rate?: Vital;
    hrv_sdnn?: Vital;
    hrv_rmssd?: Vital;
  };
  waveforms?: {
    ppg_waveform?: { data: number[]; unit: string; confidence: number[] };
    respiratory_waveform?: { data: number[]; unit: string; confidence: number[] };
  };
  fps?: number;
  time?: number[];
  message?: string;
};

export type WiseAIMethod = "wiseai" | "pos" | "chrom" | "g";

export type WiseAIOptions = {
  method: WiseAIMethod;
  apiKey?: string;
  proxyUrl?: string;
  waveformMode?: "incremental" | "windowed" | "global";
  overrideFpsTarget?: number;
  fDetFs?: number;
};

export type WiseAIInstance = {
  setVideoStream: (stream: MediaStream, videoEl: HTMLVideoElement) => Promise<void>;
  startVideoStream: () => void;
  pauseVideoStream: () => void;
  stopVideoStream: () => void;
  reset: () => void;
  processVideoFile: (file: File | Blob | string) => Promise<WiseAIResult>;
  addEventListener: (event: string, cb: (data: unknown) => void) => void;
  removeEventListener: (event: string) => void;
  close: () => Promise<void>;
};

// Per-chunk record produced by ChunkAggregator. Twelve of these for a 60s run.
export type ChunkResult = {
  index: number;            // 0..11
  startMs: number;          // ms from session start
  endMs: number;            // ms from session start
  hr: number | null;        // bpm
  rr: number | null;        // breaths/min
  hrConfidence: number;     // 0..1, average across events in the bucket
  rrConfidence: number;
  faceDetected: boolean;
  sampleCount: number;      // how many SDK 'vitals' events fell in this bucket
  emittedAt: number;        // wall-clock ms when this chunk was finalized
};

export type VitalAggregate =
  | {
      kind: "ok";
      value: number;
      uncertainty: number; // half-width of the IQR (50% interval) over the valid pool
      sampleCount: number;
    }
  | { kind: "insufficient_data"; reason: string };

export type AggregateResult =
  | {
      kind: "ok";
      hr: VitalAggregate;
      rr: VitalAggregate;
      validChunks: number;
      totalChunks: number;
      hampelRejected: number; // chunks discarded by the second-pass MAD filter
    }
  | { kind: "insufficient_data"; validChunks: number; totalChunks: number; reason: string };

export type Metrics = {
  sdkInitMs: number | null;        // SDK constructor → setVideoStream resolved
  timeToFirstEstimateMs: number | null;
  perChunkLatencyMs: Array<number | null>; // chunk index → end-to-end latency
  sustainedFps: number | null;     // last reported by SDK
  totalRuntimeMs: number | null;
  validChunks: number;
  flaggedChunks: number;
};

export const CHUNK_DURATION_MS = 5000;
export const TOTAL_DURATION_MS = 60000;
export const TOTAL_CHUNKS = TOTAL_DURATION_MS / CHUNK_DURATION_MS; // 12
export const VALID_CONFIDENCE_THRESHOLD = 0.5;
export const MIN_VALID_CHUNKS_FOR_AGGREGATE = 3;
// Hampel filter parameter: reject chunks more than HAMPEL_K * (1.4826 * MAD)
// from the median. k=3.0 is conservative — drops only obvious outliers
// (motion bursts, lighting jumps) while preserving real HR variation.
export const HAMPEL_K = 3.0;
