import type { Metadata } from "next";
import * as Sentry from "@sentry/nextjs";
import Script from "next/script";
import { Suspense } from "react";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { getCurrentUser } from "@/lib/auth";
import { Analytics } from "@vercel/analytics/react";
import TopProgressBar from "@/components/loading/TopProgressBar";

export function generateMetadata(): Metadata {
  return {
    title: "MockMate - AI Mock Interview & Resume Tool for Indian College Students",
    description:
      "Crack your campus placement with realistic AI interviews for DSA, CS Fundamentals (OS/DBMS/CN), System Design & HR, plus resume-aware questions and ATS tailoring.",
    other: {
      ...Sentry.getTraceData(),
    },
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const currentUser = await getCurrentUser();
  const initialRole = currentUser?.role ?? null;

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>

      <body className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased selection:bg-indigo-500 selection:text-white">
        <Suspense fallback={null}>
          <TopProgressBar />
        </Suspense>
        <Navbar
          initialRole={initialRole}
          initialUser={
            currentUser
              ? {
                full_name: currentUser.full_name,
                email: currentUser.email,
                credits: currentUser.credits,
                role: currentUser.role,
              }
              : null
          }
        />

        <main className="flex-1 flex flex-col">{children}</main>

        <Footer />

        {/* Razorpay Standard Checkout SDK */}
        <Script
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="lazyOnload"
        />

        <Analytics />
      </body>
    </html>
  );
}