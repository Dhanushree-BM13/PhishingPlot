import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, ArrowLeft, ShieldAlert } from "lucide-react";

import { ApprovalWorkflow } from "@/components/incidents/approval-workflow";
import { BaselineCompare } from "@/components/hurdle/baseline-compare";
import { EmailPreview } from "@/components/hurdle/email-preview";
import { OutcomeBanner } from "@/components/hurdle/outcome-banner";
import { SignalBars } from "@/components/hurdle/signal-bars";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDemoStore } from "@/lib/store";

export const Route = createFileRoute("/_console/incidents/$id")({
  head: () => ({ meta: [{ title: "Incident review — PHISHPILOT" }] }),
  component: IncidentDetail,
});

function IncidentDetail() {
  const { id } = Route.useParams();
  const store = useDemoStore();
  const incident = store.incidents.find((item) => item.id === id);

  if (!incident) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Incident not found</h1>
        <p className="text-sm text-muted-foreground">This ID is not in the local demo data.</p>
        <Button asChild variant="outline">
          <Link to="/incidents">
            <ArrowLeft aria-hidden="true" /> Back to incidents
          </Link>
        </Button>
      </div>
    );
  }

  const approval = store.approvals.find((entry) => entry.incidentId === incident.id);
  const audit = store.auditEvents.filter((event) => event.incidentId === incident.id);
  const decision = [...store.decisions].reverse().find((entry) => entry.incidentId === incident.id);
  const trustedSender = incident.id === store.demoIncidents.trustedSender.id;
  const hasDisagreement =
    incident.id === store.demoIncidents.analyzerDissent.id &&
    store.analyzerVerdictFixture.disagreement.detected;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-5">
        <div className="min-w-0">
          <p className="font-mono text-xs text-muted-foreground">{incident.id}</p>
          <h1 className="mt-1 break-words text-2xl font-semibold">{incident.subject}</h1>
          <p className="mt-2 break-all font-mono text-sm text-muted-foreground">
            {incident.sender}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Received {store.formatSimulatedTime(incident.receivedAt)} · Demo analyst
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge className="gap-1 border-status-invalid/30 bg-status-invalid/10 text-status-invalid">
            <ShieldAlert aria-hidden="true" className="size-3" />
            Final risk: {incident.risk.toUpperCase()}
          </Badge>
          <Badge className="border-border bg-secondary text-secondary-foreground">
            {incident.status}
          </Badge>
          <Badge className="border-status-analysis/30 bg-status-analysis/10 text-status-analysis">
            {store.demoDataLabel}
          </Badge>
        </div>
      </header>

      {hasDisagreement && (
        <Alert className="rounded-sm border-status-escalated/40 bg-status-escalated/5">
          <AlertTriangle aria-hidden="true" className="size-4 text-status-escalated" />
          <AlertTitle>Analysts disagree</AlertTitle>
          <AlertDescription>
            {store.analyzerVerdictFixture.disagreement.message} Approval requires a written
            justification.
          </AlertDescription>
        </Alert>
      )}

      {trustedSender ? (
        <>
          <div className="grid items-start gap-5 lg:grid-cols-2">
            <EmailPreview
              demoIncidents={store.demoIncidents}
              trustedSenderCaseFixture={store.trustedSenderCaseFixture}
            />
            <div className="space-y-5">
              <BaselineCompare
                senderBaselineFixture={store.senderBaselineFixture}
                trustedSenderCaseFixture={store.trustedSenderCaseFixture}
              />
              <SignalBars trustedSenderCaseFixture={store.trustedSenderCaseFixture} />
              <OutcomeBanner demoIncidents={store.demoIncidents} />
            </div>
          </div>
        </>
      ) : (
        <Card className="rounded-sm shadow-none">
          <CardContent className="space-y-2 p-5">
            <p className="text-sm font-medium">Incident fixture summary</p>
            <p className="text-sm text-muted-foreground">
              {incident.id === store.demoIncidents.linkDrift.id
                ? store.linkObservationFixture.observations[0].note
                : store.analyzerVerdictFixture.disagreement.message}
            </p>
            {incident.id === store.demoIncidents.linkDrift.id && (
              <p className="text-xs text-muted-foreground">
                Simulated local intelligence, not live scanning.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {store.analyzerVerdicts.some((verdict) => verdict.incidentId === incident.id) && (
        <Card className="rounded-sm shadow-none">
          <CardHeader className="border-b border-border p-4">
            <CardTitle className="text-sm">Analyzer verdicts</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 p-4 sm:grid-cols-2">
            {store.analyzerVerdicts
              .filter((verdict) => verdict.incidentId === incident.id)
              .map((verdict) => (
                <div className="border border-border p-3" key={verdict.id}>
                  <p className="text-sm font-medium">{verdict.analyzerId}</p>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">
                    {verdict.level} · {verdict.score}/100 · {Math.round(verdict.confidence * 100)}%
                    confidence
                  </p>
                  <p className="mt-2 text-sm leading-5">{verdict.rationale}</p>
                  <p className="mt-2 font-mono text-xs text-muted-foreground">
                    Signals: {verdict.signalIds.join(", ")}
                  </p>
                </div>
              ))}
          </CardContent>
        </Card>
      )}

      {approval ? (
        <ApprovalWorkflow
          approval={approval}
          decision={decision}
          formatSimulatedTime={store.formatSimulatedTime}
          incidentId={incident.id}
          minimumJustificationLength={
            store.demoIncidents.analyzerDissent.minimumJustificationLength
          }
          onRecordDecision={store.recordDecision}
          onRecheck={store.recheckIncident}
          requiresJustification={hasDisagreement}
          simulatedTime={store.simulatedTime}
        />
      ) : (
        <Card className="rounded-sm shadow-none">
          <CardContent className="p-4 text-sm text-muted-foreground">
            No approval fixture is available for this incident.
          </CardContent>
        </Card>
      )}

      <Card className="rounded-sm shadow-none">
        <CardHeader className="border-b border-border p-4">
          <CardTitle className="text-sm">Incident timeline</CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-border p-0">
          {[...audit]
            .sort((left, right) => left.timestamp.localeCompare(right.timestamp))
            .map((event) => (
              <div className="grid gap-2 px-4 py-3 sm:grid-cols-[11rem_12rem_1fr]" key={event.id}>
                <time className="font-mono text-xs text-muted-foreground">
                  {store.formatSimulatedTime(event.timestamp)}
                </time>
                <span className="text-xs font-medium">{event.type}</span>
                <p className="text-sm">{event.detail}</p>
              </div>
            ))}
        </CardContent>
      </Card>
    </div>
  );
}
