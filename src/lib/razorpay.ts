import Razorpay from "razorpay";

export type PackId = "starter" | "pro";

export interface CreditPack {
  id: PackId;
  name: string;
  nameHinglish: string;
  price: number; // in INR (₹)
  amount: number; // in paise (₹1 = 100 paise)
  credits: number;
  description: string;
  descriptionHinglish: string;
  features: string[];
  featuresHinglish: string[];
  popular?: boolean;
}

/**
 * Server-side source of truth for credit packs.
 * Clients only specify packId; pricing and credits are strictly resolved here.
 */
export const CREDIT_PACKS: Record<PackId, CreditPack> = {
  starter: {
    id: "starter",
    name: "Starter Pack",
    nameHinglish: "Starter Pack (3 Mocks)",
    price: 99,
    amount: 9900, // ₹99 in paise
    credits: 3,
    description: "3 interview credits for targeted placement practice.",
    descriptionHinglish: "3 mock interview credits apni placement practice ke liye.",
    features: [
      "3 AI Mock Interviews",
      "All rounds: DSA, CS Fundamentals & HR",
      "Company-wise practice (TCS, Infosys, Amazon, etc.)",
      "Instant Performance Report & Score Card",
    ],
    featuresHinglish: [
      "3 AI Mock Interviews",
      "DSA, Core CS aur HR rounds ka complete access",
      "Company-specific mock sessions (TCS, Amazon, etc.)",
      "Instant Score Card & WhatsApp/LinkedIn shareable badge",
    ],
  },
  pro: {
    id: "pro",
    name: "Placement Pro Pack",
    nameHinglish: "Placement Pro (10 Mocks + Resume)",
    price: 249,
    amount: 24900, // ₹249 in paise
    credits: 10,
    description: "10 interview credits + Unlocks AI Resume Tailor.",
    descriptionHinglish: "10 mock interview credits + AI Resume Tailor unlocked.",
    features: [
      "10 AI Mock Interviews",
      "Unlocks AI Resume Tailor & ATS Scanner",
      "Targeted weak area recommendations",
      "All 10+ company profiles & custom difficulty",
      "Placement Readiness Certificate & Shareable Card",
    ],
    featuresHinglish: [
      "10 AI Mock Interviews",
      "AI Resume Tailor aur ATS Scanner unlock",
      "Weak topics (DSA/OS/DBMS) par practice suggestions",
      "Sabhi 10+ company tracks (TCS, Amazon, Swiggy, etc.)",
      "Shareable Placement Readiness score card",
    ],
    popular: true,
  },
};

/**
 * Resolves pack by ID with backward-compatible aliases (pack_3 -> starter, pack_10 -> pro).
 */
export function getCreditPack(rawId: string): CreditPack | null {
  if (rawId === "starter" || rawId === "pack_3") {
    return CREDIT_PACKS.starter;
  }
  if (rawId === "pro" || rawId === "pack_10") {
    return CREDIT_PACKS.pro;
  }
  return null;
}

/**
 * Returns a configured Razorpay server client.
 * NOTE FOR PRODUCTION:
 * - To switch to LIVE keys: update RAZORPAY_KEY_ID (rzp_live_...) & RAZORPAY_KEY_SECRET in .env.production.
 * - Test mode keys use prefix rzp_test_...
 */
export function getRazorpayClient(): Razorpay | null {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    return null;
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
}
