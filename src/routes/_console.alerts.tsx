import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowRight, Search } from "lucide-react";

import { CountUp } from "@/components/dashboard/live-widgets";
import { Input } from "@/components/ui/input";
import { deriveDemoAlerts, type DemoAlertPriority } from "@/lib/demo-alerts";
import { useDemoStore } from "@/lib/store";

export const Route = createFileRoute("/_console/alerts")({
  head: () => ({ meta: [{ title: "Alerts — PHISHPILOT" }] }),
  component: Alerts,
});

const priorityLabels: Record<DemoAlertPriority, string> = {
  critical: "Critical",
  high: "High",
  warning: "Warning",
  info: "Info",
};

const priorityColor: Record<DemoAlertPriority, string> = {
  critical: "var(--risk-critical)",
  high: "var(--risk-high)",
  warning: "var(--risk-medium)",
  info: "var(--risk-low)",
};

function Alerts() {
  const { incidents, approvals, demoDataLabel, formatSimulatedTime, simulatedTime } =
    useDemoStore();
  const [query, setQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<"all" | DemoAlertPriority>("all");
  const alerts = useMemo(() => deriveDemoAlerts(incidents, approvals), [approvals, incidents]);
  const filteredAlerts = alerts.filter((alert) => {
    const incident = incidents.find((item) => item.id === alert.incidentId);
    const searchable = `${alert.title} ${alert.detail} ${incident?.subject ?? ""} ${alert.incidentId}`;
    return (
      searchable.toLowerCase().includes(query.toLowerCase()) &&
      (priorityFilter === "all" || alert.priority === priorityFilter)
    );
  });

  const summary: [DemoAlertPriority, string][] = [
    ["critical", "Critical"],
    ["high", "High"],
    ["warning", "Warnings"],
  ];

  return (
    <div className="cg-page space-y-6">
      <header className="cg-page-heading">
        <div>
          <p className="cg-eyebrow">Operate · signal desk</p>
          <h1>Alerts</h1>
          <p>
            Risk, approval and evidence alerts raised from the incident queue. Simulated, not live
            monitoring.
          </p>
        </div>
        <span className="cg-badge-demo">{demoDataLabel}</span>
      </header>

      <section aria-label="Alert summary" className="grid gap-3 sm:grid-cols-3">
        {summary.map(([priority, label]) => {
          const count = alerts.filter((alert) => alert.priority === priority).length;
          const active = priorityFilter === priority;
          return (
            <button
              aria-pressed={active}
              className={`cg-panel alert-stat p-5 text-left ${active ? "is-active" : ""}`}
              key={priority}
              onClick={() => setPriorityFilter(active ? "all" : priority)}
              style={{ "--chip": priorityColor[priority] } as React.CSSProperties}
              type="button"
            >
              <span className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{label}</span>
                {priority === "critical" && count > 0 && <span className="pulse-dot" />}
              </span>
              <span
                className="mt-2 block font-display text-5xl font-extrabold tracking-tighter tabular-nums"
                style={{ color: priorityColor[priority] }}
              >
                <CountUp value={count} />
              </span>
              <span className="mt-1 block font-mono text-[0.66rem] uppercase text-muted-foreground">
                {active ? "Filtering · click to clear" : "Click to filter"}
              </span>
            </button>
          );
        })}
      </section>

      <section className="cg-panel">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3">
          <div>
            <h2 className="text-sm font-semibold">Alert queue</h2>
            <p className="font-mono text-[0.66rem] text-muted-foreground">
              Simulated time · {formatSimulatedTime(simulatedTime.toISOString())} UTC
            </p>
          </div>
          <span className="font-mono text-xs text-muted-foreground">
            {filteredAlerts.length} / {alerts.length} alerts
          </span>
        </div>
        <div className="grid gap-3 border-b border-border p-4 sm:grid-cols-[minmax(0,1fr)_12rem]">
          <label className="relative">
            <Search
              aria-hidden="true"
              className="absolute left-3 top-2.5 size-4 text-muted-foreground"
            />
            <Input
              aria-label="Search alerts"
              className="pl-9"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search alerts or incidents"
              value={query}
            />
          </label>
          <select
            aria-label="Filter by alert priority"
            className="field"
            onChange={(event) => setPriorityFilter(event.target.value as "all" | DemoAlertPriority)}
            value={priorityFilter}
          >
            <option value="all">All priorities</option>
            {Object.entries(priorityLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {filteredAlerts.length ? (
          <ol className="divide-y divide-border">
            {filteredAlerts.map((alert, index) => {
              const incident = incidents.find((item) => item.id === alert.incidentId);
              return (
                <li
                  className="list-row-in"
                  key={`${alert.id}-${priorityFilter}`}
                  style={{ animationDelay: `${index * 45}ms` }}
                >
                  <Link
                    className="incident-row grid grid-cols-[3px_minmax(0,1fr)_auto] items-center gap-4 py-3.5 pr-5"
                    params={{ id: alert.incidentId }}
                    to="/incidents/$id"
                  >
                    <span
                      className="h-full"
                      style={{ background: priorityColor[alert.priority] }}
                    />
                    <span className="min-w-0">
                      <span className="flex flex-wrap items-center gap-2">
                        {alert.priority === "critical" && <span className="pulse-dot" />}
                        <span className="text-sm font-semibold">{alert.title}</span>
                        <span
                          className="font-mono text-[0.62rem] font-semibold uppercase"
                          style={{ color: priorityColor[alert.priority] }}
                        >
                          {priorityLabels[alert.priority]}
                        </span>
                      </span>
                      <span className="mt-0.5 block truncate text-sm text-muted-foreground">
                        {alert.detail}
                      </span>
                      {incident && (
                        <span className="mt-0.5 block font-mono text-[0.66rem] text-muted-foreground">
                          {incident.id} · score {incident.riskScore} ·{" "}
                          {incident.status.replaceAll("_", " ")}
                        </span>
                      )}
                    </span>
                    <span className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="hidden sm:inline">Review case</span>
                      <ArrowRight aria-hidden="true" className="row-arrow size-4" />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ol>
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No alerts match this filter.
          </p>
        )}
      </section>
    </div>
  );
}
