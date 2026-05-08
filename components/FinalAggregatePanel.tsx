import type { AggregateResult, VitalAggregate } from "@/lib/rppg/types";

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
          <Stat label="Heart Rate" vital={aggregate.hr} unit="bpm" />
          <Stat label="Respiratory Rate" vital={aggregate.rr} unit="br/min" />
          <p className="col-span-2 text-xs text-muted">
            confidence-weighted median of {aggregate.validChunks}/{aggregate.totalChunks} valid
            chunks
            {aggregate.hampelRejected > 0
              ? `, ${aggregate.hampelRejected} excluded by MAD outlier filter`
              : ""}
            . Uncertainty is the half-IQR over the same pool.
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
  vital,
  unit,
}: {
  label: string;
  vital: VitalAggregate;
  unit: string;
}) {
  if (vital.kind === "insufficient_data") {
    return (
      <div>
        <div className="text-xs text-muted mb-1">{label}</div>
        <div className="flex items-baseline gap-2">
          <div className="text-4xl font-mono font-semibold text-muted">—</div>
          <div className="text-sm text-muted">{unit}</div>
        </div>
        <div className="text-xs text-warn mt-1">insufficient data</div>
      </div>
    );
  }
  const value = Math.round(vital.value);
  const uncertainty = vital.uncertainty.toFixed(1);
  return (
    <div>
      <div className="text-xs text-muted mb-1">{label}</div>
      <div className="flex items-baseline gap-2">
        <div className="text-4xl font-mono font-semibold">{value}</div>
        <div className="text-sm text-muted">{unit}</div>
      </div>
      <div className="text-xs text-muted mt-1 font-mono">
        ± {uncertainty} (50% IQR · n={vital.sampleCount})
      </div>
    </div>
  );
}
