import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight, ScanSearch } from "lucide-react";

import { CountUp, LiveFeed, ThroughputSparkline } from "@/components/dashboard/live-widgets";
import { ThreatRadar } from "@/components/dashboard/threat-radar";
import { Button } from "@/components/ui/button";
import { deriveDemoAlerts, type DemoAlertPriority } from "@/lib/demo-alerts";
import { useDemoStore } from "@/lib/store";
import type { RiskLevel } from "@/lib/types";

export const Route = createFileRoute("/_console/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — PhishPilot" }] }),
  component: Dashboard,
});

const riskLevels: RiskLevel[] = ["critical", "high", "medium", "low"];
const riskColor: Record<RiskLevel, string> = {
  critical: "var(--risk-critical)",
  high: "var(--risk-high)",
  medium: "var(--risk-medium)",
  low: "var(--risk-low)",
};
const priorityTone: Record<DemoAlertPriority, "critical" | "high" | "medium" | "low"> = {
  critical: "critical",
  high: "high",
  warning: "medium",
  info: "low",
};
const closedStatuses = new Set(["approved", "rejected", "resolved"]);
const pipeline = ["Triage", "Investigate", "Risk review", "Response", "Human gate"];

function Dashboard() {
  const { incidents, approvals, decisions } = useDemoStore();
  const open = incidents.filter((incident) => !closedStatuses.has(incident.status));
  const urgent = open.filter(
    (incident) => incident.risk === "critical" || incident.risk === "high",
  );
  const pending = incidents.filter((incident) =>
    ["awaiting_approval", "escalated", "needs_rereview"].includes(incident.status),
  );
  const brokenApprovals = approvals.filter(
    (approval) => approval.state === "stale" || approval.state === "invalidated",
  );
  const distribution = riskLevels.map((level) => ({
    level,
    count: incidents.filter((incident) => incident.risk === level).length,
  }));
  const queue = [...incidents].sort((left, right) => right.riskScore - left.riskScore);
  const alertSeed = deriveDemoAlerts(incidents, approvals)
    .slice(0, 4)
    .map((alert) => ({
      id: alert.id,
      tone: priorityTone[alert.priority],
      source: "alert",
      text: `${alert.title} · ${alert.incidentId}`,
      incidentId: alert.incidentId,
    }));

  const metrics = [
    { label: "Incidents", value: incidents.length, note: "in the queue" },
    { label: "Open", value: open.length, note: "awaiting closure" },
    { label: "Need a decision", value: pending.length, note: "human approval" },
    { label: "Approvals broken", value: brokenApprovals.length, note: "stale or invalidated" },
    { label: "Decisions", value: decisions.length, note: "recorded this session" },
  ];

  return (
    <div className="cg-page space-y-6">
      <header className="cg-page-heading">
        <div>
          <p className="cg-eyebrow">SOC · overview</p>
          <h1>Threat command center</h1>
          <p>Every reported email, its risk and the decision it is waiting for.</p>
        </div>
        <Button asChild className="cg-primary-button">
          <Link to="/investigation">
            <ScanSearch aria-hidden="true" /> Investigate an email
          </Link>
        </Button>
      </header>

      <section className="cg-panel grid gap-6 p-5 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:items-center">
        <ThreatRadar incidents={open} urgent={urgent.length} />

        <div>
          <div className="flex items-center justify-between">
            <p className="cg-eyebrow">Risk distribution</p>
            <span className="cg-live-indicator">
              <span /> Simulated feed
            </span>
          </div>
          <div aria-label="Incidents by risk" className="dash-stack mt-3" role="img">
            {distribution
              .filter((item) => item.count > 0)
              .map((item, index) => (
                <span
                  key={item.level}
                  style={{
                    flexGrow: item.count,
                    background: riskColor[item.level],
                    animationDelay: `${index * 120}ms`,
                  }}
                  title={`${item.level}: ${item.count}`}
                />
              ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
            {distribution.map((item) => (
              <span className="flex items-center gap-2 text-xs" key={item.level}>
                <span className="size-2" style={{ background: riskColor[item.level] }} />
                <span className="capitalize text-muted-foreground">{item.level}</span>
                <span className="font-mono">{item.count}</span>
              </span>
            ))}
          </div>
        </div>

        <div className="lg:w-72">
          <ThroughputSparkline />
        </div>
      </section>

      <section
        aria-label="Key metrics"
        className="grid gap-px overflow-hidden rounded-md border border-border bg-border sm:grid-cols-3 lg:grid-cols-5"
      >
        {metrics.map((metric, index) => (
          <div
            className="dash-metric bg-card p-5"
            key={metric.label}
            style={{ animationDelay: `${index * 60}ms` }}
          >
            <p className="text-xs text-muted-foreground">{metric.label}</p>
            <p className="mt-2 font-display text-4xl font-bold tracking-tight tabular-nums">
              <CountUp value={metric.value} />
            </p>
            <p className="mt-1 font-mono text-[0.66rem] uppercase text-muted-foreground">
              {metric.note}
            </p>
          </div>
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(18rem,0.8fr)]">
        <div className="cg-panel">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div>
              <h2 className="text-base font-semibold">Triage queue</h2>
              <p className="text-xs text-muted-foreground">Sorted by risk score</p>
            </div>
            <Button asChild size="sm" variant="outline">
              <Link to="/incidents">
                All incidents <ArrowUpRight aria-hidden="true" />
              </Link>
            </Button>
          </div>
          <ul className="divide-y divide-border">
            {queue.map((incident) => (
              <li key={incident.id}>
                <Link
                  className="dash-row grid grid-cols-[3px_minmax(0,1fr)_auto] items-center gap-4 py-3 pr-5"
                  params={{ id: incident.id }}
                  to="/incidents/$id"
                >
                  <span className="h-full" style={{ background: riskColor[incident.risk] }} />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{incident.subject}</span>
                    <span className="block truncate font-mono text-[0.68rem] text-muted-foreground">
                      {incident.id} · {incident.sender}
                    </span>
                  </span>
                  <span className="flex items-center gap-4">
                    <span className="hidden text-xs capitalize text-muted-foreground sm:inline">
                      {incident.status.replaceAll("_", " ")}
                    </span>
                    <span className="dash-score">
                      <span
                        style={{
                          width: `${incident.riskScore}%`,
                          background: riskColor[incident.risk],
                        }}
                      />
                    </span>
                    <span
                      className="w-8 text-right font-display text-lg font-bold tabular-nums"
                      style={{ color: riskColor[incident.risk] }}
                    >
                      {incident.riskScore}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="cg-panel">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="flex items-center gap-2 text-base font-semibold">
              Live activity
              <span className="cg-live-indicator">
                <span /> Simulated
              </span>
            </h2>
            <Link className="text-xs text-muted-foreground hover:text-primary" to="/alerts">
              All alerts
            </Link>
          </div>
          <LiveFeed seed={alertSeed} />
        </div>
      </section>

      <section className="cg-panel flex flex-wrap items-center justify-between gap-5 p-5">
        <div>
          <p className="cg-eyebrow">Agent pipeline</p>
          <ol className="mt-3 flex flex-wrap items-center gap-2">
            {pipeline.map((step, index) => (
              <li className="flex items-center gap-2" key={step}>
                <span
                  className="pipeline-step rounded-sm border border-border bg-muted px-2.5 py-1 text-xs font-medium"
                  style={{ animationDelay: `${index * 0.7}s` }}
                >
                  {step}
                </span>
                {index < pipeline.length - 1 && (
                  <ArrowRight aria-hidden="true" className="size-3.5 text-muted-foreground" />
                )}
              </li>
            ))}
          </ol>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm" variant="outline">
            <Link to="/hurdle-guide">Hurdle guide</Link>
          </Button>
          <Button asChild className="cg-primary-button" size="sm">
            <Link to="/investigation">
              Run the agents <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
