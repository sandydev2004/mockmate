import { IntegrityEventRecord, InterviewRecord, FeedbackRecord } from "@/types";

export interface RiskWeights {
  strike: number;
  tab_switch: number;
  fullscreen_exit: number;
  camera_absence: number;
  multiple_faces: number;
  paste_blocked: number;
  paste_like: number;
  input_injection: number;
  typing_anomaly: number;
  shortcut_blocked: number;
  multiple_monitors: number;
  devtools_open: number;
  duplicate_session: number;
  suspicious_extension_ui: number;
  low_authenticity: number;
  fast_long_answer: number;
}

export const RISK_WEIGHTS: RiskWeights = {
  strike: 20,
  tab_switch: 8,
  fullscreen_exit: 12,
  camera_absence: 10,
  multiple_faces: 10,
  paste_blocked: 8,
  paste_like: 10,
  input_injection: 15,
  typing_anomaly: 12,
  shortcut_blocked: 5,
  multiple_monitors: 10,
  devtools_open: 15,
  duplicate_session: 25,
  suspicious_extension_ui: 10,
  low_authenticity: 20,
  fast_long_answer: 15,
};

export const RISK_THRESHOLDS = {
  medium: 30,
  high: 60,
};

export interface ComputedRiskResult {
  risk_score: number; // 0 - 100 clamped
  risk_level: "Low" | "Medium" | "High";
  top_reasons: string[];
}

