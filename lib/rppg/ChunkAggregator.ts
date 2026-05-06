// Bucket SDK 'vitals' events into 5-second windows and compute the final
// 60-second aggregate. Confidence-weighted median over valid chunks; chunks
// with confidence < 0.5 or no face are flagged and excluded.
//
// Why median (not mean)? rPPG outliers from motion/lighting are common and
// asymmetric, so the breakdown point matters more than efficiency.

import {
  CHUNK_DURATION_MS,
  TOTAL_CHUNKS,
  VALID_CONFIDENCE_THRESHOLD,
  MIN_VALID_CHUNKS_FOR_AGGREGATE,
  type AggregateResult,
  type ChunkResult,
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
   * Final 60s aggregate. Confidence-weighted median over valid chunks.
   * Returns insufficient_data if fewer than 3 chunks pass validity gating.
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

    return {
      kind: "ok",
      hr: weightedMedian(valid.map((c) => ({ value: c.hr!, weight: c.hrConfidence }))),
      rr: weightedMedian(
        valid
          .filter((c) => c.rr !== null && c.rrConfidence >= VALID_CONFIDENCE_THRESHOLD)
          .map((c) => ({ value: c.rr!, weight: c.rrConfidence })),
      ),
      validChunks: valid.length,
      totalChunks: total,
    };
  }
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
