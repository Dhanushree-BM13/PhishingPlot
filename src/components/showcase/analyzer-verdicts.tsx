import {
  AlertTriangle,
  BadgeCheck,
  CircleAlert,
  Link2,
  Scale,
  Shield,
  UserRound,
} from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useInView } from "@/hooks/use-in-view";
import { useDemoStore } from "@/lib/store";

const analyzerIcons = {
  triage: Shield,
  url_domain: Link2,
  sender_behavior: UserRound,
  risk_reviewer: Scale,
};

const levelStyles = {
  low: "border-emerald-300/25 bg-emerald-300/10 text-emerald-200",
  medium: "border-amber-300/25 bg-amber-300/10 text-amber-100",
  high: "border-rose-300/25 bg-rose-300/10 text-rose-200",
  critical: "border-rose-300/40 bg-rose-400/15 text-rose-100",
};

export default function AnalyzerVerdicts() {
  const { ref, isInView } = useInView<HTMLElement>();
  const { analyzerVerdictFixture, demoDataLabel } = useDemoStore();

  return (
    <section
      className={`showcase-reveal mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16 ${isInView ? "is-visible" : ""}`}
      ref={ref}
    >
      <Badge className="border-indigo-300/25 bg-indigo-300/8 text-indigo-200">
        {demoDataLabel}
      </Badge>
      <h2 className="mt-5 text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl">
        Analyzer verdicts
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
        Separate fixture verdicts stay visible, including when their risk assessments differ.
      </p>

      {analyzerVerdictFixture.disagreement.detected && (
        <Alert className="mt-6 border-amber-300/25 bg-amber-300/5 text-amber-100">
          <AlertTriangle className="size-4" aria-hidden="true" />
          <AlertTitle>Analysts disagree</AlertTitle>
          <AlertDescription className="text-amber-100/75">
            {analyzerVerdictFixture.disagreement.message}
          </AlertDescription>
        </Alert>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {analyzerVerdictFixture.verdicts.map((verdict, index) => {
          const Icon = analyzerIcons[verdict.analyzerId];
          const LevelIcon = verdict.level === "low" ? BadgeCheck : CircleAlert;
          return (
            <Card
              className={`showcase-reveal rounded-2xl border-white/10 bg-[#10131d] p-5 text-slate-100 shadow-none ${isInView ? "is-visible" : ""}`}
              key={verdict.analyzerId}
              style={{ transitionDelay: `${index * 70}ms` }}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <Icon className="size-4 shrink-0 text-indigo-200" aria-hidden="true" />
                  <h3 className="truncate font-mono text-sm font-semibold">{verdict.analyzerId}</h3>
                </div>
                <Badge className={levelStyles[verdict.level]}>
                  <LevelIcon className="mr-1 size-3" aria-hidden="true" />
                  {verdict.level.toUpperCase()}
                </Badge>
              </div>
              <p className="mt-5 font-mono text-2xl font-semibold text-white">
                {verdict.score}
                <span className="text-sm text-slate-500"> / 100</span>
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Confidence: {Math.round(verdict.confidence * 100)}%
              </p>
              <p className="mt-4 min-h-16 text-sm leading-6 text-slate-300">{verdict.rationale}</p>
              <div className="mt-4 border-t border-white/8 pt-3">
                <p className="text-xs font-medium text-slate-500">Triggered signal IDs</p>
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {verdict.signalIds.map((signalId) => (
                    <li
                      className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-1 font-mono text-[10px] text-slate-300"
                      key={signalId}
                    >
                      {signalId}
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
