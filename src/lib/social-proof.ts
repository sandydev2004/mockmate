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
export const REAL_TESTIMONIALS: Testimonial[] = [];
