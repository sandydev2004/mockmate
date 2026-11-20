"use client";

import { useEffect, useRef, useState } from "react";
import { detectFacesInVideo, FaceState } from "@/lib/face-detector";
import { Camera, AlertTriangle, Eye, EyeOff } from "lucide-react";

interface CameraSelfViewProps {
  onStateChange: (state: FaceState, isLowLight: boolean) => void;
  onPermissionDenied?: (err: Error) => void;
  isCalibrating?: boolean;
  onCalibrationConfirmed?: () => void;
}

export function CameraSelfView({
  onStateChange,
  onPermissionDenied,
  isCalibrating = false,
  onCalibrationConfirmed,
}: CameraSelfViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [faceState, setFaceState] = useState<FaceState>("PRESENT");
  const [isLowLight, setIsLowLight] = useState(false);

  // Calibration: requires 1 face continuously for 2 seconds
  const [calibrationProgress, setCalibrationProgress] = useState(0); // 0 to 100%
  const calibrationStartRef = useRef<number | null>(null);
  const isConfirmedRef = useRef(false);

  // 1. Request camera stream
  useEffect(() => {
    let activeStream: MediaStream | null = null;

    async function initCamera() {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error("Camera API is not supported in this browser environment.");
        }

        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 320 },
            height: { ideal: 240 },
            facingMode: "user",
          },
          audio: false,
        });

        activeStream = mediaStream;
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err: any) {
        const errorMsg =
          err.name === "NotAllowedError" || err.name === "PermissionDeniedError"
            ? "Camera permission was denied. Camera access is required for Proctored Mode."
            : err.message || "Failed to initialize camera.";
        setPermissionError(errorMsg);
        onStateChange("CAMERA_BLOCKED", false);
        if (onPermissionDenied) {
          onPermissionDenied(err);
        }
      }
    }

    initCamera();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [onPermissionDenied, onStateChange]);

  // 2. Face detection loop (every 350ms, ~3 times per second)
  useEffect(() => {
    if (permissionError) return;

    const interval = setInterval(async () => {
      if (!videoRef.current) return;

      const result = await detectFacesInVideo(videoRef.current);
      setFaceState(result.state);
      setIsLowLight(result.isLowLight);
      onStateChange(result.state, result.isLowLight);

      // Startup calibration check
      if (isCalibrating && !isConfirmedRef.current) {
        if (result.state === "PRESENT" && result.faceCount === 1) {
          if (!calibrationStartRef.current) {
            calibrationStartRef.current = Date.now();
          }
          const duration = Date.now() - calibrationStartRef.current;
          const pct = Math.min(100, Math.round((duration / 2000) * 100));
          setCalibrationProgress(pct);

          if (duration >= 2000) {
            isConfirmedRef.current = true;
            if (onCalibrationConfirmed) {
              onCalibrationConfirmed();
            }
          }
        } else {
          // Reset calibration if face is lost
          calibrationStartRef.current = null;
          setCalibrationProgress(0);
        }
      }
    }, 350);

    return () => clearInterval(interval);
  }, [
    isCalibrating,
    permissionError,
    onStateChange,
    onCalibrationConfirmed,
  ]);

  if (permissionError) {
    return (
      <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5">
        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
        <p>{permissionError}</p>
      </div>
    );
  }

  // Calibration View (large center frame)
  if (isCalibrating) {
    return (
      <div className="space-y-4">
        <div className="relative w-full max-w-sm mx-auto aspect-video rounded-2xl overflow-hidden bg-slate-900 border-2 border-indigo-500/50 shadow-xl">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover -scale-x-100"
          />

          {/* Guide Overlay */}
          <div className="absolute inset-0 pointer-events-none border-2 border-dashed border-white/40 rounded-2xl m-4 flex items-center justify-center">
            {calibrationProgress >= 100 ? (
              <div className="px-3 py-1.5 rounded-full bg-emerald-500 text-white text-xs font-bold shadow-md animate-bounce">
                ✓ Face Calibrated!
              </div>
            ) : faceState === "PRESENT" ? (
              <div className="px-3 py-1.5 rounded-full bg-indigo-600/90 text-white text-xs font-semibold backdrop-blur-sm">
                Hold still: {Math.round((2000 - (calibrationProgress / 100) * 2000) / 1000)}s
              </div>
            ) : (
              <div className="px-3 py-1.5 rounded-full bg-amber-500/90 text-white text-xs font-semibold backdrop-blur-sm">
                Position your face in frame
              </div>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="max-w-sm mx-auto space-y-1">
          <div className="flex justify-between text-xs text-slate-500">
            <span>Presence Calibration</span>
            <span className="font-semibold">{calibrationProgress}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
            <div
              className="h-full bg-indigo-600 transition-all duration-300 rounded-full"
              style={{ width: `${calibrationProgress}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  // Interview Room Self-View Floating Preview (compact)
  return (
    <div className="relative group w-36 h-28 sm:w-44 sm:h-32 rounded-xl overflow-hidden bg-slate-950 border border-slate-700/80 shadow-2xl transition-all">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover -scale-x-100"
      />

      {/* Status indicator dot */}
      <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[10px] text-white">
        <span
          className={`w-2 h-2 rounded-full ${
            faceState === "PRESENT"
              ? "bg-emerald-500 animate-pulse"
              : faceState === "MULTIPLE"
              ? "bg-amber-400"
              : "bg-rose-500 animate-ping"
          }`}
        />
        <span className="font-medium text-[9px]">
          {faceState === "PRESENT"
            ? "In Frame"
            : faceState === "MULTIPLE"
            ? "Multiple"
            : "No Face"}
        </span>
      </div>

      {isLowLight && (
        <div className="absolute bottom-1 inset-x-1 px-1.5 py-0.5 rounded bg-amber-900/80 text-amber-200 text-[8px] text-center backdrop-blur-sm">
          Lighting low
        </div>
      )}
    </div>
  );
}

