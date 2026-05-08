"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChunkAggregator } from "@/lib/rppg/ChunkAggregator";
import { MetricsCollector } from "@/lib/rppg/MetricsCollector";
import { RppgSession, type RppgEvent } from "@/lib/rppg/RppgSession";
import {
  CHUNK_DURATION_MS,
  TOTAL_CHUNKS,
  TOTAL_DURATION_MS,
  type AggregateResult,
  type ChunkResult,
  type Metrics,
  type WiseAIMethod,
} from "@/lib/rppg/types";
import { PreflightChecker } from "@/lib/preflight/PreflightChecker";
import { emptyPreflightStatus, type PreflightStatus } from "@/lib/preflight/types";
import { ChunkHistoryChart } from "./ChunkHistoryChart";
import { CurrentChunkPanel } from "./CurrentChunkPanel";
import { FinalAggregatePanel } from "./FinalAggregatePanel";
import { HrvPanel, emptyHrv, type HrvSnapshot } from "./HrvPanel";
import { MetricsPanel } from "./MetricsPanel";
import { PreflightPanel } from "./PreflightPanel";
import { StatusBanner } from "./StatusBanner";

type Mode = "idle" | "preflighting" | "running" | "stopping" | "done" | "error";
type InputMode = "webcam" | "file";

