import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, ArrowUpRight, Check, Clock3, ShieldCheck, X } from "lucide-react";
import { toast } from "sonner";

import { BackendStatus } from "@/components/cyberguard/backend-status";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useDemoStore } from "@/lib/store";
import type { ApprovalDecision } from "@/lib/types";

export const Route = createFileRoute("/_console/approvals")({
  head: () => ({ meta: [{ title: "Human Approval Queue — PhishPilot" }] }),
  component: Approvals,
});

function Approvals() {
  const { incidents, approvals, recordDecision } = useDemoStore();
  const [selected, setSelected] = useState<{
    incidentId: string;
    decision: ApprovalDecision;
  } | null>(null);
  const [justification, setJustification] = useState("");
  const [saving, setSaving] = useState(false);
  const [decisionError, setDecisionError] = useState("");
  const pending = incidents.filter(
    (incident) =>
      !["approved", "rejected", "resolved"].includes(incident.status) &&
      approvals.some((approval) => approval.incidentId === incident.id),
  );
  const selectedIncident = selected
    ? incidents.find((incident) => incident.id === selected.incidentId)
    : undefined;
  const requiresJustification = selected?.incidentId === "DEMO-DISSENT-01";
  const minJustification = 15;

  const openConfirmation = (incidentId: string, decision: ApprovalDecision) => {
    setDecisionError("");
    setJustification("");
    setSelected({ incidentId, decision });
  };

  const confirmDecision = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (!selected || saving) return;
    if (requiresJustification && justification.trim().length < minJustification) {
      setDecisionError(
        `Please enter at least ${minJustification} characters to document this decision.`,
      );
      return;
    }

    setSaving(true);
    setDecisionError("");
    try {
      // Queue items are demo fixtures; their decisions live in the demo store and audit log.
      // Investigations from the Investigate page are approved there and saved to Supabase.
      recordDecision(selected.incidentId, selected.decision, justification.trim());
      toast.success(selected.decision === "approved" ? "Approval recorded" : "Rejection recorded", {
        description: "Logged in the audit trail. No mailbox action was performed.",
      });
      setSelected(null);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "The approval decision could not be recorded.";
      setDecisionError(message);
      toast.error("Decision not recorded", { description: message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="cg-page space-y-5">
      <header className="cg-page-heading">
        <div>
          <p className="cg-eyebrow">HUMAN-IN-THE-LOOP / ACTION REVIEW</p>
          <h1>Approval queue</h1>
          <p>Review supporting evidence and impact before confirming a proposed response.</p>
        </div>
        <BackendStatus />
      </header>

      <div className="cg-note">
        <ShieldCheck aria-hidden="true" className="size-4 shrink-0 text-primary" />
        <p>
          Response actions remain proposals. No message is blocked, quarantined, deleted, or sent by
          the local demo.
        </p>
      </div>

      <div className="grid gap-4">
        {pending.map((incident) => {
          const approval = approvals.find((item) => item.incidentId === incident.id);
          const danger = incident.risk === "critical" || incident.risk === "high";
          const action = danger
            ? "Hold message for security review"
            : "Release message to recipient";
          const evidence = incident.evidence?.slice(0, 3) ?? [
            `Risk assessment: ${incident.risk.toUpperCase()} · ${incident.riskScore}/100.`,
            `Current case state: ${incident.status.replaceAll("_", " ")}.`,
            "Synthetic evidence from the local demonstration fixture.",
          ];
          return (
            <Card className="cg-panel" key={incident.id}>
              <CardContent className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_16rem]">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={danger ? "cg-badge-critical" : "cg-badge-warning"}>
                      {incident.risk.toUpperCase()} · {incident.riskScore}
                    </Badge>
                    <Badge className="cg-badge-demo">SIMULATED</Badge>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {incident.id}
                    </span>
                  </div>
                  <Link
                    className="mt-3 inline-flex items-center gap-2 text-base font-semibold hover:text-primary"
                    params={{ id: incident.id }}
                    to="/incidents/$id"
                  >
                    {incident.subject}
                    <ArrowUpRight aria-hidden="true" className="size-4" />
                  </Link>
                  <p className="mt-1 break-all font-mono text-xs text-muted-foreground">
                    {incident.sender}
                  </p>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <section>
                      <h2 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Proposed response
                      </h2>
                      <p className="mt-2 text-sm">{action}</p>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                        {danger
                          ? "Prevents an unverified message from progressing in this demo scenario."
                          : "Allows a lower-risk sample to proceed after analyst review."}
                      </p>
                    </section>
                    <section>
                      <h2 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Supporting evidence
                      </h2>
                      <ul className="mt-2 space-y-1.5">
                        {evidence.map((item) => (
                          <li
                            className="flex gap-2 text-xs leading-relaxed text-muted-foreground"
                            key={item}
                          >
                            <span className="mt-1 size-1 shrink-0 rounded-full bg-primary" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </section>
                  </div>
                </div>
                <div className="flex flex-col justify-between gap-4 border-t border-white/5 pt-4 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
                  <div>
                    <p className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock3 aria-hidden="true" className="size-3.5" />
                      Approval record · {approval?.state ?? "pending"}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">Requested by Demo analyst</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      className="cg-decision-approve"
                      onClick={() => openConfirmation(incident.id, "approved")}
                      size="sm"
                    >
                      <Check aria-hidden="true" />
                      Approve
                    </Button>
                    <Button
                      className="cg-decision-reject"
                      onClick={() => openConfirmation(incident.id, "rejected")}
                      size="sm"
                      variant="outline"
                    >
                      <X aria-hidden="true" />
                      Reject
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {pending.length === 0 && (
          <Card className="cg-panel">
            <CardContent className="flex min-h-48 flex-col items-center justify-center text-center">
              <Check aria-hidden="true" className="size-8 text-status-valid" />
              <p className="mt-3 font-medium">Queue clear</p>
              <p className="mt-1 text-sm text-muted-foreground">
                No open demo incidents currently need a decision.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <AlertDialog
        onOpenChange={(open) => {
          if (!open && !saving) setSelected(null);
        }}
        open={Boolean(selected)}
      >
        <AlertDialogContent className="cg-panel">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle aria-hidden="true" className="size-4 text-status-escalated" />
              Confirm {selected?.decision === "approved" ? "approval" : "rejection"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedIncident?.subject ?? "This proposed response"} · {selectedIncident?.id ?? ""}
              <br />
              This records an analyst decision. The app will not perform a mailbox action.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {requiresJustification && (
            <label className="cg-field-label">
              Decision justification
              <Textarea
                onChange={(event) => setJustification(event.target.value)}
                placeholder={`At least ${minJustification} characters`}
                value={justification}
              />
            </label>
          )}
          {decisionError && (
            <p className="text-xs text-status-invalid" role="alert">
              {decisionError}
            </p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={
                selected?.decision === "rejected"
                  ? "bg-status-invalid text-white hover:bg-status-invalid"
                  : "cg-primary-button"
              }
              disabled={saving}
              onClick={(event) => void confirmDecision(event)}
            >
              {saving ? "Recording…" : "Confirm decision"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
