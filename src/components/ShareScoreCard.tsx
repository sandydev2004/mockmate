"use client";

import { useState, useRef, useEffect } from "react";
import {
  Share2,
  Download,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  Smartphone,
} from "lucide-react";
import { trackEvent } from "@/lib/analytics";

interface ShareScoreCardProps {
  score: number;
  role: string;
  company: string;
  round: string;
  difficulty: string;
  date: string;
  categoryScores: {
    name: string;
    score: number;
    max: number;
  }[];
}

export function ShareScoreCard({
  score,
  role,
  company,
  round,
  difficulty,
  date,
  categoryScores,
}: ShareScoreCardProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);

  useEffect(() => {
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      setCanNativeShare(true);
    }
    renderCardImage();
  }, [score, role, company, round]);

  const renderCardImage = () => {
    setGenerating(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Canvas resolution: 1200 x 630 (optimal for LinkedIn / WhatsApp previews)
    canvas.width = 1200;
    canvas.height = 630;

    // 1. Background gradient (deep slate-950 with modern indigo/purple glow)
    const bgGradient = ctx.createLinearGradient(0, 0, 1200, 630);
    bgGradient.addColorStop(0, "#030712");
    bgGradient.addColorStop(0.5, "#0b0f19");
    bgGradient.addColorStop(1, "#111827");
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, 1200, 630);

    // Subtle background mesh glow circles
    const radGlow = ctx.createRadialGradient(1050, 120, 20, 1050, 120, 400);
    radGlow.addColorStop(0, "rgba(99, 102, 241, 0.25)");
    radGlow.addColorStop(1, "rgba(99, 102, 241, 0)");
    ctx.fillStyle = radGlow;
    ctx.fillRect(0, 0, 1200, 630);

    const radGlow2 = ctx.createRadialGradient(150, 520, 20, 150, 520, 350);
    radGlow2.addColorStop(0, "rgba(168, 85, 247, 0.2)");
    radGlow2.addColorStop(1, "rgba(168, 85, 247, 0)");
    ctx.fillStyle = radGlow2;
    ctx.fillRect(0, 0, 1200, 630);

    // Decorative Card Border
    ctx.strokeStyle = "rgba(99, 102, 241, 0.35)";
    ctx.lineWidth = 3;
    ctx.strokeRect(30, 30, 1140, 570);

    // 2. Brand Header
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 34px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillText("MockMate", 70, 90);

    ctx.fillStyle = "#818cf8";
    ctx.font = "600 20px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillText("AI CAMPUS PLACEMENT READINESS SCORECARD", 245, 87);

    // Horizontal divider
    ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(70, 120);
    ctx.lineTo(1130, 120);
    ctx.stroke();

    // 3. Candidate & Interview Context
    ctx.fillStyle = "#9ca3af";
    ctx.font = "500 18px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillText("TARGET PROFILE", 70, 165);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 32px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    const companyLabel = company.toUpperCase();
    const roundLabel = round.replace("_", " ").toUpperCase();
    ctx.fillText(`${role} • ${companyLabel}`, 70, 205);

    ctx.fillStyle = "#a5b4fc";
    ctx.font = "600 18px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillText(`Round: ${roundLabel}  |  Difficulty: ${difficulty.toUpperCase()}`, 70, 235);

    // 4. Large Score Hero Block (Left Column)
    const scoreBg = ctx.createLinearGradient(70, 275, 420, 520);
    scoreBg.addColorStop(0, "rgba(79, 70, 229, 0.25)");
    scoreBg.addColorStop(1, "rgba(30, 27, 75, 0.5)");
    ctx.fillStyle = scoreBg;
    ctx.fillRect(70, 270, 360, 240);
    ctx.strokeStyle = "rgba(129, 140, 248, 0.4)";
    ctx.lineWidth = 2;
    ctx.strokeRect(70, 270, 360, 240);

    ctx.fillStyle = "#c7d2fe";
    ctx.font = "bold 18px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillText("COMPOSITE PLACEMENT SCORE", 100, 315);

    ctx.fillStyle = score >= 80 ? "#34d399" : score >= 60 ? "#fbbf24" : "#f87171";
    ctx.font = "bold 90px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillText(`${score}`, 100, 410);

    ctx.fillStyle = "#9ca3af";
    ctx.font = "bold 34px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillText("/ 100", 225, 395);

    const verdictText =
      score >= 80
        ? "Day-1 Shortlist Ready 🚀"
        : score >= 60
        ? "Competitive Candidate 🎯"
        : "Needs Preparation 📚";
    ctx.fillStyle = "#ffffff";
    ctx.font = "600 20px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillText(verdictText, 100, 470);

    // 5. Skills Breakdown (Right Column)
    ctx.fillStyle = "#9ca3af";
    ctx.font = "500 18px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillText("CATEGORY PERFORMANCE BREAKDOWN", 490, 290);

    const startY = 325;
    const barSpacing = 48;
    const maxBarWidth = 460;

    categoryScores.forEach((cat, idx) => {
      const y = startY + idx * barSpacing;

      // Category Name
      ctx.fillStyle = "#f3f4f6";
      ctx.font = "600 16px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      ctx.fillText(cat.name, 490, y);

      // Score Text (e.g. 8/10)
      ctx.fillStyle = "#818cf8";
      ctx.font = "bold 16px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      ctx.fillText(`${cat.score}/${cat.max}`, 980, y);

      // Background Bar Track
      ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
      ctx.fillRect(490, y + 8, maxBarWidth + 40, 10);

      // Filled Score Bar
      const pct = Math.min(1, Math.max(0, cat.score / cat.max));
      const fillWidth = (maxBarWidth + 40) * pct;
      const barGrad = ctx.createLinearGradient(490, 0, 490 + fillWidth, 0);
      barGrad.addColorStop(0, "#6366f1");
      barGrad.addColorStop(1, "#a855f7");
      ctx.fillStyle = barGrad;
      ctx.fillRect(490, y + 8, fillWidth, 10);
    });

    // 6. Footer Verified Watermark
    ctx.fillStyle = "#6b7280";
    ctx.font = "500 15px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillText("Verified on MockMate • AI Campus Interview Evaluator • mockmate-eight-phi.vercel.app", 70, 565);

    const dataUrl = canvas.toDataURL("image/png");
    setImageUrl(dataUrl);
    setGenerating(false);
  };

  const handleDownload = () => {
    if (!imageUrl) return;
    trackEvent("scorecard_downloaded", { score, role, company });
    const link = document.createElement("a");
    link.download = `mockmate-placement-score-${role.toLowerCase()}-${score}.png`;
    link.href = imageUrl;
    link.click();
  };

  const shareText = `🎯 Just completed an AI mock interview on MockMate!
Placement Readiness Score: ${score}/100 (${role} @ ${company})
Strengths & skill breakdown verified. Practice your campus placement rounds free:
https://mockmate-eight-phi.vercel.app`;

  const handleWhatsAppShare = () => {
    trackEvent("scorecard_shared_whatsapp", { score, role, company });
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(url, "_blank");
  };

  const handleLinkedInShare = () => {
    trackEvent("scorecard_shared_linkedin", { score, role, company });
    const appUrl = "https://mockmate-eight-phi.vercel.app";
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(appUrl)}`;
    window.open(url, "_blank");
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      trackEvent("scorecard_copied", { score });
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleNativeShare = async () => {
    if (!navigator.share) return;
    trackEvent("scorecard_native_share", { score, role, company });
    try {
      await navigator.share({
        title: `MockMate Score: ${score}/100 (${role})`,
        text: shareText,
        url: "https://mockmate-eight-phi.vercel.app",
      });
    } catch {
      // User dismissed share sheet
    }
  };

  return (
    <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950/40 border border-indigo-500/30 shadow-xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Share Your Achievement</span>
          </div>
          <h3 className="text-xl font-bold text-white">
            Shareable Placement Score Card
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Showcase your preparation score to friends, study groups, or on LinkedIn.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {canNativeShare && (
            <button
              onClick={handleNativeShare}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-sm"
              title="Share via device apps"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Share</span>
            </button>
          )}

          <button
            onClick={handleWhatsAppShare}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-sm"
            title="Share on WhatsApp"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>WhatsApp</span>
          </button>

          <button
            onClick={handleLinkedInShare}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition shadow-sm"
            title="Share on LinkedIn"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>LinkedIn</span>
          </button>

          <button
            onClick={handleDownload}
            disabled={!imageUrl}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white transition border border-slate-700 disabled:opacity-50"
            title="Download PNG Card"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
          </button>

          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition border border-slate-700"
            title="Copy Text to Clipboard"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "Copied!" : "Copy"}</span>
          </button>
        </div>
      </div>

      {/* Hidden high-res canvas for image generation */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Visual Preview of the Score Card */}
      {imageUrl && (
        <div className="relative rounded-xl overflow-hidden border border-slate-800 shadow-2xl bg-black">
          <img
            src={imageUrl}
            alt={`MockMate Scorecard: ${score}/100`}
            className="w-full h-auto object-cover max-h-[420px]"
          />
          <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-md px-3 py-1 rounded-lg text-[10px] text-slate-300 border border-white/10">
            Click Download to save HD PNG (1200x630)
          </div>
        </div>
      )}
    </div>
  );
}