export function computeServerRiskScore(
  events: IntegrityEventRecord[],
  interview?: InterviewRecord | null,
  feedback?: FeedbackRecord | null
): ComputedRiskResult {
  const signalPoints: { reason: string; points: number }[] = [];

  // 1. Strikes
  const strikes = interview?.strikes ?? events.filter((e) => e.event_type === "strike_added").length;
  if (strikes > 0) {
    const pts = strikes * RISK_WEIGHTS.strike;
    signalPoints.push({
      reason: `${strikes} official proctoring strike${strikes > 1 ? "s" : ""} recorded`,
      points: pts,
    });
  }

  // 2. Tab switches / away events
  const tabSwitches = events.filter(
    (e) => e.event_type === "tab_switch" || e.event_type === "tab_hidden" || e.event_type === "tab_returned"
  ).length;
  if (tabSwitches > 0) {
    const pts = Math.min(30, tabSwitches * RISK_WEIGHTS.tab_switch);
    signalPoints.push({
      reason: `${tabSwitches} window navigation / tab switch event${tabSwitches > 1 ? "s" : ""}`,
      points: pts,
    });
  }

  // 3. Fullscreen exits
  const fullscreenExits = events.filter((e) => e.event_type === "fullscreen_exit").length;
  if (fullscreenExits > 0) {
    const pts = Math.min(35, fullscreenExits * RISK_WEIGHTS.fullscreen_exit);
    signalPoints.push({
      reason: `${fullscreenExits} fullscreen departure${fullscreenExits > 1 ? "s" : ""}`,
      points: pts,
    });
  }

  // 4. Camera absences
  const cameraAbsences = events.filter(
    (e) => e.event_type === "camera_absent" || e.event_type === "camera_blocked"
  ).length;
  if (cameraAbsences > 0) {
    const pts = Math.min(30, cameraAbsences * RISK_WEIGHTS.camera_absence);
    signalPoints.push({
      reason: `${cameraAbsences} candidate face absence / camera blockage event${cameraAbsences > 1 ? "s" : ""}`,
      points: pts,
    });
  }

  // 5. Multiple faces
  const multiFaces = events.filter((e) => e.event_type === "multiple_faces").length;
  if (multiFaces > 0) {
    const pts = Math.min(25, multiFaces * RISK_WEIGHTS.multiple_faces);
    signalPoints.push({
      reason: `${multiFaces} detection${multiFaces > 1 ? "s" : ""} of multiple individuals in camera frame`,
      points: pts,
    });
  }

  // 6. Blocked shortcuts
  const shortcuts = events.filter((e) => e.event_type === "shortcut_blocked").length;
  if (shortcuts > 0) {
    const pts = Math.min(20, shortcuts * RISK_WEIGHTS.shortcut_blocked);
    signalPoints.push({
      reason: `${shortcuts} prohibited keyboard shortcut attempt${shortcuts > 1 ? "s" : ""} (e.g. copy/inspect/devtools)`,
      points: pts,
    });
  }

  // 7. Paste attempts & paste_like events
  const pasteBlocked = events.filter(
    (e) => e.event_type === "paste_blocked" || e.event_type === "paste_attempt"
  ).length;
  if (pasteBlocked > 0) {
    const pts = Math.min(25, pasteBlocked * RISK_WEIGHTS.paste_blocked);
    signalPoints.push({
      reason: `${pasteBlocked} blocked clipboard paste attempt${pasteBlocked > 1 ? "s" : ""}`,
      points: pts,
    });
  }

  const pasteLike = events.filter((e) => e.event_type === "paste_like").length;
  if (pasteLike > 0) {
    const pts = Math.min(25, pasteLike * RISK_WEIGHTS.paste_like);
    signalPoints.push({
      reason: `${pasteLike} paste-like text insertion${pasteLike > 1 ? "s" : ""} in answer area`,
      points: pts,
    });
  }

  // 8. Input injection
  const injections = events.filter((e) => e.event_type === "input_injection").length;
  if (injections > 0) {
    const pts = Math.min(30, injections * RISK_WEIGHTS.input_injection);
    signalPoints.push({
      reason: `${injections} bulk text injection event${injections > 1 ? "s" : ""} without matching keystrokes`,
      points: pts,
    });
  }

  // 9. Typing anomalies
  const typingAnomalies = events.filter((e) => e.event_type === "typing_anomaly").length;
  if (typingAnomalies > 0) {
    const pts = Math.min(25, typingAnomalies * RISK_WEIGHTS.typing_anomaly);
    signalPoints.push({
      reason: `${typingAnomalies} typing anomaly event${typingAnomalies > 1 ? "s" : ""} (unusual speed or burst patterns)`,
      points: pts,
    });
  }

  // 10. Multiple monitors
  const multiMonitors = events.filter((e) => e.event_type === "multiple_monitors").length;
  if (multiMonitors > 0) {
    signalPoints.push({
      reason: "Secondary display / extended monitor setup detected during assessment",
      points: RISK_WEIGHTS.multiple_monitors,
    });
  }

  // 11. DevTools open
  const devtools = events.filter((e) => e.event_type === "devtools_open").length;
  if (devtools > 0) {
    signalPoints.push({
      reason: "Browser Developer Tools inspection window detected open",
      points: RISK_WEIGHTS.devtools_open,
    });
  }

  // 12. Duplicate session
  const dupSession = events.filter((e) => e.event_type === "duplicate_session").length;
  if (dupSession > 0) {
    signalPoints.push({
      reason: "Simultaneous session attempt detected from another tab or device",
      points: RISK_WEIGHTS.duplicate_session,
    });
  }

  // 13. Suspicious extension UI
  const extUI = events.filter((e) => e.event_type === "suspicious_extension_ui").length;
  if (extUI > 0) {
    signalPoints.push({
      reason: "Unauthorized browser extension overlay detected inside interview DOM",
      points: RISK_WEIGHTS.suspicious_extension_ui,
    });
  }

  // 14. Low authenticity score
  const authScore = feedback?.authenticity_score;
  if (typeof authScore === "number" && authScore < 5) {
    const deficit = 5 - authScore;
    const pts = Math.round(deficit * 5);
    signalPoints.push({
      reason: `Low solution authenticity score (${authScore}/10) on conceptual follow-up`,
      points: pts,
    });
  }

  // 15. Fast long answer timing anomalies (if logged in details)
  const fastAnswers = events.filter(
    (e) => e.event_type === "typing_anomaly" && e.details?.type === "fast_long_answer"
  ).length;
  if (fastAnswers > 0) {
    signalPoints.push({
      reason: `${fastAnswers} substantial answer${fastAnswers > 1 ? "s" : ""} submitted with implausibly low reading/thinking time`,
      points: RISK_WEIGHTS.fast_long_answer,
    });
  }

  // Sum points
  let totalRawScore = signalPoints.reduce((acc, curr) => acc + curr.points, 0);

  // If auto-submitted early, guarantee High risk floor (at least 65)
  if (interview?.auto_submit_reason) {
    totalRawScore = Math.max(totalRawScore, 65);
    signalPoints.push({
      reason: `Interview terminated early due to ${interview.auto_submit_reason.replace(/_/g, " ")}`,
      points: 40,
    });
  }

  // Clamp 0 to 100
  const risk_score = Math.min(100, Math.max(0, Math.round(totalRawScore)));

  // Risk level
  let risk_level: "Low" | "Medium" | "High" = "Low";
  if (risk_score >= RISK_THRESHOLDS.high) {
    risk_level = "High";
  } else if (risk_score >= RISK_THRESHOLDS.medium) {
    risk_level = "Medium";
  }

  // Sort by highest contributing points and pick top 3 unique reasons
  signalPoints.sort((a, b) => b.points - a.points);
  const top_reasons = signalPoints
    .slice(0, 3)
    .map((s) => s.reason);

  if (top_reasons.length === 0) {
    top_reasons.push("Clean session: no unauthorized navigation, injection, or window events detected.");
  }

  return {
    risk_score,
    risk_level,
    top_reasons,
  };
}

