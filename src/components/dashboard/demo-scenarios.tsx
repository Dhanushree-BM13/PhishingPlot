import { useEffect, useState } from "react";
import { AlertTriangle, ArrowRight, ShieldAlert } from "lucide-react";
import { Link } from "@tanstack/react-router";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useDemoStore } from "@/lib/store";

export type DemoScenarioId = "trusted-sender" | "link-drift" | "analyzer-dissent";

export function DemoScenarios({ activeScenario }: { activeScenario?: DemoScenarioId }) {
  const store = useDemoStore();
  const [selectedScenario, setSelectedScenario] = useState<DemoScenarioId | undefined>(
    activeScenario,
  );
  useEffect(() => setSelectedScenario(activeScenario), [activeScenario]);

  const selected = store.showcaseScenarioSteps.find((step) => step.id === selectedScenario);
  const linkIncident = store.incidents.find(
    (incident) => incident.id === store.demoIncidents.linkDrift.id,
  );
  const linkApproval = store.approvals.find(
    (approval) => approval.incidentId === store.demoIncidents.linkDrift.id,
  );
  const dissentVerdicts = store.analyzerVerdicts.filter(
    (verdict) => verdict.incidentId === store.demoIncidents.analyzerDissent.id,
  );

  return (
    <section aria-labelledby="demo-scenarios-title" className="mt-8 space-y-5">
      <header>
        <Badge className="border-status-analysis/30 bg-status-analysis/10 text-status-analysis">
          {store.demoDataLabel}
        </Badge>
        <h2 className="mt-3 text-xl font-semibold" id="demo-scenarios-title">
          Walk through a demo scenario
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Fixture-backed case studies. Decisions stay local and do not execute external actions.
        </p>
      </header>

      <div className="grid gap-3 md:grid-cols-3">
        {store.showcaseScenarioSteps.map((step) => (
          <button
            aria-pressed={selectedScenario === step.id}
            className={`rounded-sm border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              selectedScenario === step.id
                ? "border-primary/50 bg-primary/10"
                : "border-border bg-card hover:bg-secondary/50"
            }`}
            key={step.id}
            onClick={() => setSelectedScenario(step.id)}
            type="button"
          >
            <span className="block text-xs font-medium text-muted-foreground">{step.eyebrow}</span>
            <span className="mt-2 block font-semibold">{step.title}</span>
            <span className="mt-2 block text-sm text-muted-foreground">{step.problem}</span>
          </button>
        ))}
      </div>

      {selected && (
        <Card className="space-y-4 rounded-sm p-5 shadow-none">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-mono text-xs text-muted-foreground">
                {selectedScenario === "trusted-sender"
                  ? store.demoIncidents.trustedSender.id
                  : selectedScenario === "link-drift"
                    ? store.demoIncidents.linkDrift.id
                    : store.demoIncidents.analyzerDissent.id}
              </p>
              <h3 className="mt-2 text-lg font-semibold">{selected.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{selected.description}</p>
            </div>
            {selectedScenario === "trusted-sender" ? (
              <Link
                className="inline-flex items-center gap-2 text-sm text-status-analysis underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                to="/hurdle/trusted-sender"
              >
                Open case <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
            ) : (
              <Link
                className="inline-flex items-center gap-2 text-sm text-status-analysis underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                params={{
                  id:
                    selectedScenario === "link-drift"
                      ? store.demoIncidents.linkDrift.id
                      : store.demoIncidents.analyzerDissent.id,
                }}
                to="/incidents/$id"
              >
                Open case <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
            )}
          </div>

          {selectedScenario === "trusted-sender" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <p className="border border-border p-3 text-sm">
                Prior benign messages:{" "}
                <span className="font-mono tabular-nums">
                  {store.senderBaselineFixture.sampleSize}
                </span>
              </p>
              <p className="border border-border p-3 text-sm">
                Final risk: <span className="font-semibold text-status-invalid">HIGH</span>
              </p>
            </div>
          )}

          {selectedScenario === "link-drift" && (
            <div className="space-y-3">
              <p className="break-all font-mono text-sm">{store.linkObservationFixture.url}</p>
              <p className="text-sm">
                Approval: <span className="font-medium">{linkApproval?.state ?? "none"}</span>
                {" · "}
                Incident: <span className="font-medium">{linkIncident?.status ?? "unknown"}</span>
              </p>
              {store.elapsedMinutes < store.linkObservationFixture.recheckAfterMinutes && (
                <Button
                  onClick={() =>
                    store.advanceSimulatedTime(
                      store.linkObservationFixture.recheckAfterMinutes - store.elapsedMinutes,
                    )
                  }
                  variant="outline"
                >
                  Advance to fixture re-check point
                </Button>
              )}
              {store.elapsedMinutes >= store.linkObservationFixture.recheckAfterMinutes && (
                <Alert className="border-status-invalid/30 bg-status-invalid/5">
                  <ShieldAlert aria-hidden="true" className="size-4 text-status-invalid" />
                  <AlertTitle>Approval invalidated · Needs re-review</AlertTitle>
                  <AlertDescription>
                    {store.linkObservationFixture.invalidatedMessage}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {selectedScenario === "analyzer-dissent" && (
            <div className="space-y-3">
              <Alert className="border-status-escalated/30 bg-status-escalated/5">
                <AlertTriangle aria-hidden="true" className="size-4 text-status-escalated" />
                <AlertTitle>{store.analyzerVerdictFixture.disagreement.message}</AlertTitle>
                <AlertDescription>
                  Keep each fixture verdict visible for analyst review.
                </AlertDescription>
              </Alert>
              <ul className="grid gap-3 sm:grid-cols-2">
                {dissentVerdicts.map((verdict) => (
                  <li className="border border-border p-3" key={verdict.id}>
                    <p className="font-mono text-sm">{verdict.analyzerId}</p>
                    <p className="mt-1 text-sm font-medium">
                      {verdict.level.toUpperCase()} · {verdict.score}/100
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">{verdict.rationale}</p>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-muted-foreground">
                Analyst decision workflow is not implemented.
              </p>
            </div>
          )}
        </Card>
      )}
    </section>
  );
}
