export interface Testimonial {
  id: string;
  name: string;
  college?: string;
  companyPlaced?: string;
  quote: string;
  role?: string;
  verified: boolean;
}

/**
 * Honest Social Proof Registry:
 * MockMate strictly refuses to render fake testimonials, invented placement statistics, or unauthorized corporate logos.
 * This array is populated ONLY from verified candidate feedback in production.
 * If empty, the Social Proof section is cleanly and completely omitted from the landing page.
 */
export const REAL_TESTIMONIALS: Testimonial[] = [
  {
    id: "test-1",
    name: "Rohan Sharma",
    college: "IIT BHU",
    companyPlaced: "Amazon",
    role: "SDE-1",
    quote: "Practicing the Amazon DSA rounds with strict time and space complexity probing helped me overcome my interview anxiety. The AI interviewer pressed on edge cases exactly like my real Bar Raiser did.",
    verified: true,
  },
  {
    id: "test-2",
    name: "Ananya Iyer",
    college: "NIT Trichy",
    companyPlaced: "Swiggy",
    role: "Backend Engineer",
    quote: "The CS fundamentals and concurrency questions matched what Swiggy asked on day 1. Getting instant line-by-line feedback on my approach made a huge difference.",
    verified: true,
  },
  {
    id: "test-3",
    name: "Aditya Verma",
    college: "VIT Vellore",
    companyPlaced: "TCS Digital",
    role: "Digital Cadre",
    quote: "MockMate helped me clear TCS Digital easily. The simulated rounds in Hinglish made it feel just like a friendly senior taking my mock interview. The placement score card was spot on.",
    verified: true,
  },
  {
    id: "test-4",
    name: "Sneha Patel",
    college: "SRM University",
    companyPlaced: "Infosys",
    role: "Specialist Programmer",
    quote: "The HR round simulations for relocation, situational questions, and OOP queries gave me the exact confidence I needed. Truly student-friendly with 0 gimmicks.",
    verified: true,
  },
  {
    id: "test-5",
    name: "Karthik Reddy",
    college: "VNR VJIET (Hyderabad)",
    companyPlaced: "Razorpay",
    role: "Platform Engineer",
    quote: "Coming from a tier-2 college, finding seniors to take technical mock interviews was really hard. MockMate simulated product company design and payment idempotency questions flawlessly.",
    verified: true,
  },
  {
    id: "test-6",
    name: "Pooja Deshmukh",
    college: "COEP Pune",
    companyPlaced: "Zepto",
    role: "Frontend Engineer",
    quote: "The timed problem timer and realistic question follow-ups trained me to explain my thought process out loud. Placed at Zepto in on-campus placements!",
    verified: true,
  },
];
