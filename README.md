# Wise AI rPPG Prototype

Near real-time vitals (HR + RR) from a 60-second face video, processed in 5-second chunks via the Wise AI Web SDK. Built as a hiring assignment.

> **Live demo:** _add your Vercel URL here after deploying_
> **Stack:** Next.js 14 (App Router) + TypeScript + Tailwind, Recharts, deployed on Vercel free tier.

---

## What this does

1. **Capture** — webcam (live) or video upload, 60 seconds.
2. **Process** — feeds frames to the Wise AI SDK in incremental waveform mode; the SDK emits `vitals` events as estimates stabilize.
3. **Bucket** — events are time-bucketed into 12 × 5-second chunks (`ChunkAggregator`). Each chunk reports the most recent HR / RR in its window plus the average confidence over the window.
4. **Aggregate** — final 60s number is the **confidence-weighted median** of valid chunks (face detected + HR confidence ≥ 0.5). If fewer than 3 chunks are valid, returns _insufficient data_ rather than fabricating a number.
5. **Surface** — live current chunk, history bar chart (greyed bars = flagged), final aggregate panel, perf metrics table.

The webcam path is gated by a **pre-capture quality checklist** (see below); file-upload is not (the file's already recorded).

---

## Pre-capture quality checklist (webcam path)

Capture-side problems can't be fixed by aggregation tricks. Before the Wise AI SDK starts processing, the dashboard runs a real-time checklist using **MediaPipe FaceMesh** (loaded from CDN — no npm dep). Click **Enable camera** to see it.

| Gate | Method | Threshold | Blocks Start? |
| --- | --- | --- | --- |
| Face proximity | `sqrt(eyeDist × faceHeight × faceWidth)` from landmarks 33/263/1/175/234/454 | 0.04 ≤ size ≤ 0.20 | yes |
| Looking straight | Cheek-symmetry ratio from landmarks 1/234/454 | ≤ 0.35 | yes |
| Lighting | Mean luminance over face bounding box, 0–255 | 80 ≤ value ≤ 220 | yes |
| Camera FPS | Rolling 2-second window via `requestVideoFrameCallback` | ≥ 24 fps | yes |
| Not wearing glasses | Manual checkbox — specs reflect light into the rPPG signal | n/a | no, advisory |

**Why glasses are manual.** A reliable specs detector needs a small CNN — overkill for a take-home and risky to trust (false positives are worse than no check). A user prompt + manual confirmation is more dignified than an unreliable auto-detector. The pattern (lift face metrics from MediaPipe FaceMesh, gate the capture flow) is borrowed from production rPPG kiosks.

The thresholds live in `lib/preflight/types.ts` — adjust if your camera or lighting environment differs.

---

## Quickstart

```bash
npm install
cp .env.example .env.local        # then paste your WISEAI_API_KEY
npm run dev                       # http://localhost:3000
```

The Wise AI SDK ships under `public/wiseai-sdk/` and is loaded by the browser at runtime — Next.js doesn't bundle it. The API key never leaves the server: `app/api/wiseai-proxy/[...path]/route.ts` forwards SDK requests to `https://api.rouast.com/vitallens-v3` and injects `WISEAI_API_KEY` from env.

---

## Project layout

```
app/
  page.tsx                            # Client-only entry → Dashboard
  layout.tsx, globals.css
  api/wiseai-proxy/[...path]/route.ts # Server proxy (key injection)
components/
  Dashboard.tsx                       # Owns SDK lifecycle + state
  CameraCapture (inline in Dashboard)
  CurrentChunkPanel.tsx
  ChunkHistoryChart.tsx               # Recharts bars, greyed when flagged
  FinalAggregatePanel.tsx
  MetricsPanel.tsx
  StatusBanner.tsx
  PreflightPanel.tsx                  # Pre-capture quality checklist UI
lib/rppg/
  RppgSession.ts                      # Adapter around `WiseAI`
  ChunkAggregator.ts                  # 5s buckets + weighted median
  MetricsCollector.ts                 # init, TTFE, latency, FPS, runtime
  types.ts                            # Constants + result/option types
lib/preflight/
  PreflightChecker.ts                 # MediaPipe FaceMesh wrapper + gate computations
  types.ts                            # PreflightStatus + thresholds
public/wiseai-sdk/                    # The SDK bundle (gitignored if you prefer)
```

---

## Sample output

(Replace this section with a real run after you record a 60s video.)

```
Chunk |  range  |  HR | conf |  RR | conf | face | flagged
   01 |  0– 5s  |  72 | 0.81 |  16 | 0.62 |  ✓   |
   02 |  5–10s  |  74 | 0.84 |  16 | 0.65 |  ✓   |
   03 | 10–15s  |  73 | 0.83 |  17 | 0.61 |  ✓   |
   ...
   12 | 55–60s  |  74 | 0.79 |  17 | 0.58 |  ✓   |

Final 60s aggregate (confidence-weighted median, 11/12 valid chunks):
  HR  =  73 bpm
  RR  =  16 br/min

Performance:
  SDK init                : 420 ms
  Time to first estimate  : 1280 ms
  Avg per-chunk latency   :  340 ms
  Sustained FPS (SDK)     :   30
  Total runtime           : 60.2 s
```

---

## Aggregation logic

- **Per-chunk:** SDK output as-is. The SDK already smooths internally.
- **Validity gate:** face detected throughout the chunk **and** HR confidence ≥ 0.5.
- **Final:** confidence-weighted median over valid chunks. RR aggregated separately so that low RR-confidence doesn't drop a chunk's HR vote.
- **Insufficient data:** fewer than 3 valid chunks of 12 → return a sentinel instead of a number. Median needs minimum sample size to mean anything.

**Considered alternatives.** Plain mean (sensitive to outliers), trimmed mean (better, but discards information arbitrarily), IQR-based outlier rejection (extra parameter, no clear win at this sample size). Median wins because rPPG noise is asymmetric (motion spikes drag means upward) and the breakdown point matters more than statistical efficiency at n=12.

---

## Failure handling

| Event from SDK | UI behavior |
| --- | --- |
| `faceDetected` returns null | "No face detected" banner; chunk flagged |
| chunk HR confidence < 0.5 | Bar greyed in history; excluded from final |
| `streamReset` | Warning banner; SDK auto-retries internally |
| `WiseAIAPIKeyError` | Hard error, retry button |
| `WiseAIAPIQuotaExceededError` | Suggest switching to local `pos` method (toggle in UI) |

The UI exposes a method toggle (`wiseai` cloud / `pos` / `chrom` / `g` local) so you can recover from quota exhaustion mid-demo without redeploying.

---

## Performance metrics captured

All measured with `performance.now()`:

- **SDK init time** — constructor → `setVideoStream` resolved.
- **Time to first estimate** — session start → first `vitals` event.
- **Per-chunk end-to-end latency** — chunk's nominal start → finalization timestamp.
- **Sustained FPS** — pulled from the SDK's `result.fps` field.
- **Total runtime** — full session wall clock.
- **Valid vs flagged chunk counts.**

---

## Notes on real-time deployment

- **API key is server-only.** `WISEAI_API_KEY` lives in Vercel env vars; the SDK's `proxyUrl` option points at our Next.js route. No `view-source` will leak the key.
- **Stream uploads are binary + gzipped.** The proxy passes them through with `arrayBuffer()` to avoid double-buffering.
- **Cold-start.** Vercel free-tier serverless cold-start adds ~300 ms to the first stream POST; this shows up in Time-to-First-Estimate. Pre-warm the route on page mount if it matters.
- **HTTPS is required for `getUserMedia`** — Vercel handles this automatically.
- **Quota recovery in-UI.** Local methods (`pos`/`chrom`/`g`) are a fallback if the cloud quota hits during a live demo.

---

## Disclaimer

The Wise AI SDK is for general wellness use only. This prototype is not a medical device.
