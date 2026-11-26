import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getAllPracticePages,
  getPracticePage,
} from "@/lib/programmatic-content";
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Clock,
  BookOpen,
  Code2,
  ChevronRight,
  HelpCircle,
  Award,
  Zap,
  Building2,
  ShieldCheck,
} from "lucide-react";

interface Props {
  params: {
    company: string;
    slug: string;
  };
}

export async function generateStaticParams() {
  const pages = getAllPracticePages();
  return pages.map((p) => ({
    company: p.companySlug,
    slug: p.slug,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = getPracticePage(params.company, params.slug);
  if (!page) {
    return {
      title: "Practice Questions | MockMate",
      description: "Indian campus placement interview questions and AI mock practice.",
    };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://mockmate.ai";
  const pageUrl = `${appUrl}/practice/${page.companySlug}/${page.slug}`;

  return {
    title: `${page.title} | MockMate`,
    description: page.metaDescription,
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      title: `${page.title} | MockMate`,
      description: page.metaDescription,
      url: pageUrl,
      siteName: "MockMate AI",
      type: "article",
      locale: "en_IN",
      images: [
        {
          url: `${appUrl}/og-image.png`,
          width: 1200,
          height: 630,
          alt: `${page.company} Placement Interview Guide`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: page.title,
      description: page.metaDescription,
    },
  };
}

export default function PracticeQuestionPage({ params }: Props) {
  const page = getPracticePage(params.company, params.slug);
  if (!page) {
    notFound();
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://mockmate.ai";
  const pageUrl = `${appUrl}/practice/${page.companySlug}/${page.slug}`;

  // Structured Data JSON-LD for Search Engines
  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: page.title,
    description: page.metaDescription,
    author: {
      "@type": "Organization",
      name: "MockMate Editorial Team",
      url: appUrl,
    },
    publisher: {
      "@type": "Organization",
      name: "MockMate AI",
      logo: {
        "@type": "ImageObject",
        url: `${appUrl}/logo.png`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": pageUrl,
    },
    datePublished: "2025-01-15T00:00:00+05:30",
    dateModified: "2025-02-20T00:00:00+05:30",
  };

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: page.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.a,
      },
    })),
  };

  return (
    <article className="min-h-screen bg-slate-50/50 dark:bg-slate-950 pb-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />

      {/* Breadcrumb Header */}
      <div className="border-b border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3">
          <nav className="flex items-center gap-1.5 text-xs text-slate-500 overflow-x-auto whitespace-nowrap">
            <Link href="/" className="hover:text-indigo-600 dark:hover:text-indigo-400">
              Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5 shrink-0" />
            <span className="hover:text-indigo-600 dark:hover:text-indigo-400">
              Practice
            </span>
            <ChevronRight className="w-3.5 h-3.5 shrink-0" />
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {page.company}
            </span>
          </nav>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-8 space-y-10">
        {/* Hero Section */}
        <header className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              <Building2 className="w-3.5 h-3.5" />
              <span>{page.company} Placement Hub</span>
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              {page.round.toUpperCase()} Round
            </span>
            <span className="inline-flex items-center gap-1 text-xs text-slate-500">
              <Clock className="w-3.5 h-3.5" />
              <span>{page.readTime}</span>
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white leading-tight">
            {page.title}
          </h1>

          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
            {page.subtitle}
          </p>

          {/* Quick Action Banner */}
          <div className="p-4 rounded-2xl bg-indigo-600 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg shadow-indigo-600/20">
            <div className="space-y-0.5">
              <p className="text-sm font-bold flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 fill-white" />
                <span>Simulate a Real {page.company} Interview</span>
              </p>
              <p className="text-xs text-indigo-100">
                Practice these exact questions with MockMate&apos;s AI interviewer & get scored instantly.
              </p>
            </div>
            <Link
              href={`/interview/setup?company=${encodeURIComponent(page.company)}&round=${page.round}`}
              className="px-4 py-2 rounded-xl bg-white text-indigo-600 font-bold text-xs hover:bg-indigo-50 transition-colors shrink-0 shadow-sm"
            >
              Start Free {page.company} Mock &rarr;
            </Link>
          </div>
        </header>

        {/* Overview */}
        <section className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-600" />
            <span>Hiring Overview & Evaluation Bar</span>
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            {page.overview}
          </p>

          {/* Key Topics */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              High-Frequency Topics Tested:
            </span>
            <div className="flex flex-wrap gap-2">
              {page.keyTopics.map((topic) => (
                <span
                  key={topic}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                >
                  {topic}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Recruitment Selection Process */}
        <section className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-indigo-600" />
            <span>{page.company} Campus Recruitment Stages</span>
          </h2>
          <div className="space-y-3">
            {page.selectionProcess.map((step, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 font-extrabold text-xs flex items-center justify-center shrink-0 border border-indigo-200 dark:border-indigo-800">
                  {idx + 1}
                </span>
                <p className="text-sm text-slate-700 dark:text-slate-300 pt-0.5">
                  {step}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Curated Questions & In-Depth Solutions */}
        <section className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Code2 className="w-6 h-6 text-indigo-600" />
              <span>Core Questions with Ideal Answers</span>
            </h2>
            <p className="text-xs text-slate-500">
              Analyzed and formulated from candidate interview experiences at top Indian engineering colleges.
            </p>
          </div>

          <div className="space-y-6">
            {page.questions.map((q, idx) => (
              <div
                key={q.id}
                className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4"
              >
                <div className="space-y-1">
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    Question {idx + 1}
                  </span>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    {q.question}
                  </h3>
                </div>

                <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-850 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                  <strong className="text-slate-900 dark:text-white block mb-1">
                    Structured Answer / Approach:
                  </strong>
                  {q.answer}
                </div>

                {q.codeSnippet && (
                  <div className="space-y-1.5">
                    <span className="text-xs font-bold text-slate-400">Solution Code:</span>
                    <pre className="p-4 rounded-xl bg-slate-900 text-slate-100 text-xs font-mono overflow-x-auto leading-relaxed">
                      <code>{q.codeSnippet}</code>
                    </pre>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs text-slate-500 border-t border-slate-100 dark:border-slate-800">
                  {q.complexity && (
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      Complexity: {q.complexity}
                    </span>
                  )}
                  {q.approach && (
                    <span className="text-slate-500 italic">
                      Approach: {q.approach}
                    </span>
                  )}
                </div>

                <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
                  <Zap className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>Interviewer Tip:</strong> {q.proTip}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* FAQs Section */}
        <section className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-indigo-600" />
            <span>Frequently Asked Questions</span>
          </h2>
          <div className="space-y-4 divide-y divide-slate-100 dark:divide-slate-800">
            {page.faqs.map((faq, i) => (
              <div key={i} className={i > 0 ? "pt-4 space-y-1.5" : "space-y-1.5"}>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {faq.q}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Bottom Placement Readiness CTA */}
        <div className="p-8 rounded-3xl bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 text-white text-center space-y-4 shadow-xl">
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Free On-Device AI Interview Session</span>
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold max-w-xl mx-auto">
            Ready to test your readiness for {page.company}?
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto">
            Get interviewed by our realistic AI panel, write code live in the editor, and receive your comprehensive placement score report.
          </p>
          <div className="pt-2">
            <Link
              href={`/interview/setup?company=${encodeURIComponent(page.company)}&round=${page.round}`}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-white text-slate-900 hover:bg-slate-100 font-extrabold text-sm shadow-md transition-all"
            >
              <Zap className="w-4 h-4 fill-indigo-600 text-indigo-600" />
              <span>Start Free {page.company} Mock Interview</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <p className="text-[11px] text-slate-400">1 free credit included • No credit card required</p>
        </div>
      </div>
    </article>
  );
}
