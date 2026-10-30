import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Bot, Check, CircleDot, Play, RotateCcw, ShieldCheck, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { BackendStatus } from "@/components/cyberguard/backend-status";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_console/agents")({
  head: () => ({ meta: [{ title: "AI Agent Network — PhishPilot" }] }),
  component: AgentNetwork,
});

const initialAgents = [
  {
    id: "triage",
    name: "Triage Agent",
    role: "Initial risk scoring",
    task: "Waiting for an investigation",
    findings: "Routes new messages by urgency and risk.",
  },
  {
    id: "investigation",
    name: "Investigation Agent",
    role: "Evidence collection",
    task: "Waiting for triage",
    findings: "Reviews sender, URLs, and message indicators.",
  },
  {
    id: "reviewer",
    name: "Risk Reviewer Agent",
    role: "Assessment validation",
    task: "Waiting for investigation",
    findings: "Checks evidence consistency and confidence.",
  },
  {
    id: "response",
    name: "Response Agent",
    role: "Response recommendation",
    task: "Waiting for risk review",
    findings: "Prepares recommendations for analyst approval.",
  },
] as const;

const workflowFindings = [
  "Demo message queued for risk triage.",
  "A lookalike sender and unfamiliar URL were found in the sample.",
  "High-risk indicators agree; a human should verify the evidence.",
  "Recommend holding the message for analyst review.",
];

interface AgentView {
  id: string;
  name: string;
  role: string;
  task: string;
  findings: string;
  status: string;
  progress: number;
}

function AgentNetwork() {
  const [agents, setAgents] = useState<AgentView[]>(
    initialAgents.map((agent) => ({ ...agent, status: "idle", progress: 0 })),
  );
  const [running, setRunning] = useState(false);
  const [completedRuns, setCompletedRuns] = useState(0);
  const intervalRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (intervalRef.current !== null) window.clearInterval(intervalRef.current);
    },
    [],
  );

  const runDemo = () => {
    if (running) return;
    if (intervalRef.current !== null) window.clearInterval(intervalRef.current);
    let activeIndex = 0;
    setRunning(true);
    setAgents(
      initialAgents.map((agent, index) => ({
        ...agent,
        status: index === 0 ? "running" : "queued",
        progress: index === 0 ? 18 : 0,
      })),
    );

    intervalRef.current = window.setInterval(() => {
      activeIndex += 1;
      if (activeIndex >= initialAgents.length) {
        if (intervalRef.current !== null) window.clearInterval(intervalRef.current);
        intervalRef.current = null;
        setRunning(false);
        setCompletedRuns((count) => count + 1);
        toast.success("Demo investigation complete", {
          description:
            "Four simulated agents completed their hand-offs. No real email was analyzed.",
        });
        return;
      }

      const currentIndex = activeIndex;
      setAgents(
        initialAgents.map((agent, index) => ({
          ...agent,
          status:
            index < currentIndex ? "completed" : index === currentIndex ? "running" : "queued",
          progress: index < currentIndex ? 100 : index === currentIndex ? 42 : 0,
          task:
            index < currentIndex
              ? "Handoff complete"
              : index === currentIndex
                ? `Running simulated ${agent.role.toLowerCase()}`
                : `Waiting for ${initialAgents[index - 1]?.name ?? "the previous agent"}`,
          findings:
            index < currentIndex ? (workflowFindings[index] ?? agent.findings) : agent.findings,
        })),
      );
    }, 850);
  };

  const reset = () => {
    if (intervalRef.current !== null) window.clearInterval(intervalRef.current);
    intervalRef.current = null;
    setRunning(false);
    setAgents(initialAgents.map((agent) => ({ ...agent, status: "idle", progress: 0 })));
  };

  return (
    <div className="cg-page space-y-5">
      <header className="cg-page-heading">
        <div>
          <p className="cg-eyebrow">ORCHESTRATION / MULTI-AGENT PIPELINE</p>
          <h1>AI agent network</h1>
          <p>Observe a transparent hand-off chain. Each run below is a deterministic simulation.</p>
        </div>
        <BackendStatus />
      </header>

      <section aria-label="Investigation agents" className="cg-agent-network">
        <svg
          aria-hidden="true"
          className="cg-agent-connections"
          preserveAspectRatio="none"
          viewBox="0 0 1000 180"
        >
          <path d="M140 90H860" />
          <path className={running ? "is-active" : ""} d="M140 90H860" />
        </svg>
        {agents.map((agent, index) => {
          const isComplete = agent.status === "completed";
          const isActive = agent.status === "running";
          return (
            <article
              aria-current={isActive ? "step" : undefined}
              className={`cg-agent-card ${isActive ? "is-running" : ""} ${isComplete ? "is-complete" : ""}`}
              key={agent.id}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="cg-agent-icon">
                  {isComplete ? (
                    <Check aria-hidden="true" />
                  ) : index === 2 ? (
                    <ShieldCheck aria-hidden="true" />
                  ) : (
                    <Bot aria-hidden="true" />
                  )}
                </span>
                <Badge className={`cg-agent-status status-${agent.status}`}>{agent.status}</Badge>
              </div>
              <p className="mt-4 text-sm font-semibold">{agent.name}</p>
              <p className="mt-1 text-xs text-muted-foreground">{agent.role}</p>
              <p aria-live="polite" className="cg-agent-task">
                {agent.task}
              </p>
              <div
                aria-label={`${agent.progress}% complete`}
                className="cg-progress-track"
                role="progressbar"
                aria-valuenow={agent.progress}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <span style={{ width: `${agent.progress}%` }} />
              </div>
              <p className="mt-3 min-h-10 text-xs leading-relaxed text-muted-foreground">
                {agent.findings}
              </p>
            </article>
          );
        })}
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <CircleDot aria-hidden="true" className="size-3 text-primary" />
          {completedRuns} completed demo run{completedRuns === 1 ? "" : "s"} · No external actions
        </p>
        <div className="flex gap-2">
          <Button disabled={running} onClick={reset} variant="outline">
            <RotateCcw aria-hidden="true" />
            Reset
          </Button>
          <Button className="cg-primary-button" disabled={running} onClick={runDemo}>
            <Play aria-hidden="true" />
            {running ? "Running simulated workflow…" : "Run demo investigation"}
          </Button>
        </div>
      </div>

      <Card className="cg-panel">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Sparkles aria-hidden="true" className="size-4 text-primary" />
            Agent boundaries
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-xs leading-relaxed text-muted-foreground md:grid-cols-2">
          <p>
            Agents exchange simulated findings in a fixed sequence; they do not call an external
            model by default.
          </p>
          <p>
            Response Agent recommendations are proposals only. An analyst must review and confirm
            any recorded decision.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
