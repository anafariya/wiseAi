import type { ChunkResult } from "@/lib/rppg/types";

function fmt(n: number | null) {
  return n === null || Number.isNaN(n) ? "—" : Math.round(n).toString();
}

function confidenceTone(c: number) {
  if (c >= 0.7) return "text-good";
  if (c >= 0.5) return "text-warn";
  return "text-bad";
}

export function CurrentChunkPanel({
  current,
  chunkIndex,
  totalChunks,
}: {
  current: ChunkResult | null;
  chunkIndex: number;
  totalChunks: number;
}) {
  return (
    <div className="panel p-5">
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="text-sm uppercase tracking-wider text-muted">Current 5-second chunk</h2>
        <span className="text-xs text-muted font-mono">
          {chunkIndex + 1}/{totalChunks}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div>
          <div className="text-xs text-muted mb-1">Heart Rate</div>
          <div className="flex items-baseline gap-2">
            <div className="text-4xl font-mono font-semibold">{fmt(current?.hr ?? null)}</div>
            <div className="text-sm text-muted">bpm</div>
          </div>
          {current && current.hrConfidence > 0 && (
            <div className={`text-xs mt-1 ${confidenceTone(current.hrConfidence)}`}>
              confidence {Math.round(current.hrConfidence * 100)}%
            </div>
          )}
        </div>
        <div>
          <div className="text-xs text-muted mb-1">Respiratory Rate</div>
          <div className="flex items-baseline gap-2">
            <div className="text-4xl font-mono font-semibold">{fmt(current?.rr ?? null)}</div>
            <div className="text-sm text-muted">br/min</div>
          </div>
          {current && current.rrConfidence > 0 && (
            <div className={`text-xs mt-1 ${confidenceTone(current.rrConfidence)}`}>
              confidence {Math.round(current.rrConfidence * 100)}%
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
