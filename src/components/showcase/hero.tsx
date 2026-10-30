import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowDown, ArrowRight, Check, Loader2, ShieldAlert } from "lucide-react";

import { CountUp } from "@/components/dashboard/live-widgets";
import { Button } from "@/components/ui/button";
import { useReducedMotion } from "@/lib/motion";

const steps = [
  { agent: "Triage", finding: "Password request · urgency · 1 link" },
  { agent: "Investigation", finding: "passwrd-reset-secure.example · lookalike" },
  { agent: "Logs", finding: "j.rao clicked, then signed in from new IP" },
  { agent: "Risk review", finding: "3 of 3 evidence sources agree" },
  { agent: "Response", finding: "Quarantine · block domain · reset password" },
];

const STEP_MS = 900;

function LiveRun() {
  const reducedMotion = useReducedMotion();
  const [done, setDone] = useState(reducedMotion ? steps.length : 0);

  useEffect(() => {
    if (reducedMotion) {
      setDone(steps.length);
      return;
    }
    const interval = window.setInterval(
      () => setDone((current) => (current >= steps.length + 3 ? 0 : current + 1)),
      STEP_MS,
    );
    return () => window.clearInterval(interval);
  }, [reducedMotion]);

  const finished = done >= steps.length;

  return (
    <div className="hero-run cg-panel">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <span className="font-mono text-xs text-muted-foreground">
          INC-2041 · it-support@company-helpdesk.example
        </span>
        <span className="cg-live-indicator">
          <span /> Live run
        </span>
      </div>
      <ol className="divide-y divide-border">
        {steps.map((step, index) => {
          const state = index < done ? "done" : index === done ? "running" : "queued";
          return (
            <li
              className={`hero-step is-${state} flex items-center gap-3 px-4 py-3`}
              key={step.agent}
            >
              <span className="hero-step-icon">
                {state === "done" ? (
                  <Check aria-hidden="true" className="size-3.5" />
                ) : state === "running" ? (
                  <Loader2 aria-hidden="true" className="size-3.5 animate-spin" />
                ) : (
                  <span className="size-1.5 rounded-full bg-current" />
                )}
              </span>
              <span className="w-28 shrink-0 text-sm font-semibold">{step.agent}</span>
              <span className="truncate font-mono text-xs text-muted-foreground">
                {state === "done" ? step.finding : state === "running" ? "working…" : ""}
              </span>
            </li>
          );
        })}
      </ol>
      <div className="flex items-center justify-between gap-4 border-t border-border px-4 py-4">
        <div>
          <p className="cg-eyebrow">Verdict</p>
          <p className={`hero-verdict ${finished ? "is-shown" : ""}`}>
            {finished ? <CountUp value={95} duration={600} /> : "—"}
            <span>/100</span>
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className={`guide-pill is-bad ${finished ? "" : "opacity-30"}`}>
            <ShieldAlert aria-hidden="true" className="size-3" /> Critical
          </span>
          <span className={`guide-pill is-warn ${finished ? "" : "opacity-30"}`}>
            Awaiting analyst approval
          </span>
        </div>
      </div>
    </div>
  );
}

const stats = [
  { value: 4, suffix: "", label: "specialist agents per incident" },
  { value: 3, suffix: "", label: "hurdle traps handled" },
  { value: 0, suffix: "", label: "actions run without approval" },
  { value: 100, suffix: "%", label: "of decisions audited" },
];

export function ShowcaseHero() {
  return (
    <section className="hero-bg border-b border-border">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-16 pt-14 lg:grid-cols-[1.05fr_0.95fr] lg:pb-24 lg:pt-20">
        <div>
          <p className="cg-eyebrow">Agentic phishing incident response</p>
          <h1 className="hero-title mt-4">
            The phish came from someone you trust.
            <span> We still caught it.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground">
            PhishPilot sends every reported email through four AI agents, scores it with evidence
            you can read, and waits for an analyst before anything happens.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button asChild className="cg-primary-button h-11 px-5">
              <Link to="/investigation">
                Analyze an email <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild className="h-11 px-5" variant="outline">
              <Link search={{ scenario: undefined }} to="/dashboard">
                Open the console
              </Link>
            </Button>
            <a
              className="ml-1 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              href="#how"
            >
              How it works <ArrowDown aria-hidden="true" className="size-3.5" />
            </a>
          </div>
        </div>
        <LiveRun />
      </div>
      <div className="border-t border-border">
        <dl className="mx-auto grid max-w-6xl grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div className="border-border px-5 py-6 [&:not(:last-child)]:border-r" key={stat.label}>
              <dt className="sr-only">{stat.label}</dt>
              <dd className="font-display text-4xl font-bold tracking-tight tabular-nums">
                <CountUp value={stat.value} />
                {stat.suffix}
              </dd>
              <dd className="mt-1 text-sm text-muted-foreground">{stat.label}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
