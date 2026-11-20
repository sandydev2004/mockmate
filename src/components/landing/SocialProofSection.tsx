import { REAL_TESTIMONIALS } from "@/lib/social-proof";
import { CheckCircle2, Quote } from "lucide-react";

export function SocialProofSection() {
  // Strictly hide if no real verified testimonials exist
  if (!REAL_TESTIMONIALS || REAL_TESTIMONIALS.length === 0) {
    return null;
  }

  return (
    <section className="py-16 md:py-20 border-b border-slate-200/60 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-900/40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            Real Candidate Experiences
          </p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
            Verified Student Stories
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {REAL_TESTIMONIALS.map((t) => (
            <div
              key={t.id}
              className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between"
            >
              <div className="space-y-3">
                <Quote className="w-6 h-6 text-indigo-500/40" />
                <p className="text-sm text-slate-700 dark:text-slate-300 italic leading-relaxed">
                  "{t.quote}"
                </p>
              </div>
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 mt-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">{t.name}</p>
                  <p className="text-[11px] text-slate-500">
                    {t.college && `${t.college} • `}
                    {t.companyPlaced ? `Placed at ${t.companyPlaced}` : t.role || "Candidate"}
                  </p>
                </div>
                {t.verified && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    <CheckCircle2 className="w-3 h-3" />
                    Verified
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
