import { Link } from "@tanstack/react-router";
import { ArrowDown, ArrowRight, Check, CircleAlert, Shield, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useDemoStore } from "@/lib/store";

export function ShowcaseHero() {
  const { demoDataLabel, demoIncidents, senderBaselineFixture } = useDemoStore();
  const incident = demoIncidents.trustedSender;

  return (
    <section className="px-4 pb-14 pt-10 sm:px-8 sm:pb-20 sm:pt-14">
      <div className="mx-auto max-w-5xl">
        <div className="max-w-3xl">
          <Badge className="gap-1.5 border-status-analysis/30 bg-status-analysis/10 text-status-analysis">
            <Shield aria-hidden="true" className="size-3.5" />
            Offline analyst workspace
          </Badge>
          <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-tight text-foreground sm:text-6xl">
            Phishing triage that stays suspicious of trusted senders
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
            Deterministic, offline analysis for phishing incidents. Analysts review every verdict,
            every disagreement and every approval that expires.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Button asChild>
              <Link search={{ scenario: undefined }} to="/dashboard">
                Open dashboard <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <a href="#how">
                View demo scenarios <ArrowDown aria-hidden="true" />
              </a>
            </Button>
            <Button asChild className="px-0" variant="link">
              <Link to="/hurdle/trusted-sender">Read the Trusted Sender hurdle</Link>
            </Button>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            No live threat scanning. No response actions are executed.
          </p>
        </div>

        <Card className="mt-10 overflow-hidden rounded-md border-border bg-card shadow-none">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <ShieldCheck aria-hidden="true" className="size-4 text-status-analysis" />
              Analyst workspace preview
            </div>
            <Badge className="gap-1.5 border-status-analysis/30 bg-status-analysis/10 text-status-analysis">
              <CircleAlert aria-hidden="true" className="size-3" />
              {demoDataLabel}
            </Badge>
          </div>
          <div className="grid gap-4 p-4 md:grid-cols-[1.3fr_0.7fr] md:p-5">
            <Card className="rounded-sm border-border bg-background p-4 shadow-none">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-xs text-muted-foreground">{incident.id}</p>
                  <h2 className="mt-2 text-base font-semibold">{incident.subject}</h2>
                  <p className="mt-1 break-all text-sm text-muted-foreground">{incident.sender}</p>
                </div>
                <Badge className="border-status-invalid/30 bg-status-invalid/10 text-status-invalid">
                  <CircleAlert aria-hidden="true" className="mr-1 size-3" />
                  {incident.risk.toUpperCase()} risk
                </Badge>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="border-l-2 border-border pl-3">
                  <p className="text-xs text-muted-foreground">Prior benign emails</p>
                  <p className="mt-1 font-mono text-2xl font-semibold tabular-nums">
                    {senderBaselineFixture.sampleSize}
                  </p>
                </div>
                <div className="border-l-2 border-border pl-3">
                  <p className="text-xs text-muted-foreground">Incident status</p>
                  <p className="mt-2 text-sm font-medium capitalize">{incident.status}</p>
                </div>
              </div>
              <ul className="mt-4 flex flex-wrap gap-2">
                {incident.authChecks.map((check) => (
                  <li
                    className="inline-flex items-center gap-1.5 rounded-sm border border-status-valid/30 px-2 py-1 text-xs text-status-valid"
                    key={check.name}
                  >
                    <Check aria-hidden="true" className="size-3" />
                    {check.name}: {check.status}
                  </li>
                ))}
              </ul>
            </Card>

            <Card className="rounded-sm border-border bg-background p-4 shadow-none">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Shield aria-hidden="true" className="size-4 text-status-analysis" />
                Trusted sender behavior
              </div>
              <div className="mt-4 border-l-2 border-status-invalid px-3 py-2">
                <p className="text-sm font-semibold">{incident.banner}</p>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  A familiar sender can still behave unusually. This is a local demo fixture, not a
                  live scan.
                </p>
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 text-xs">
                <span className="text-muted-foreground">New link domain</span>
                <span className="break-all font-mono">{incident.newLinkDomain}</span>
              </div>
            </Card>
          </div>
          <div className="border-t border-border px-4 py-3 text-xs text-muted-foreground">
            Approval records a decision only. No external action is executed.
          </div>
        </Card>
      </div>
    </section>
  );
}
