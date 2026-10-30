import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { AlertTriangle, ArrowDownRight, Check, Clock3, Link2, ShieldAlert } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useInView } from "@/hooks/use-in-view";
import { useDemoStore } from "@/lib/store";

function formatLabel(value: string) {
  return value === "needs_rereview"
    ? "Needs re-review"
    : value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function ScenarioPanel({ activeStep }: { activeStep: number }) {
  const { demoIncidents, linkObservationFixture, scenarioVerdicts, senderBaselineFixture } =
    useDemoStore();
  if (activeStep === 0) {
    const incident = demoIncidents.trustedSender;
    const verdict = scenarioVerdicts.trustedSender;
    return (
      <Card className="rounded-2xl border-white/10 bg-[#10131d] p-5 text-slate-100 shadow-2xl shadow-black/20 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-mono text-xs text-slate-500">{incident.id}</p>
            <h3 className="mt-2 text-lg font-semibold">{incident.subject}</h3>
            <p className="mt-1 break-all text-sm text-slate-400">{incident.sender}</p>
          </div>
          <Badge className="border-rose-300/25 bg-rose-400/10 text-rose-200">
            <ShieldAlert className="mr-1 size-3" aria-hidden="true" />
            {incident.risk.toUpperCase()} risk
          </Badge>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-white/8 bg-black/20 p-4">
            <p className="text-xs text-slate-500">Prior benign emails</p>
            <p className="mt-2 font-mono text-2xl font-semibold">
              {senderBaselineFixture.sampleSize}
            </p>
          </div>
          <div className="rounded-xl border border-white/8 bg-black/20 p-4">
            <p className="text-xs text-slate-500">Authentication checks</p>
            <ul className="mt-2 space-y-1">
              {incident.authChecks.map((check) => (
                <li
                  className="flex items-center gap-2 text-xs font-medium text-emerald-200"
                  key={check.name}
                >
                  <Check className="size-3" aria-hidden="true" />
                  {check.name}: {check.status}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-white/8 bg-black/20 p-4">
          <p className="text-xs text-slate-500">New link domain</p>
          <p className="mt-1 break-all font-mono text-sm text-slate-200">
            {incident.newLinkDomain}
          </p>
          <p className="mt-3 text-sm text-slate-400">{incident.bankDetailChangeText}</p>
        </div>

        <Alert className="mt-4 border-rose-300/25 bg-rose-400/8 text-rose-100">
          <AlertTriangle className="size-4" aria-hidden="true" />
          <AlertTitle>{incident.banner}</AlertTitle>
          <AlertDescription className="text-rose-100/75">
            {formatLabel(incident.trustDiscountState)} trust discount ·{" "}
            {verdict.level.toUpperCase()} sender-behavior verdict
          </AlertDescription>
        </Alert>
      </Card>
    );
  }

  if (activeStep === 1) {
    const incident = demoIncidents.linkDrift;
    const observations = linkObservationFixture.observations;
    return (
      <Card className="rounded-2xl border-white/10 bg-[#10131d] p-5 text-slate-100 shadow-2xl shadow-black/20 sm:p-7">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-mono text-xs text-slate-500">{incident.id}</p>
            <h3 className="mt-2 text-lg font-semibold">Local link observation timeline</h3>
          </div>
          <Badge className="border-amber-300/25 bg-amber-300/10 text-amber-100">
            <Clock3 className="mr-1 size-3" aria-hidden="true" />
            {linkObservationFixture.timelineLabel}
          </Badge>
        </div>
        <p className="mt-4 break-all rounded-lg border border-white/8 bg-black/20 p-3 font-mono text-xs text-slate-300">
          {linkObservationFixture.url}
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {observations.map((observation) => (
            <div
              className="rounded-xl border border-white/8 bg-black/20 p-4"
              key={observation.observedAt}
            >
              <p className="font-mono text-xs text-slate-500">{observation.observedAt}</p>
              <p
                className={`mt-2 text-sm font-semibold capitalize ${
                  observation.localReputation === "clean" ? "text-emerald-200" : "text-rose-200"
                }`}
              >
                {observation.localReputation}
              </p>
              <p className="mt-1 text-xs text-slate-400">{observation.note}</p>
            </div>
          ))}
        </div>
        <div className="my-4 flex items-center justify-center text-amber-200">
          <ArrowDownRight className="size-5" aria-hidden="true" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-emerald-300/20 bg-emerald-300/5 p-4">
            <p className="text-xs text-slate-400">Approval before re-check</p>
            <p className="mt-2 font-medium capitalize text-emerald-200">
              {formatLabel(linkObservationFixture.initialApprovalState)}
            </p>
          </div>
          <div className="rounded-xl border border-rose-300/20 bg-rose-300/5 p-4">
            <p className="text-xs text-slate-400">Approval after re-check</p>
            <p className="mt-2 font-medium capitalize text-rose-200">
              {formatLabel(linkObservationFixture.finalApprovalState)}
            </p>
          </div>
        </div>
        <Alert className="mt-4 border-amber-300/25 bg-amber-300/5 text-amber-100">
          <Link2 className="size-4" aria-hidden="true" />
          <AlertTitle>
            {formatLabel(incident.status)} · approval is no longer valid for this evidence
          </AlertTitle>
          <AlertDescription className="break-all text-amber-100/75">
            {linkObservationFixture.invalidatedMessage}
          </AlertDescription>
        </Alert>
        <p className="mt-3 text-xs text-slate-500">
          {incident.intelligenceLabel} only; no live URL scan is performed.
        </p>
      </Card>
    );
  }

  const incident = demoIncidents.analyzerDissent;
  const [urlVerdict, senderVerdict] = scenarioVerdicts.dissent;
  return (
    <Card className="rounded-2xl border-white/10 bg-[#10131d] p-5 text-slate-100 shadow-2xl shadow-black/20 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-xs text-slate-500">{incident.id}</p>
          <h3 className="mt-2 text-lg font-semibold">Separate verdicts, visible disagreement</h3>
        </div>
        <Badge className="border-amber-300/25 bg-amber-300/10 text-amber-100">
          {formatLabel(incident.status)}
        </Badge>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {[urlVerdict, senderVerdict].map((verdict) => (
          <div
            className="rounded-xl border border-white/8 bg-black/20 p-4"
            key={verdict.analyzerId}
          >
            <p className="font-mono text-xs text-slate-500">{verdict.analyzerId}</p>
            <p
              className={`mt-2 text-sm font-semibold ${
                verdict.level === "high" ? "text-rose-200" : "text-emerald-200"
              }`}
            >
              {verdict.level.toUpperCase()}
            </p>
            <p className="mt-1 font-mono text-xs text-slate-500">Demo score: {verdict.score}</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">{verdict.rationale}</p>
          </div>
        ))}
      </div>
      <Alert className="mt-4 border-amber-300/25 bg-amber-300/5 text-amber-100">
        <AlertTriangle className="size-4" aria-hidden="true" />
        <AlertTitle>{incident.disagreementMessage}</AlertTitle>
        <AlertDescription className="text-amber-100/75">
          Approval stays disabled until the analyst writes a justification of at least{" "}
          {incident.minimumJustificationLength} characters.
        </AlertDescription>
      </Alert>
      <div className="mt-4 rounded-xl border border-white/8 bg-black/20 p-4">
        <label className="text-xs text-slate-400" htmlFor="demo-justification">
          Example justification field
        </label>
        <textarea
          className="mt-2 min-h-20 w-full resize-none rounded-lg border border-white/10 bg-[#090b11] p-3 text-sm text-slate-400 outline-none"
          id="demo-justification"
          placeholder="A justification is required before an analyst can approve."
          readOnly
        />
      </div>
    </Card>
  );
}

export default function HowItWorks() {
  const { demoDataLabel, showcaseScenarioSteps } = useDemoStore();
  const stepRefs = useRef<Array<HTMLElement | null>>([]);
  const { ref, isInView } = useInView<HTMLElement>({ threshold: 0.08 });
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;
    const updateActiveStep = () => {
      const viewportCenter = window.innerHeight / 2;
      let closestIndex = 0;
      let closestDistance = Number.POSITIVE_INFINITY;
      stepRefs.current.forEach((element, index) => {
        if (!element) return;
        const bounds = element.getBoundingClientRect();
        const center = bounds.top + bounds.height / 2;
        const distance = Math.abs(center - viewportCenter);
        if (distance < closestDistance) {
          closestIndex = index;
          closestDistance = distance;
        }
      });
      setActiveStep(closestIndex);
    };
    const observer = new IntersectionObserver(updateActiveStep, {
      rootMargin: "-30% 0px -35% 0px",
      threshold: [0.1, 0.35, 0.6],
    });
    stepRefs.current.forEach((element) => {
      if (element) observer.observe(element);
    });
    window.addEventListener("scroll", updateActiveStep, { passive: true });
    updateActiveStep();
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", updateActiveStep);
    };
  }, []);

  const setStepRef = (index: number) => (element: HTMLElement | null) => {
    stepRefs.current[index] = element;
  };

  return (
    <section
      id="how"
      ref={ref}
      className={`showcase-reveal mx-auto max-w-7xl scroll-mt-24 px-5 pb-24 pt-10 sm:px-8 sm:pb-32 ${
        isInView ? "is-visible" : ""
      }`}
    >
      <div className="mb-10 max-w-3xl">
        <Badge className="border-indigo-300/25 bg-indigo-300/8 text-indigo-200">
          {demoDataLabel}
        </Badge>
        <h2 className="mt-5 text-3xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">
          How it works
        </h2>
        <p className="mt-4 text-base leading-7 text-slate-400">
          {showcaseScenarioSteps.length} local fixtures show why identity, a previous approval, or a
          single score should never end an investigation.
        </p>
      </div>

      <div className="mb-10 grid gap-3 md:grid-cols-3">
        {showcaseScenarioSteps.map((step, index) => (
          <Card
            className={`showcase-reveal rounded-xl border-white/8 bg-white/[0.025] p-4 text-sm leading-relaxed text-slate-300 shadow-none ${
              isInView ? "is-visible" : ""
            }`}
            key={step.id}
            style={{ transitionDelay: `${index * 70}ms` }}
          >
            {step.problem}
          </Card>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-14">
        <div className="space-y-4">
          {showcaseScenarioSteps.map((step, index) => (
            <article
              aria-current={activeStep === index ? "step" : undefined}
              className={`showcase-reveal rounded-2xl border p-5 transition-colors ${
                isInView ? "is-visible" : ""
              } ${
                activeStep === index
                  ? "border-indigo-300/30 bg-indigo-300/[0.06]"
                  : "border-white/8 bg-white/[0.02]"
              }`}
              data-step-index={index}
              id={
                step.id === "trusted-sender"
                  ? "trusted-sender"
                  : step.id === "link-drift"
                    ? "approvals"
                    : undefined
              }
              key={step.id}
              ref={setStepRef(index)}
              style={{ transitionDelay: `${index * 70}ms` }}
            >
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-indigo-200">
                {step.eyebrow}
              </p>
              <h3 className="mt-3 text-xl font-semibold text-white">{step.title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-400">{step.description}</p>
              <Button
                className="mt-4 h-auto px-0 text-indigo-200 hover:bg-transparent hover:text-indigo-100"
                onClick={() => setActiveStep(index)}
                variant="ghost"
              >
                Show scenario <ArrowDownRight aria-hidden="true" />
              </Button>
              <Button
                asChild
                className="mt-4 ml-3 h-auto px-0 text-indigo-200 hover:bg-transparent hover:text-indigo-100"
                variant="link"
              >
                <Link to="/dashboard" search={{ scenario: step.id }}>
                  Open in dashboard
                </Link>
              </Button>
            </article>
          ))}
        </div>

        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
              Local scenario preview
            </p>
            <Badge className="border-white/10 bg-white/[0.04] text-slate-300">
              {showcaseScenarioSteps[activeStep]?.title}
            </Badge>
          </div>
          <div aria-live="polite">
            <ScenarioPanel activeStep={activeStep} />
          </div>
          <p className="mt-4 rounded-xl border border-white/8 bg-white/[0.02] px-4 py-3 text-xs leading-relaxed text-slate-400">
            Approval records a decision only. No external action is executed.
          </p>
        </div>
      </div>
    </section>
  );
}
