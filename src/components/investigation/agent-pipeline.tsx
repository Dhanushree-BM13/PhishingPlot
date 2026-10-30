import { useEffect, useState } from "react";
import { Bot, Check, CircleAlert, Database, Loader2, ShieldCheck, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  cyberguardApi,
  type InvestigationAgent,
  type InvestigationAuditEntry,
  type RecommendedAction,
} from "@/lib/cyberguard-api";
import { useReducedMotion } from "@/lib/motion";

const STEP_MS = 650;

export function AgentPipeline({ agents }: { agents: InvestigationAgent[] }) {
  const reducedMotion = useReducedMotion();
  const [revealed, setRevealed] = useState(reducedMotion ? agents.length : 0);

  useEffect(() => {
    if (reducedMotion) {
      setRevealed(agents.length);
      return;
    }
    setRevealed(0);
    const timers = agents.map((_, index) =>
      window.setTimeout(() => setRevealed(index + 1), (index + 1) * STEP_MS),
    );
    return () => timers.forEach(window.clearTimeout);
  }, [agents, reducedMotion]);

  return (
    <Card className="cg-panel">
      <CardHeader className="border-b border-white/5">
        <CardTitle className="flex items-center justify-between gap-2 text-sm">
          <span className="flex items-center gap-2">
            <Bot aria-hidden="true" className="size-4 text-primary" />
            Multi-agent investigation
          </span>
          <span className="font-mono text-[0.65rem] text-muted-foreground">
            Orchestrator · shared case record
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 p-4 md:grid-cols-2 2xl:grid-cols-4">
        {agents.map((agent, index) => {
          const done = index < revealed;
          const running = index === revealed;
          const failed = done && agent.status === "failed";
          return (
            <article
              aria-busy={running}
              className={`cg-agent-card ${running ? "is-running" : ""} ${done && !failed ? "is-complete" : ""}`}
              key={agent.id}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-mono text-[0.65rem] text-muted-foreground">
                  STEP {index + 1}
                </span>
                <Badge
                  className={`cg-agent-status status-${done ? agent.status : running ? "running" : "queued"}`}
                >
                  {done ? agent.status : running ? "running" : "queued"}
                </Badge>
              </div>
              <p className="mt-3 text-sm font-semibold">{agent.name}</p>
              <p className="mt-1 text-xs text-muted-foreground">{agent.task}</p>
              {done && (
                <div className="agent-result mt-3 space-y-2">
                  <ul className="space-y-1.5 text-xs leading-relaxed">
                    {agent.evidence.map((item) => (
                      <li className="border-l border-primary/30 pl-2 break-words" key={item}>
                        {item}
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {failed && (
                      <CircleAlert
                        aria-hidden="true"
                        className="mr-1 inline size-3.5 text-status-invalid"
                      />
                    )}
                    {agent.reasoning}
                  </p>
                  <div className="flex items-center justify-between font-mono text-[0.65rem] text-muted-foreground">
                    <span>Confidence {Math.round(agent.confidence * 100)}%</span>
                    <span>{agent.durationMs} ms</span>
                  </div>
                  <div className="cg-progress-track" aria-hidden="true">
                    <span style={{ width: `${Math.round(agent.confidence * 100)}%` }} />
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </CardContent>
    </Card>
  );
}

type Decision = { status: "approved" | "rejected"; at: string };

export function ActionApprovals({
  actions,
  investigationId,
}: {
  actions: RecommendedAction[];
  investigationId?: string | undefined;
}) {
  const [decisions, setDecisions] = useState<Record<string, Decision>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [storedAudit, setStoredAudit] = useState<InvestigationAuditEntry[] | null>(null);
  const persisted = Boolean(investigationId);

  useEffect(() => {
    setDecisions({});
    setError("");
    setStoredAudit(null);
    if (!investigationId) return;
    void cyberguardApi
      .investigationAudit(investigationId)
      .then(setStoredAudit)
      .catch(() => setStoredAudit(null));
  }, [actions, investigationId]);

  const decide = async (action: RecommendedAction, status: Decision["status"]) => {
    setError("");
    if (investigationId && action.recordId) {
      setSaving(action.id);
      try {
        const saved = await cyberguardApi.decideAction(investigationId, action.recordId, status);
        setDecisions((current) => ({
          ...current,
          [action.id]: { status, at: saved.decidedAt ?? new Date().toISOString() },
        }));
        setStoredAudit(await cyberguardApi.investigationAudit(investigationId));
      } catch (decisionError) {
        setError(
          decisionError instanceof Error ? decisionError.message : "The decision was not saved.",
        );
      } finally {
        setSaving(null);
      }
      return;
    }
    setDecisions((current) => ({
      ...current,
      [action.id]: { status, at: new Date().toISOString() },
    }));
  };
  const log = Object.entries(decisions);

  return (
    <Card className="cg-panel">
      <CardHeader className="border-b border-white/5">
        <CardTitle className="flex items-center justify-between gap-2 text-sm">
          <span className="flex items-center gap-2">
            <ShieldCheck aria-hidden="true" className="size-4 text-primary" />
            Human approval gate
          </span>
          <Badge className="cg-badge-warning">NOTHING RUNS WITHOUT APPROVAL</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 p-4">
        {actions.map((action) => {
          const decision = decisions[action.id];
          return (
            <div
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/5 p-3"
              key={action.id}
            >
              <div className="min-w-0">
                <p className="text-sm font-medium">{action.title}</p>
                <p className="break-all font-mono text-xs text-primary/80">{action.target}</p>
                <p className="mt-1 text-xs text-muted-foreground">{action.impact}</p>
              </div>
              {decision ? (
                <Badge
                  className={decision.status === "approved" ? "cg-badge-live" : "cg-badge-critical"}
                >
                  {decision.status === "approved" ? "APPROVED · SIMULATED" : "REJECTED"}
                </Badge>
              ) : (
                <div className="flex gap-2">
                  <Button
                    disabled={saving !== null}
                    onClick={() => void decide(action, "approved")}
                    size="sm"
                    variant="outline"
                  >
                    {saving === action.id ? (
                      <Loader2 aria-hidden="true" className="animate-spin" />
                    ) : (
                      <Check aria-hidden="true" />
                    )}
                    Approve
                  </Button>
                  <Button
                    disabled={saving !== null}
                    onClick={() => void decide(action, "rejected")}
                    size="sm"
                    variant="outline"
                  >
                    <X aria-hidden="true" /> Reject
                  </Button>
                </div>
              )}
            </div>
          );
        })}
        {error && (
          <p className="text-xs text-status-invalid" role="alert">
            {error}
          </p>
        )}
        {persisted && storedAudit && (
          <div className="border-t border-white/5 pt-3">
            <p className="cg-eyebrow flex items-center gap-2">
              <Database aria-hidden="true" className="size-3" /> Audit trail · stored in Supabase
            </p>
            <ul className="mt-2 space-y-1 font-mono text-[0.7rem] text-muted-foreground">
              {storedAudit.map((entry) => (
                <li key={`${entry.at}-${entry.event}`}>
                  {entry.at.slice(11, 19)} UTC · {entry.event} · {entry.detail}
                </li>
              ))}
            </ul>
          </div>
        )}
        {!persisted && log.length > 0 && (
          <div className="border-t border-white/5 pt-3">
            <p className="cg-eyebrow">AUDIT TRAIL</p>
            <ul className="mt-2 space-y-1 font-mono text-[0.7rem] text-muted-foreground">
              {log.map(([id, decision]) => (
                <li key={id}>
                  {decision.at.slice(11, 19)} UTC · analyst {decision.status} ·{" "}
                  {actions.find((action) => action.id === id)?.title} · no external action executed
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
