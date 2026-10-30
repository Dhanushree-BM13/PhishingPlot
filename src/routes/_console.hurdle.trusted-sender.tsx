import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, ShieldAlert } from "lucide-react";

import { BaselineCompare } from "@/components/hurdle/baseline-compare";
import { EmailPreview } from "@/components/hurdle/email-preview";
import { LinkDriftTimeline } from "@/components/hurdle/link-drift-timeline";
import { OutcomeBanner } from "@/components/hurdle/outcome-banner";
import { SignalBars } from "@/components/hurdle/signal-bars";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSectionReveal } from "@/lib/motion";
import { useDemoStore } from "@/lib/store";

export const Route = createFileRoute("/_console/hurdle/trusted-sender")({
  head: () => ({ meta: [{ title: "Trusted sender turns — PHISHPILOT" }] }),
  component: TrustedSenderHurdle,
});

function RevealSection({ children }: { children: React.ReactNode }) {
  const { ref, visible } = useSectionReveal<HTMLDivElement>();
  return (
    <div className="section-reveal border-t border-border py-8" data-visible={visible} ref={ref}>
      {children}
    </div>
  );
}

function TrustedSenderHurdle() {
  const store = useDemoStore();
  const incident = store.demoIncidents.trustedSender;
  const brief =
    "The hardest phishing comes from a real partner whose mailbox was hacked. It replies inside a genuine thread and passes every authentication check. And a link that was clean when you checked it can turn malicious an hour later.";

  return (
    <article className="mx-auto max-w-6xl">
      <header className="border-b border-border pb-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-status-analysis">
              Security case study
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              The Trusted Sender Turns
            </h1>
          </div>
          <Badge className="gap-1.5 border-status-analysis/30 bg-status-analysis/10 text-status-analysis">
            <ShieldAlert aria-hidden="true" className="size-3.5" />
            {store.demoDataLabel}
          </Badge>
        </div>
      </header>

      <RevealSection>
        <p className="font-mono text-xs uppercase tracking-wider text-status-analysis">
          01 · Brief
        </p>
        <p className="mt-3 max-w-4xl text-lg leading-8 text-foreground">{brief}</p>
        <ol className="mt-6 divide-y divide-border border-y border-border">
          {store.showcaseScenarioSteps.map((step, index) => (
            <li className="grid gap-2 py-4 sm:grid-cols-[3rem_1fr]" key={step.id}>
              <span className="font-mono text-sm tabular-nums text-muted-foreground">
                {String(index + 1).padStart(2, "0")}
              </span>
              <p className="text-sm leading-6">{step.problem}</p>
            </li>
          ))}
        </ol>
      </RevealSection>

      <RevealSection>
        <p className="font-mono text-xs uppercase tracking-wider text-status-analysis">
          02 · The case
        </p>
        <h2 className="mt-2 text-xl font-semibold">A familiar message with unfamiliar behavior</h2>
        <div className="mt-5 grid items-start gap-5 lg:grid-cols-[1.05fr_0.95fr]">
          <EmailPreview
            demoIncidents={store.demoIncidents}
            trustedSenderCaseFixture={store.trustedSenderCaseFixture}
          />
          <div className="min-w-0 space-y-5">
            <BaselineCompare
              senderBaselineFixture={store.senderBaselineFixture}
              trustedSenderCaseFixture={store.trustedSenderCaseFixture}
            />
            <SignalBars trustedSenderCaseFixture={store.trustedSenderCaseFixture} />
            <OutcomeBanner demoIncidents={store.demoIncidents} />
          </div>
        </div>
      </RevealSection>

      <RevealSection>
        <LinkDriftTimeline
          demoIncidents={store.demoIncidents}
          linkObservationFixture={store.linkObservationFixture}
        />
      </RevealSection>

      <footer className="border-t border-border py-7">
        <p className="text-sm font-medium">
          Approval records a decision only. No external action is executed.
        </p>
        <Badge className="mt-3 border-status-analysis/30 bg-status-analysis/10 text-status-analysis">
          {store.demoDataLabel}
        </Badge>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild>
            <Link params={{ id: incident.id }} to="/incidents/$id">
              Open this incident in the dashboard <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link search={{ scenario: undefined }} to="/dashboard">
              <ArrowLeft aria-hidden="true" /> Back to scenarios
            </Link>
          </Button>
        </div>
      </footer>
    </article>
  );
}
