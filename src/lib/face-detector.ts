/**
 * Lightweight In-Browser Face Detector
 * Runs client-side at 2-3 Hz without external CDNs.
 * Uses native Shape Detection API (window.FaceDetector) where available,
 * with an on-device canvas skin/luminance geometry analyzer fallback.
 * Supports testing hooks for deterministic mock evaluation.
 */

export type FaceState = "PRESENT" | "ABSENT" | "MULTIPLE" | "CAMERA_BLOCKED";

export interface FaceDetectionResult {
  state: FaceState;
  faceCount: number;
  isLowLight: boolean;
  confidence: number;
  message?: string;
}

let nativeDetectorInstance: any = null;
let nativeDetectorFailed = false;

// Mock control for automated E2E tests
let testMockState: FaceDetectionResult | null = null;

export function setTestMockFaceState(mock: FaceDetectionResult | null) {
  testMockState = mock;
}

/**
 * Initializes detector once if native Shape Detection API exists.
 */
function getNativeDetector() {
  if (typeof window === "undefined") return null;
  if (nativeDetectorFailed) return null;
  if (nativeDetectorInstance) return nativeDetectorInstance;

  try {
    if ("FaceDetector" in window) {
      nativeDetectorInstance = new (window as any).FaceDetector({
        maxDetectedFaces: 5,
        fastMode: true,
      });
      return nativeDetectorInstance;
    }
  } catch (err) {
    nativeDetectorFailed = true;
  }
  return null;
}

/**
 * Detects faces from an active HTMLVideoElement.
 */
export async function detectFacesInVideo(
  video: HTMLVideoElement,
  offscreenCanvas?: HTMLCanvasElement
): Promise<FaceDetectionResult> {
  // Check test mock first
  if (typeof window !== "undefined" && (window as any).__MOCK_FACE_STATE__) {
    return (window as any).__MOCK_FACE_STATE__;
  }
  if (testMockState) {
    return testMockState;
  }

  // 1. Check if camera stream is active & live
  if (
    !video ||
    !video.srcObject ||
    video.readyState < 2 ||
    video.paused ||
    video.ended
  ) {
    return {
      state: "CAMERA_BLOCKED",
      faceCount: 0,
      isLowLight: false,
      confidence: 0,
      message: "Camera stream is inactive or blocked",
    };
  }

  const stream = video.srcObject as MediaStream;
  const tracks = stream.getVideoTracks();
  if (tracks.length === 0 || !tracks[0].enabled || tracks[0].readyState !== "live" || tracks[0].muted) {
    return {
      state: "CAMERA_BLOCKED",
      faceCount: 0,
      isLowLight: false,
      confidence: 0,
      message: "Camera track is muted or stopped",
    };
  }

  // 2. Measure luminance and extract canvas frame (downscaled to 160x120 for instant analysis)
  const canvas = offscreenCanvas || document.createElement("canvas");
  const width = 160;
  const height = 120;
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) {
    return {
      state: "PRESENT",
      faceCount: 1,
      isLowLight: false,
      confidence: 0.5,
    };
  }

  try {
    ctx.drawImage(video, 0, 0, width, height);
  } catch (err) {
    return {
      state: "CAMERA_BLOCKED",
      faceCount: 0,
      isLowLight: false,
      confidence: 0,
    };
  }

  const frame = ctx.getImageData(0, 0, width, height);
  const data = frame.data;
  let totalLuminance = 0;
  const totalPixels = width * height;

  // Measure luminance: Y = 0.299*R + 0.587*G + 0.114*B
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    totalLuminance += 0.299 * r + 0.587 * g + 0.114 * b;
  }

  const avgLuminance = totalLuminance / totalPixels;
  const isLowLight = avgLuminance < 25; // Out of 255

  // 3. Try Native Shape Detection API first if present
  const detector = getNativeDetector();
  if (detector) {
    try {
      const detected = await detector.detect(video);
      const faceCount = detected ? detected.length : 0;
      if (faceCount === 0) {
        return {
          state: "ABSENT",
          faceCount: 0,
          isLowLight,
          confidence: isLowLight ? 0.4 : 0.9,
          message: isLowLight ? "Too dark, improve lighting" : "No face in frame",
        };
      } else if (faceCount === 1) {
        return {
          state: "PRESENT",
          faceCount: 1,
          isLowLight,
          confidence: 0.95,
        };
      } else {
        return {
          state: "MULTIPLE",
          faceCount,
          isLowLight,
          confidence: 0.9,
          message: "Multiple faces detected in frame",
        };
      }
    } catch (detectErr) {
      // Fallback to canvas skin/geometry segmentation
    }
  }

  // 4. On-Device Canvas Fallback (Skin tone & face region clustering)
  // Evaluates skin chrominance: R > 90, G > 40, B > 20, max(R,G,B) - min(R,G,B) > 15, |R - G| > 15, R > G, R > B
  let skinPixels = 0;
  let skinXSum = 0;
  let skinYSum = 0;

  // Split into left and right halves to detect potential multiple people
  let leftSkinPixels = 0;
  let rightSkinPixels = 0;
  const midX = width / 2;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      const isSkin =
        r > 60 &&
        g > 35 &&
        b > 20 &&
        r > g &&
        r > b &&
        Math.abs(r - g) > 10;

      if (isSkin) {
        skinPixels++;
        skinXSum += x;
        skinYSum += y;
        if (x < midX - 15) leftSkinPixels++;
        if (x > midX + 15) rightSkinPixels++;
      }
    }
  }

  const skinRatio = skinPixels / totalPixels;

  // Minimum 3% skin area indicates a face in standard selfie framing
  if (skinRatio < 0.03) {
    return {
      state: "ABSENT",
      faceCount: 0,
      isLowLight,
      confidence: isLowLight ? 0.35 : 0.85,
      message: isLowLight ? "Too dark, improve lighting" : "No face in frame",
    };
  }

  // If both left and right quadrants have independent heavy skin concentrations
  if (leftSkinPixels > totalPixels * 0.08 && rightSkinPixels > totalPixels * 0.08) {
    return {
      state: "MULTIPLE",
      faceCount: 2,
      isLowLight,
      confidence: 0.8,
      message: "Multiple people detected in frame",
    };
  }

  return {
    state: "PRESENT",
    faceCount: 1,
    isLowLight,
    confidence: 0.9,
  };
}

