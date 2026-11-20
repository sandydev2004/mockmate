"use client";

import React from "react";

interface WatermarkOverlayProps {
  email?: string | null;
  interviewId?: string | null;
}

export function WatermarkOverlay({ email, interviewId }: WatermarkOverlayProps) {
  const shortId = interviewId ? interviewId.slice(0, 8) : "SESSION";
  const displayEmail = email || "candidate@mockmate.ai";
  const watermarkText = `${displayEmail} • ID: ${shortId}`;

  // We render an SVG background pattern of repeating diagonal tiled text
  // The overlay is completely non-interactive (pointer-events-none, user-select-none)
  const svgPattern = `
    <svg xmlns='http://www.w3.org/2000/svg' width='360' height='220'>
      <text x='20' y='120' transform='rotate(-22 20 120)' 
        fill='currentColor' 
        font-family='monospace' 
        font-size='12' 
        font-weight='600' 
        letter-spacing='1'>
        ${watermarkText}
      </text>
    </svg>
  `.trim();

  const encodedSvg = `data:image/svg+xml;utf8,${encodeURIComponent(svgPattern)}`;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none select-none absolute inset-0 z-20 overflow-hidden opacity-[0.06] dark:opacity-[0.09] text-slate-800 dark:text-slate-100"
      style={{
        backgroundImage: `url("${encodedSvg}")`,
        backgroundRepeat: "repeat",
      }}
    />
  );
}

