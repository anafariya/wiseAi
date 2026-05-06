import type { Metrics } from "@/lib/rppg/types";

function ms(n: number | null) {
  return n === null ? "—" : `${Math.round(n)} ms`;
}

export function MetricsPanel({ metrics }: { metrics: Metrics }) {
  const latencies = metrics.perChunkLatencyMs.filter((l): l is number => l !== null);
  const avgLatency =
    latencies.length === 0
      ? null
      : Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length);
  const maxLatency = latencies.length === 0 ? null : Math.round(Math.max(...latencies));

  return (
    <div className="panel p-5">
      <h2 className="text-sm uppercase tracking-wider text-muted mb-3">Performance metrics</h2>
      <table className="w-full text-sm">
        <tbody className="divide-y divide-border">
          <Row label="SDK init" value={ms(metrics.sdkInitMs)} />
          <Row label="Time to first estimate" value={ms(metrics.timeToFirstEstimateMs)} />
          <Row label="Avg chunk end-to-end latency" value={ms(avgLatency)} />
          <Row label="Max chunk latency" value={ms(maxLatency)} />
          <Row
            label="Sustained FPS (SDK reported)"
            value={metrics.sustainedFps === null ? "—" : metrics.sustainedFps.toFixed(1)}
          />
          <Row label="Total runtime" value={ms(metrics.totalRuntimeMs)} />
          <Row label="Valid chunks" value={`${metrics.validChunks}`} />
          <Row label="Flagged chunks" value={`${metrics.flaggedChunks}`} />
        </tbody>
      </table>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <tr>
      <td className="py-2 text-muted">{label}</td>
      <td className="py-2 font-mono text-right">{value}</td>
    </tr>
  );
}
