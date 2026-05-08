// Pre-capture quality gates — verify the user is close enough, looking
// straight, well-lit, and the camera is delivering enough fps before we
// hand the MediaStream to the Wise AI SDK. Mirrors the gating pattern
// from Aurae's faceScanJS FaceDistanceCalibrator.

export type GateValue = {
  value: number;
  pass: boolean;
};

export type PreflightStatus = {
  faceDetected: boolean;
  proximity: GateValue;        // composite face size, normalized
  orientation: GateValue;      // cheek-distance ratio, lower = more frontal
  lighting: GateValue;         // mean luminance of face region, 0..255
  fps: GateValue;              // sustained delivered FPS over 2s window
  ready: boolean;              // all four gates pass + face detected
};

// Initial thresholds — tuned for laptop webcams. Aurae's kiosk bounds for
// proximity were 0.03..0.12; laptops sit slightly higher because the user
// sits closer, so we widen the upper bound.
export const PREFLIGHT_THRESHOLDS = {
  proximityMin: 0.04,
  proximityMax: 0.20,
  orientationMax: 0.35,
  luminanceMin: 80,
  luminanceMax: 220,
  fpsMin: 24,
};

export function emptyPreflightStatus(): PreflightStatus {
  return {
    faceDetected: false,
    proximity: { value: 0, pass: false },
    orientation: { value: 0, pass: false },
    lighting: { value: 0, pass: false },
    fps: { value: 0, pass: false },
    ready: false,
  };
}
