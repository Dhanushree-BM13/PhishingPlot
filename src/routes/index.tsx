import { lazy, Suspense } from "react";
import { createFileRoute } from "@tanstack/react-router";

import { ShowcaseHero } from "@/components/showcase/hero";
import { SiteFooter } from "@/components/showcase/site-footer";

const HowItWorks = lazy(() => import("@/components/showcase/how-it-works"));
const AnalyzerVerdicts = lazy(() => import("@/components/showcase/analyzer-verdicts"));
const AuditTimeline = lazy(() => import("@/components/showcase/audit-timeline"));
const TechStackBento = lazy(() => import("@/components/showcase/tech-stack-bento"));

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PHISHPILOT — Phishing triage that questions trusted senders" },
      {
        name: "description",
        content:
          "Deterministic, offline analysis for phishing incidents. Analysts review every verdict, disagreement, and approval.",
      },
      {
        property: "og:title",
        content: "PHISHPILOT — Phishing triage that questions trusted senders",
      },
      {
        property: "og:description",
        content:
          "Deterministic, offline analysis for phishing incidents, with human review at every step.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Showcase,
});

function Showcase() {
  return (
    <>
      <main className="showcase min-h-screen overflow-x-clip bg-background text-foreground">
        <ShowcaseHero />
        <Suspense
          fallback={
            <div className="mx-auto min-h-40 max-w-7xl px-6 py-12 text-sm text-slate-400">
              Loading demo scenarios…
            </div>
          }
        >
          <HowItWorks />
        </Suspense>
        <Suspense
          fallback={
            <div aria-busy="true" className="mx-auto max-w-7xl px-5 py-12 sm:px-8" role="status">
              <div className="h-8 w-48 rounded bg-white/10" />
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }, (_, index) => (
                  <div
                    className="h-52 rounded-2xl border border-white/8 bg-white/[0.025]"
                    key={index}
                  />
                ))}
              </div>
              <span className="sr-only">Loading showcase sections…</span>
            </div>
          }
        >
          <AnalyzerVerdicts />
          <AuditTimeline />
        </Suspense>
        <Suspense
          fallback={
            <div aria-busy="true" className="mx-auto max-w-7xl px-5 py-12 sm:px-8" role="status">
              <div className="h-8 w-48 rounded bg-white/10" />
              <div className="mt-6 h-64 rounded-2xl border border-white/8 bg-white/[0.025]" />
              <span className="sr-only">Loading technology stack…</span>
            </div>
          }
        >
          <TechStackBento />
        </Suspense>
      </main>
      <SiteFooter />
    </>
  );
}
