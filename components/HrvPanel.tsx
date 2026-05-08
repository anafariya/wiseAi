// HRV (heart-rate variability) panel — SDNN and RMSSD as reported by the
// Wise AI SDK. These come straight off `WiseAIResult.vitals.hrv_sdnn /
// hrv_rmssd`; the SDK accumulates them internally over a growing window,
// so we just surface the latest value per run.
//
// Why we surface this: HRV is the standard autonomic-nervous-system /
// recovery / stress proxy in clinical and consumer wearables. Wise AI's
// SDK already computes it; not displaying it would be leaving signal on
// the table.

export type HrvSnapshot = {
  sdnnMs: number | null;
  sdnnConfidence: number;
  rmssdMs: number | null;
  rmssdConfidence: number;
};

export const emptyHrv = (): HrvSnapshot => ({
  sdnnMs: null,
  sdnnConfidence: 0,
  rmssdMs: null,
  rmssdConfidence: 0,
});

export function HrvPanel({ hrv }: { hrv: HrvSnapshot }) {
  const hasData = hrv.sdnnMs !== null || hrv.rmssdMs !== null;
  return (
    <div className="panel p-5">
      <h2 className="text-sm uppercase tracking-wider text-muted mb-3">
        Heart Rate Variability
      </h2>
      <div className="grid grid-cols-2 gap-6">
        <HrvStat
          label="SDNN"
          value={hrv.sdnnMs}
          confidence={hrv.sdnnConfidence}
          unit="ms"
          hint="overall HRV (long-window NN-interval std dev)"
        />
        <HrvStat
          label="RMSSD"
          value={hrv.rmssdMs}
          confidence={hrv.rmssdConfidence}
          unit="ms"
          hint="parasympathetic / vagal tone"
        />
      </div>
      <p className="text-xs text-muted mt-3 leading-snug">
        {hasData
          ? "HRV needs ~30 s of clean PPG to stabilize — the SDK reports it incrementally."
          : "Awaiting enough clean pulse data — usually 30 s or so."}
      </p>
    </div>
  );
}

function HrvStat({
  label,
  value,
  confidence,
  unit,
  hint,
}: {
  label: string;
  value: number | null;
  confidence: number;
  unit: string;
  hint: string;
}) {
  return (
    <div>
      <div className="text-xs text-muted mb-1">{label}</div>
      <div className="flex items-baseline gap-2">
        <div className="text-3xl font-mono font-semibold">
          {value === null ? "—" : value.toFixed(1)}
        </div>
        <div className="text-sm text-muted">{unit}</div>
      </div>
      {value !== null && confidence > 0 && (
        <div className="text-xs text-muted mt-1">
          confidence {Math.round(confidence * 100)}%
        </div>
      )}
      <div className="text-xs text-muted mt-0.5 leading-snug">{hint}</div>
    </div>
  );
}
