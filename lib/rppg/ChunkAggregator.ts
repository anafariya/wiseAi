// Bucket SDK 'vitals' events into 5-second windows and compute the final
// 60-second aggregate. Confidence-weighted median over valid chunks; chunks
// with confidence < 0.5 or no face are flagged and excluded.
//
// Why median (not mean)? rPPG outliers from motion/lighting are common and
// asymmetric, so the breakdown point matters more than efficiency.

import {
  CHUNK_DURATION_MS,
  HAMPEL_K,
  TOTAL_CHUNKS,
  VALID_CONFIDENCE_THRESHOLD,
  MIN_VALID_CHUNKS_FOR_AGGREGATE,
  type AggregateResult,
  type ChunkResult,
  type VitalAggregate,
  type WiseAIResult,
} from "./types";

type Sample = {
  tMs: number;
  hr: number | null;
  rr: number | null;
  hrConfidence: number;
  rrConfidence: number;
  faceDetected: boolean;
};

export class ChunkAggregator {
  private samplesByBucket: Sample[][] = Array.from({ length: TOTAL_CHUNKS }, () => []);
  private chunks: Array<ChunkResult | null> = Array.from({ length: TOTAL_CHUNKS }, () => null);
  private chunkListeners = new Set<(c: ChunkResult) => void>();

  // We separately track most-recent face-detected status, so a chunk that had
  // any motion/face dropout can still be flagged even if a vitals event landed.
  private lastFaceDetected = true;

  onChunk(cb: (c: ChunkResult) => void) {
    this.chunkListeners.add(cb);
    return () => this.chunkListeners.delete(cb);
  }

  setFaceDetected(detected: boolean) {
    this.lastFaceDetected = detected;
  }

  ingest(tMs: number, result: WiseAIResult) {
    const bucket = Math.min(TOTAL_CHUNKS - 1, Math.max(0, Math.floor(tMs / CHUNK_DURATION_MS)));
    const sample: Sample = {
      tMs,
      hr: result.vitals.heart_rate?.value ?? null,
      rr: result.vitals.respiratory_rate?.value ?? null,
      hrConfidence: result.vitals.heart_rate?.confidence ?? 0,
      rrConfidence: result.vitals.respiratory_rate?.confidence ?? 0,
      faceDetected: this.lastFaceDetected,
    };
    this.samplesByBucket[bucket].push(sample);

    // Eagerly finalize earlier buckets that just rolled over.
    for (let i = 0; i < bucket; i++) {
      if (!this.chunks[i] && this.samplesByBucket[i].length > 0) {
        this.finalizeChunk(i);
      }
    }
  }

  /** Finalize all remaining empty buckets — called when stream ends. */
  finalizeAll() {
    for (let i = 0; i < TOTAL_CHUNKS; i++) {
      if (!this.chunks[i]) this.finalizeChunk(i);
    }
  }

  private finalizeChunk(i: number) {
    const samples = this.samplesByBucket[i];
    let chunk: ChunkResult;
    if (samples.length === 0) {
      chunk = {
        index: i,
        startMs: i * CHUNK_DURATION_MS,
        endMs: (i + 1) * CHUNK_DURATION_MS,
        hr: null,
        rr: null,
        hrConfidence: 0,
        rrConfidence: 0,
        faceDetected: false,
        sampleCount: 0,
        emittedAt: performance.now(),
      };
    } else {
      // Use the last sample's HR/RR (most recent estimate, max history) and
      // average the confidence across the bucket.
      const last = samples[samples.length - 1];
      const avg = (key: keyof Pick<Sample, "hrConfidence" | "rrConfidence">) =>
        samples.reduce((acc, s) => acc + s[key], 0) / samples.length;
      chunk = {
        index: i,
        startMs: i * CHUNK_DURATION_MS,
        endMs: (i + 1) * CHUNK_DURATION_MS,
        hr: last.hr,
        rr: last.rr,
        hrConfidence: avg("hrConfidence"),
        rrConfidence: avg("rrConfidence"),
        faceDetected: samples.every((s) => s.faceDetected),
        sampleCount: samples.length,
        emittedAt: performance.now(),
      };
    }
    this.chunks[i] = chunk;
    for (const l of this.chunkListeners) l(chunk);
  }

  getChunks(): Array<ChunkResult | null> {
    return [...this.chunks];
  }

