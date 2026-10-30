import { useState } from "react";
import { AlertTriangle, Check, Copy, RefreshCw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import type { DemoApprovalFixture } from "@/data/demo/approvals";
import type { DemoDecision } from "@/lib/store";
import type { ApprovalDecision } from "@/lib/types";

interface ApprovalWorkflowProps {
  incidentId: string;
  approval: DemoApprovalFixture;
  decision: DemoDecision | undefined;
  simulatedTime: Date;
  requiresJustification: boolean;
  minimumJustificationLength: number;
  formatSimulatedTime: (timestamp: string) => string;
  onRecordDecision: (
    incidentId: string,
    decision: ApprovalDecision,
    justification?: string,
  ) => void;
  onRecheck: (incidentId: string) => { changed: boolean; fingerprint: string };
}

export function ApprovalWorkflow({
  incidentId,
  approval,
  decision,
  simulatedTime,
  requiresJustification,
  minimumJustificationLength,
  formatSimulatedTime,
  onRecordDecision,
  onRecheck,
}: ApprovalWorkflowProps) {
  const [justification, setJustification] = useState("");
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const justificationIsValid = justification.trim().length >= minimumJustificationLength;
  const remainingMinutes = Math.max(
    0,
    Math.ceil((Date.parse(approval.expiresAt) - simulatedTime.getTime()) / 60_000),
  );

  const handleDecision = (value: ApprovalDecision) => {
    setError("");
    try {
      onRecordDecision(incidentId, value, justification);
      setFeedback(value === "approved" ? "Approval recorded." : "Rejection recorded.");
    } catch (decisionError) {
      setError(
        decisionError instanceof Error ? decisionError.message : "The decision could not be saved.",
      );
    }
  };

  const handleRecheck = () => {
    setError("");
    try {
      const result = onRecheck(incidentId);
      setFeedback(
        result.changed
          ? "Evidence changed. The previous approval is invalidated."
          : "Evidence unchanged. No network scan was performed.",
      );
    } catch (recheckError) {
      setError(
        recheckError instanceof Error
          ? recheckError.message
          : "The evidence could not be re-checked.",
      );
    }
  };

  const copyFingerprint = async () => {
    try {
      await navigator.clipboard.writeText(approval.fingerprint);
      setFeedback("Fingerprint copied.");
      setError("");
    } catch {
      setError("Clipboard access is unavailable in this browser.");
    }
  };

  return (
    <Card className="rounded-sm shadow-none">
      <CardHeader className="border-b border-border p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-sm">Approval and analyst decision</CardTitle>
          <Badge className="border-status-analysis/30 bg-status-analysis/10 text-status-analysis">
            Demo data
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 p-4">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span>Approval state:</span>
          <Badge
            className={
              approval.state === "valid"
                ? "gap-1 border-status-valid/30 bg-status-valid/10 text-status-valid"
                : approval.state === "invalidated" || approval.state === "stale"
                  ? "gap-1 border-status-escalated/30 bg-status-escalated/10 text-status-escalated"
                  : "border-border bg-secondary text-secondary-foreground"
            }
          >
            {(approval.state === "stale" || approval.state === "invalidated") && (
              <AlertTriangle aria-hidden="true" className="size-3" />
            )}
            {approval.state}
          </Badge>
          {approval.state === "valid" && (
            <span className="text-xs text-muted-foreground">
              {remainingMinutes > 0
                ? `${remainingMinutes} simulated minutes remaining`
                : "Expired at "}
              {remainingMinutes === 0 && formatSimulatedTime(approval.expiresAt)}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="break-all font-mono text-xs text-muted-foreground">
            Fingerprint: {approval.fingerprint}
          </span>
          <Button
            aria-label="Copy evidence fingerprint"
            onClick={() => void copyFingerprint()}
            size="icon"
            variant="ghost"
          >
            <Copy aria-hidden="true" />
          </Button>
          <Button onClick={handleRecheck} size="sm" variant="outline">
            <RefreshCw aria-hidden="true" />
            Re-check local evidence
          </Button>
        </div>

        {decision && (
          <div className="border-l-2 border-border pl-3 text-sm">
            <p>
              Latest decision: <span className="font-medium">{decision.decision}</span> ·{" "}
              {formatSimulatedTime(decision.decidedAt)}
            </p>
            {decision.justification && (
              <p className="mt-1 text-muted-foreground">{decision.justification}</p>
            )}
          </div>
        )}

        {requiresJustification && (
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor={`justification-${incidentId}`}>
              Analyst justification
            </label>
            <Textarea
              aria-describedby={`justification-help-${incidentId}`}
              id={`justification-${incidentId}`}
              onChange={(event) => setJustification(event.target.value)}
              placeholder="Explain why this decision is appropriate."
              value={justification}
            />
            <p className="text-xs text-muted-foreground" id={`justification-help-${incidentId}`}>
              At least {minimumJustificationLength} characters are required before approving.
            </p>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <Button
            disabled={requiresJustification && !justificationIsValid}
            onClick={() => handleDecision("approved")}
          >
            <Check aria-hidden="true" />
            Approve
          </Button>
          <Button onClick={() => handleDecision("rejected")} variant="outline">
            Reject
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Approval records a decision only. No external action is executed.
        </p>
        {feedback && (
          <p aria-live="polite" className="text-sm text-status-valid">
            {feedback}
          </p>
        )}
        {error && (
          <p aria-live="assertive" className="text-sm text-status-invalid">
            {error}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
