"use client";

import { PREFLIGHT_THRESHOLDS, type PreflightStatus } from "@/lib/preflight/types";

type Row = {
  label: string;
  current: string;
  target: string;
  pass: boolean;
  hint: string;
};

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      className="w-4 h-4 text-good"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="4 11 8 15 16 6" />
    </svg>
  );
}

function CrossIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      className="w-4 h-4 text-bad"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
    >
      <line x1="5" y1="5" x2="15" y2="15" />
      <line x1="15" y1="5" x2="5" y2="15" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      className="w-4 h-4 text-muted animate-spin"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="10" cy="10" r="7" strokeOpacity="0.25" />
      <path d="M10 3 a7 7 0 0 1 7 7" strokeLinecap="round" />
    </svg>
  );
}

export function PreflightPanel({
  status,
  loaded,
  noGlasses,
  onNoGlassesChange,
}: {
  status: PreflightStatus;
  loaded: boolean;
  noGlasses: boolean;
  onNoGlassesChange: (v: boolean) => void;
}) {
  if (!loaded) {
    return (
      <div className="panel p-4 text-sm text-muted flex items-center gap-2">
        <SpinnerIcon />
        Loading face detection…
      </div>
    );
  }

  const rows: Row[] = [
    {
      label: "Face proximity",
      current: status.faceDetected ? status.proximity.value.toFixed(3) : "—",
      target: `${PREFLIGHT_THRESHOLDS.proximityMin}–${PREFLIGHT_THRESHOLDS.proximityMax}`,
      pass: status.proximity.pass,
      hint: !status.faceDetected
        ? "No face detected — sit in front of the camera."
        : status.proximity.value < PREFLIGHT_THRESHOLDS.proximityMin
          ? "Move closer to the camera."
          : status.proximity.value > PREFLIGHT_THRESHOLDS.proximityMax
            ? "Move slightly back."
            : "Good distance.",
    },
    {
      label: "Looking straight",
      current: status.faceDetected ? status.orientation.value.toFixed(2) : "—",
      target: `≤ ${PREFLIGHT_THRESHOLDS.orientationMax}`,
      pass: status.orientation.pass,
      hint: !status.faceDetected
        ? "No face detected."
        : status.orientation.pass
          ? "Centered."
          : "Face the camera squarely — head turned.",
    },
    {
      label: "Lighting",
      current: status.faceDetected
        ? `${Math.round(status.lighting.value)}/255`
        : "—",
      target: `${PREFLIGHT_THRESHOLDS.luminanceMin}–${PREFLIGHT_THRESHOLDS.luminanceMax}`,
      pass: status.lighting.pass,
      hint: !status.faceDetected
        ? "No face detected."
        : status.lighting.value < PREFLIGHT_THRESHOLDS.luminanceMin
          ? "Too dark — move to a brighter spot or face a window."
          : status.lighting.value > PREFLIGHT_THRESHOLDS.luminanceMax
            ? "Overexposed — reduce backlight."
            : "Lit well.",
    },
    {
      label: "Camera FPS",
      current: `${status.fps.value.toFixed(0)} fps`,
      target: `≥ ${PREFLIGHT_THRESHOLDS.fpsMin}`,
      pass: status.fps.pass,
      hint: status.fps.pass
        ? "Sustained delivery."
        : "Low frame rate — close other tabs or apps using the camera.",
    },
  ];

  return (
    <div className="panel p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium text-gray-200">
          Pre-capture checklist
        </div>
        <span
          className={`text-xs font-medium ${status.ready ? "text-good" : "text-muted"}`}
        >
          {status.ready ? "Ready to capture" : "Adjust before starting"}
        </span>
      </div>
      <ul className="space-y-1.5">
        {rows.map((r) => (
          <li
            key={r.label}
            className="flex items-start gap-3 text-xs leading-snug"
          >
            <span className="mt-0.5 shrink-0">
              {r.pass ? <CheckIcon /> : <CrossIcon />}
            </span>
            <span className="flex-1">
              <span className="text-gray-200 font-medium">{r.label}</span>
              <span className="text-muted ml-2 font-mono">
                {r.current}{" "}
                <span className="opacity-60">(target {r.target})</span>
              </span>
              <div className="text-muted mt-0.5">{r.hint}</div>
            </span>
          </li>
        ))}
        <li className="flex items-start gap-3 text-xs leading-snug pt-1 border-t border-border">
          <label className="flex items-start gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={noGlasses}
              onChange={(e) => onNoGlassesChange(e.target.checked)}
              className="mt-0.5 accent-accent"
            />
            <span>
              <span className="text-gray-200 font-medium">
                I am not wearing glasses
              </span>
              <div className="text-muted mt-0.5">
                Specs reflect light into the rPPG signal. Manual confirmation —
                we don&apos;t auto-detect.
              </div>
            </span>
          </label>
        </li>
      </ul>
    </div>
  );
}