export default function Dashboard() {
  const [mode, setMode] = useState<Mode>("idle");
  const [inputMode, setInputMode] = useState<InputMode>("webcam");
  const [method, setMethod] = useState<WiseAIMethod>("wiseai");
  const [chunks, setChunks] = useState<Array<ChunkResult | null>>(
    () => Array.from({ length: TOTAL_CHUNKS }, () => null),
  );
  const [aggregate, setAggregate] = useState<AggregateResult | null>(null);
  const [metrics, setMetrics] = useState<Metrics>(() => emptyMetrics());
  const [elapsed, setElapsed] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [warnMsg, setWarnMsg] = useState<string | null>(null);
  const [faceDetected, setFaceDetected] = useState(true);
  const [preflight, setPreflight] = useState<PreflightStatus>(emptyPreflightStatus());
  const [preflightLoaded, setPreflightLoaded] = useState(false);
  const [noGlasses, setNoGlasses] = useState(false);
  const [hrv, setHrv] = useState<HrvSnapshot>(emptyHrv);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const sessionRef = useRef<RppgSession | null>(null);
  const aggRef = useRef<ChunkAggregator | null>(null);
  const metricsRef = useRef<MetricsCollector | null>(null);
  const tickRef = useRef<number | null>(null);
  const stopTimerRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const preflightRef = useRef<PreflightChecker | null>(null);

  const currentChunkIndex = Math.min(
    TOTAL_CHUNKS - 1,
    Math.max(0, Math.floor(elapsed / CHUNK_DURATION_MS)),
  );
  // The bucket at currentChunkIndex is in-progress and only finalizes when the
  // next bucket starts receiving samples. Showing chunks[currentChunkIndex]
  // would render "—" and "confidence 0%" the entire run, so we surface the
  // most recent *finalized* chunk and label its index in the panel.
  const latestFinalizedIndex = (() => {
    for (let i = currentChunkIndex; i >= 0; i--) {
      if (chunks[i]) return i;
    }
    return -1;
  })();
  const currentChunk =
    latestFinalizedIndex >= 0 ? (chunks[latestFinalizedIndex] ?? null) : null;
  const displayChunkIndex =
    latestFinalizedIndex >= 0 ? latestFinalizedIndex : currentChunkIndex;

  const stopPreflightChecker = useCallback(() => {
    preflightRef.current?.stop();
    preflightRef.current = null;
    setPreflight(emptyPreflightStatus());
    setPreflightLoaded(false);
  }, []);

  const cleanup = useCallback(async () => {
    if (tickRef.current) {
      cancelAnimationFrame(tickRef.current);
      tickRef.current = null;
    }
    if (stopTimerRef.current) {
      clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
    }
    stopPreflightChecker();
    if (streamRef.current) {
      for (const t of streamRef.current.getTracks()) t.stop();
      streamRef.current = null;
    }
    if (sessionRef.current) {
      try {
        await sessionRef.current.close();
      } catch {
        // best-effort
      }
      sessionRef.current = null;
    }
  }, [stopPreflightChecker]);

  const finishRun = useCallback(() => {
    aggRef.current?.finalizeAll();
    metricsRef.current?.endSession();
    if (aggRef.current) {
      setChunks(aggRef.current.getChunks());
      setAggregate(aggRef.current.aggregate());
    }
    if (metricsRef.current) setMetrics(metricsRef.current.snapshot());
    setMode("done");
    void cleanup();
  }, [cleanup]);

  const handleEvent = useCallback(
    (e: RppgEvent) => {
      const agg = aggRef.current;
      const m = metricsRef.current;
      if (!agg || !m) return;

      if (e.type === "vitals") {
        m.recordVitalsEvent(e.tMs, e.result);
        agg.ingest(e.tMs, e.result);
        setChunks(agg.getChunks());
        const sdnn = e.result.vitals.hrv_sdnn;
        const rmssd = e.result.vitals.hrv_rmssd;
        if (sdnn?.value !== undefined || rmssd?.value !== undefined) {
          setHrv({
            sdnnMs: sdnn?.value ?? null,
            sdnnConfidence: sdnn?.confidence ?? 0,
            rmssdMs: rmssd?.value ?? null,
            rmssdConfidence: rmssd?.confidence ?? 0,
          });
        }
      } else if (e.type === "faceDetected") {
        agg.setFaceDetected(e.faceDetected);
        setFaceDetected(e.faceDetected);
      } else if (e.type === "fileProgress") {
        setWarnMsg(e.message);
      } else if (e.type === "streamReset") {
        setWarnMsg(`Stream reset: ${e.message}`);
      } else if (e.type === "error") {
        setErrorMsg(e.message);
        if (e.fatal) {
          setMode("error");
          void cleanup();
        }
      }
    },
    [cleanup],
  );

  const enableCamera = useCallback(async () => {
    setErrorMsg(null);
    setWarnMsg(null);
    setAggregate(null);
    setChunks(Array.from({ length: TOTAL_CHUNKS }, () => null));
    setMetrics(emptyMetrics());
    setHrv(emptyHrv());
    setElapsed(0);
    setPreflight(emptyPreflightStatus());
    setPreflightLoaded(false);
    setMode("preflighting");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: "user", width: 640, height: 480 },
      });
      streamRef.current = stream;
      const videoEl = videoRef.current;
      if (!videoEl) throw new Error("Video element not mounted");
      videoEl.srcObject = stream;
      await videoEl.play().catch(() => {});

      const checker = new PreflightChecker(videoEl);
      preflightRef.current = checker;
      checker.onUpdate(setPreflight);
      await checker.start();
      setPreflightLoaded(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to enable camera";
      setErrorMsg(msg);
      setMode("error");
      await cleanup();
    }
  }, [cleanup]);

  const cancelPreflight = useCallback(async () => {
    await cleanup();
    setMode("idle");
  }, [cleanup]);

  const startScanWebcam = useCallback(async () => {
    const stream = streamRef.current;
    const videoEl = videoRef.current;
    if (!stream || !videoEl) {
      setErrorMsg("Camera not active — enable camera first.");
      return;
    }
    // Tear down preflight before handing the stream to the SDK so MediaPipe
    // and the Wise AI SDK don't both pump frames concurrently.
    stopPreflightChecker();

    setErrorMsg(null);
    setWarnMsg(null);
    setMode("running");

    const agg = new ChunkAggregator();
    const collector = new MetricsCollector();
    aggRef.current = agg;
    metricsRef.current = collector;

    agg.onChunk((c) => {
      collector.recordChunkFinalized(c);
      setMetrics(collector.snapshot());
    });

    const session = new RppgSession({
      method,
      ...(method === "wiseai"
        ? { proxyUrl: `${window.location.origin}/api/wiseai-proxy` }
        : {}),
      waveformMode: "incremental",
    });
    sessionRef.current = session;
    session.on(handleEvent);

    try {
      const initMs = await session.init();
      collector.recordSdkInit(initMs);
      collector.startSession();
      await session.startStream(stream, videoEl);

      stopTimerRef.current = window.setTimeout(() => {
        session.stopStream();
        finishRun();
      }, TOTAL_DURATION_MS);

      const tick = () => {
        setElapsed(collector.elapsedMs());
        if (mode === "stopping" || collector.isComplete()) return;
        tickRef.current = requestAnimationFrame(tick);
      };
      tickRef.current = requestAnimationFrame(tick);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to start";
      setErrorMsg(msg);
      setMode("error");
      await cleanup();
    }
  }, [cleanup, finishRun, handleEvent, method, mode, stopPreflightChecker]);

  const startFile = useCallback(
    async (file: File) => {
      setErrorMsg(null);
      setWarnMsg(null);
      setAggregate(null);
      setChunks(Array.from({ length: TOTAL_CHUNKS }, () => null));
      setMetrics(emptyMetrics());
      setHrv(emptyHrv());
      setElapsed(0);
      setMode("running");

      const agg = new ChunkAggregator();
      const collector = new MetricsCollector();
      aggRef.current = agg;
      metricsRef.current = collector;

      agg.onChunk((c) => {
        collector.recordChunkFinalized(c);
        setMetrics(collector.snapshot());
      });

      const session = new RppgSession({
        method,
        ...(method === "wiseai"
          ? { proxyUrl: `${window.location.origin}/api/wiseai-proxy` }
          : {}),
        waveformMode: "incremental",
      });
      sessionRef.current = session;
      session.on(handleEvent);

      try {
        const initMs = await session.init();
        collector.recordSdkInit(initMs);
        const videoEl = videoRef.current;
        if (videoEl) {
          videoEl.srcObject = null;
          videoEl.src = URL.createObjectURL(file);
          videoEl.muted = true;
          videoEl.play().catch(() => {});
        }
        collector.startSession();
        const tick = () => {
          setElapsed(Math.min(TOTAL_DURATION_MS, collector.elapsedMs()));
          if (mode === "stopping") return;
          tickRef.current = requestAnimationFrame(tick);
        };
        tickRef.current = requestAnimationFrame(tick);

        const result = await session.processFile(file);
        if (agg.getChunks().every((c) => c === null)) {
          agg.ingest(0, result);
        }
        finishRun();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "File processing failed";
        setErrorMsg(msg);
        setMode("error");
        await cleanup();
      }
    },
    [cleanup, finishRun, handleEvent, method, mode],
  );

  const stop = useCallback(() => {
    setMode("stopping");
    sessionRef.current?.stopStream();
    finishRun();
  }, [finishRun]);

  const handleInputModeChange = useCallback(
    async (next: InputMode) => {
      if (mode === "preflighting") {
        await cleanup();
        setMode("idle");
      }
      setInputMode(next);
    },
    [cleanup, mode],
  );

  useEffect(() => {
    return () => {
      void cleanup();
    };
  }, [cleanup]);

  // Pre-warm the Vercel serverless route so the first real /vitals request
  // doesn't pay the ~300 ms cold-start init. Fire-and-forget.
  useEffect(() => {
    fetch("/api/wiseai-proxy/__warmup", { method: "GET", keepalive: true }).catch(
      () => {},
    );
  }, []);

  const remaining = Math.max(0, TOTAL_DURATION_MS - elapsed);
  const startDisabled = !preflight.ready;
  const togglesDisabled = mode === "running" || mode === "stopping";

  return (
    <div className="max-w-5xl mx-auto px-5 py-8 space-y-6">
      <header className="flex items-baseline justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Wise AI rPPG Prototype</h1>
          <p className="text-sm text-muted">
            60-second face video → 5-second chunks → real-time HR / RR + final aggregate
          </p>
        </div>
        <span className="text-xs text-muted font-mono">v0.1</span>
      </header>

      <div className="panel p-5 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <ToggleGroup
            label="Input"
            value={inputMode}
            onChange={(v) => void handleInputModeChange(v)}
            options={[
              { v: "webcam", l: "Webcam" },
              { v: "file", l: "Upload file" },
            ]}
            disabled={togglesDisabled}
          />
          <ToggleGroup
            label="Method"
            value={method}
            onChange={setMethod}
            options={[
              { v: "wiseai", l: "wiseai (cloud)" },
              { v: "pos", l: "pos (local)" },
              { v: "chrom", l: "chrom (local)" },
              { v: "g", l: "g (local)" },
            ]}
            disabled={togglesDisabled}
          />

          <div className="ml-auto flex gap-2">
            {inputMode === "webcam" ? (
              mode === "running" || mode === "stopping" ? (
                <button
                  onClick={stop}
                  className="px-4 py-2 rounded-md bg-bad/20 hover:bg-bad/30 text-bad text-sm font-medium"
                >
                  Stop
                </button>
              ) : mode === "preflighting" ? (
                <>
                  <button
                    onClick={() => void cancelPreflight()}
                    className="px-4 py-2 rounded-md bg-border hover:bg-border/80 text-gray-200 text-sm font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => void startScanWebcam()}
                    disabled={startDisabled}
                    title={
                      startDisabled
                        ? "Pass the pre-capture checks before starting"
                        : "Start 60s capture"
                    }
                    className="px-4 py-2 rounded-md bg-accent text-black text-sm font-medium hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Start 60s capture
                  </button>
                </>
              ) : (
                <button
                  onClick={() => void enableCamera()}
                  className="px-4 py-2 rounded-md bg-accent text-black text-sm font-medium hover:opacity-90"
                >
                  {mode === "done" ? "New capture" : "Enable camera"}
                </button>
              )
            ) : (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void startFile(f);
                  }}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={mode === "running" || mode === "stopping"}
                  className="px-4 py-2 rounded-md bg-accent text-black text-sm font-medium hover:opacity-90 disabled:opacity-40"
                >
                  Upload video
                </button>
              </>
            )}
          </div>
        </div>

        {(mode === "running" || mode === "done") && (
          <div>
            <div className="flex justify-between text-xs text-muted mb-1">
              <span>{Math.round(elapsed / 1000)}s / 60s</span>
              <span>{Math.round(remaining / 1000)}s remaining</span>
            </div>
            <div className="flex gap-0.5">
              {Array.from({ length: TOTAL_CHUNKS }, (_, i) => {
                const segStart = i * CHUNK_DURATION_MS;
                const segEnd = segStart + CHUNK_DURATION_MS;
                const segPct =
                  elapsed <= segStart
                    ? 0
                    : elapsed >= segEnd
                      ? 100
                      : ((elapsed - segStart) / CHUNK_DURATION_MS) * 100;
                return (
                  <div
                    key={i}
                    className="flex-1 h-2 bg-border rounded-sm overflow-hidden"
                  >
                    <div
                      className="h-full bg-accent transition-all duration-100"
                      style={{ width: `${segPct}%` }}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {errorMsg && <StatusBanner tone="error">{errorMsg}</StatusBanner>}
        {warnMsg && !errorMsg && <StatusBanner tone="warn">{warnMsg}</StatusBanner>}
        {mode === "running" && !faceDetected && (
          <StatusBanner tone="warn">
            No face detected — adjust position. The current chunk will be flagged.
          </StatusBanner>
        )}
        {mode === "preflighting" && preflight.ready && !noGlasses && (
          <StatusBanner tone="warn">
            Heads up: glasses can degrade rPPG accuracy via specular reflection.
            Confirm the box below if you&apos;re not wearing them.
          </StatusBanner>
        )}
        {mode === "done" && !errorMsg && (
          <StatusBanner tone="success">Run complete.</StatusBanner>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-6">
          {mode === "preflighting" && inputMode === "webcam" && (
            <PreflightPanel
              status={preflight}
              loaded={preflightLoaded}
              noGlasses={noGlasses}
              onNoGlassesChange={setNoGlasses}
            />
          )}
          <div className="panel p-2">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className={`w-full rounded-lg bg-black aspect-video object-cover ${
                inputMode === "webcam" ? "-scale-x-100" : ""
              }`}
            />
          </div>
          <CurrentChunkPanel
            current={currentChunk}
            chunkIndex={displayChunkIndex}
            totalChunks={TOTAL_CHUNKS}
          />
          <ChunkHistoryChart chunks={chunks} />
        </div>
        <div className="space-y-6">
          <FinalAggregatePanel aggregate={aggregate} />
          <HrvPanel hrv={hrv} />
          <MetricsPanel metrics={metrics} />
          <div className="panel p-5 text-xs text-muted leading-relaxed space-y-2">
            <div className="font-medium text-gray-300">How aggregation works</div>
            <p>
              Each 5s chunk records the most recent SDK vitals event in that window plus the
              average confidence over that window. A chunk is &ldquo;valid&rdquo; if the face was
              detected throughout and HR confidence ≥ 0.5. The 60-second aggregate is the
              confidence-weighted median over valid chunks; if fewer than 3 chunks pass, the
              prototype reports &ldquo;insufficient data&rdquo; rather than a fabricated number.
            </p>
            <p>
              Cloud method (<code className="font-mono text-accent">wiseai</code>) is most
              accurate. Local methods (<code className="font-mono">pos</code> /{" "}
              <code className="font-mono">chrom</code> / <code className="font-mono">g</code>)
              run fully in the browser without API quota.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ToggleGroup<T extends string>({
  label,
  value,
  onChange,
  options,
  disabled,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: Array<{ v: T; l: string }>;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="uppercase tracking-wider text-muted">{label}</span>
      <div className="flex bg-border rounded-md p-0.5">
        {options.map((o) => (
          <button
            key={o.v}
            onClick={() => onChange(o.v)}
            disabled={disabled}
            className={`px-3 py-1 rounded text-xs ${
              value === o.v ? "bg-bg text-gray-100" : "text-muted hover:text-gray-300"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {o.l}
          </button>
        ))}
      </div>
    </div>
  );
}

function emptyMetrics(): Metrics {
  return {
    sdkInitMs: null,
    timeToFirstEstimateMs: null,
    perChunkLatencyMs: Array.from({ length: TOTAL_CHUNKS }, () => null),
    sustainedFps: null,
    totalRuntimeMs: null,
    validChunks: 0,
    flaggedChunks: 0,
  };
}