  /**
   * Final 60s aggregate. Two-pass filter on top of the per-event confidence
   * gate: (1) drop chunks where face was lost or HR-confidence < threshold;
   * (2) Hampel filter — reject HR values that sit more than HAMPEL_K * sigma
   * from the median, where sigma = 1.4826 * MAD. This catches motion-burst
   * or lighting-spike chunks that pass the SDK's own confidence but disagree
   * with the rest of the run.
   *
   * Reports per-vital insufficient_data: HR can succeed while RR fails the
   * RR-specific confidence gate independently.
   */
  aggregate(): AggregateResult {
    const valid = this.chunks.filter(
      (c): c is ChunkResult =>
        c !== null &&
        c.faceDetected &&
        c.hr !== null &&
        c.hrConfidence >= VALID_CONFIDENCE_THRESHOLD,
    );
    const total = this.chunks.filter((c) => c !== null).length;

    if (valid.length < MIN_VALID_CHUNKS_FOR_AGGREGATE) {
      return {
        kind: "insufficient_data",
        validChunks: valid.length,
        totalChunks: total,
        reason:
          valid.length === 0
            ? "No valid chunks — face not detected or confidence too low."
            : `Only ${valid.length} valid chunks (need ${MIN_VALID_CHUNKS_FOR_AGGREGATE}).`,
      };
    }

    // Hampel filter on HR. If it would leave us under the minimum, fall back
    // to the unfiltered valid pool — better an honest median over noisy data
    // than a misleading number from over-aggressive rejection.
    const hrPass = hampelFilter(valid.map((c) => c.hr as number), HAMPEL_K);
    const hrFiltered = valid.filter((_, i) => hrPass[i]);
    const hampelRejected = valid.length - hrFiltered.length;
    const hrPool =
      hrFiltered.length >= MIN_VALID_CHUNKS_FOR_AGGREGATE ? hrFiltered : valid;

    const hr = aggregateVital(hrPool, (c) => c.hr as number, (c) => c.hrConfidence);

    // RR has its own confidence gate independent of HR — a noisy respiration
    // signal shouldn't drop a chunk's HR vote, and vice versa.
    const rrPool = valid.filter(
      (c) => c.rr !== null && c.rrConfidence >= VALID_CONFIDENCE_THRESHOLD,
    );
    const rr: VitalAggregate =
      rrPool.length < MIN_VALID_CHUNKS_FOR_AGGREGATE
        ? {
            kind: "insufficient_data",
            reason:
              rrPool.length === 0
                ? "No chunks passed the RR confidence threshold."
                : `Only ${rrPool.length} chunks had RR confidence ≥ ${VALID_CONFIDENCE_THRESHOLD}.`,
          }
        : aggregateVital(rrPool, (c) => c.rr as number, (c) => c.rrConfidence);

    return {
      kind: "ok",
      hr,
      rr,
      validChunks: valid.length,
      totalChunks: total,
      hampelRejected: hrFiltered.length >= MIN_VALID_CHUNKS_FOR_AGGREGATE ? hampelRejected : 0,
    };
  }
}

/**
 * Confidence-weighted median plus a half-IQR uncertainty band over the
 * (unweighted) values. IQR/2 is the standard half-width of a 50% interval
 * — robust to the same outliers the median is robust to.
 */
function aggregateVital(
  chunks: ChunkResult[],
  getVal: (c: ChunkResult) => number,
  getWeight: (c: ChunkResult) => number,
): VitalAggregate {
  const value = weightedMedian(
    chunks.map((c) => ({ value: getVal(c), weight: getWeight(c) })),
  );
  const sorted = chunks.map(getVal).sort((a, b) => a - b);
  const q1 = quantile(sorted, 0.25);
  const q3 = quantile(sorted, 0.75);
  const uncertainty = (q3 - q1) / 2;
  return { kind: "ok", value, uncertainty, sampleCount: chunks.length };
}

function quantile(sorted: number[], q: number): number {
  if (sorted.length === 0) return NaN;
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  if (sorted[base + 1] !== undefined) {
    return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
  }
  return sorted[base];
}

/**
 * Hampel filter: returns a boolean per input value, true = keep.
 * Reject values more than k * sigma from the median, sigma = 1.4826 * MAD.
 * No-op for n < 4 (not enough data to estimate spread reliably).
 */
function hampelFilter(values: number[], k: number): boolean[] {
  if (values.length < 4) return values.map(() => true);
  const sorted = [...values].sort((a, b) => a - b);
  const median = quantile(sorted, 0.5);
  const deviations = values.map((v) => Math.abs(v - median));
  const sortedDev = [...deviations].sort((a, b) => a - b);
  const mad = quantile(sortedDev, 0.5);
  if (mad === 0) return values.map(() => true);
  const sigma = 1.4826 * mad;
  return values.map((v) => Math.abs(v - median) <= k * sigma);
}

/**
 * Confidence-weighted median: sort by value, walk cumulative weight until we
 * cross 50% of the total weight. Falls back to plain median if all weights
 * are zero, and to NaN if the input is empty.
 */
export function weightedMedian(samples: Array<{ value: number; weight: number }>): number {
  if (samples.length === 0) return NaN;
  const sorted = [...samples].sort((a, b) => a.value - b.value);
  const totalWeight = sorted.reduce((acc, s) => acc + s.weight, 0);
  if (totalWeight <= 0) {
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid].value : (sorted[mid - 1].value + sorted[mid].value) / 2;
  }
  const half = totalWeight / 2;
  let acc = 0;
  for (const s of sorted) {
    acc += s.weight;
    if (acc >= half) return s.value;
  }
  return sorted[sorted.length - 1].value;
}
