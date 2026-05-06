import type { AggregateResult } from "@/lib/rppg/types";

export function FinalAggregatePanel({ aggregate }: { aggregate: AggregateResult | null }) {
  return (
    <div className="panel p-5">
      <h2 className="text-sm uppercase tracking-wider text-muted mb-3">
        Final 60-second aggregate
      </h2>
      {aggregate === null ? (
        <p className="text-sm text-muted">Waiting for the run to complete…</p>
      ) : aggregate.kind === "ok" ? (
        <div className="grid grid-cols-2 gap-6">
          <Stat label="Heart Rate" value={Math.round(aggregate.hr)} unit="bpm" />
          <Stat
            label="Respiratory Rate"
            value={Number.isFinite(aggregate.rr) ? Math.round(aggregate.rr) : null}
            unit="br/min"
          />
          <p className="col-span-2 text-xs text-muted">
            confidence-weighted median of {aggregate.validChunks}/{aggregate.totalChunks} valid
            chunks
          </p>
        </div>
      ) : (
        <div className="text-sm">
          <div className="text-bad font-medium mb-1">Insufficient data</div>
          <div className="text-muted">{aggregate.reason}</div>
          <div className="text-muted text-xs mt-2">
            {aggregate.validChunks}/{aggregate.totalChunks} chunks valid
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  unit,
}: {
  label: string;
  value: number | null;
  unit: string;
}) {
  return (
    <div>
      <div className="text-xs text-muted mb-1">{label}</div>
      <div className="flex items-baseline gap-2">
        <div className="text-4xl font-mono font-semibold">{value === null ? "—" : value}</div>
        <div className="text-sm text-muted">{unit}</div>
      </div>
    </div>
  );
}
