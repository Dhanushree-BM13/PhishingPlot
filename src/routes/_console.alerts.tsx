import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AlertTriangle, ArrowUpRight, BellRing, Search, ShieldAlert } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useSectionReveal } from "@/lib/motion";
import { deriveDemoAlerts, type DemoAlertPriority } from "@/lib/demo-alerts";
import { useDemoStore } from "@/lib/store";
import { cn } from "@/lib/utils";

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

function Alerts() {
  const { incidents, approvals, demoDataLabel, formatSimulatedTime, simulatedTime } =
    useDemoStore();
  const [query, setQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<"all" | DemoAlertPriority>("all");
  const alerts = useMemo(() => deriveDemoAlerts(incidents, approvals), [approvals, incidents]);
  const { ref, visible } = useSectionReveal<HTMLElement>();
  const counts = {
    critical: alerts.filter((alert) => alert.priority === "critical").length,
    high: alerts.filter((alert) => alert.priority === "high").length,
    warning: alerts.filter((alert) => alert.priority === "warning").length,
  };
  const filteredAlerts = alerts.filter((alert) => {
    const incident = incidents.find((item) => item.id === alert.incidentId);
    const searchable = `${alert.title} ${alert.detail} ${incident?.subject ?? ""} ${alert.incidentId}`;
    return (
      searchable.toLowerCase().includes(query.toLowerCase()) &&
      (priorityFilter === "all" || alert.priority === priorityFilter)
    );
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-status-analysis">
            Demo signal desk
          </p>
          <h1 className="mt-1 flex items-center gap-2 text-2xl font-semibold">
            <BellRing aria-hidden="true" className="size-5 text-status-escalated" />
            Alerts
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Review simulated risk, approval, and evidence-state alerts. These are derived from local
            demo records, not live monitoring.
          </p>
        </div>
        <Badge className="border-status-analysis/30 bg-status-analysis/10 text-status-analysis">
          {demoDataLabel}
        </Badge>
      </header>

      <section
        aria-label="Alert summary"
        className="grid gap-3 sm:grid-cols-3"
        data-visible={visible}
        ref={ref}
      >
        {(
          [
            ["Critical", counts.critical, "text-status-invalid"],
            ["High", counts.high, "text-status-escalated"],
            ["Warnings", counts.warning, "text-status-analysis"],
          ] as const
        ).map(([label, count, color], index) => (
          <Card
            className="section-reveal rounded-sm shadow-none"
            data-visible={visible}
            key={label}
            style={{ transitionDelay: `${Math.min(index, 5) * 50}ms` }}
          >
            <CardHeader className="flex-row items-center justify-between space-y-0 p-4">
              <CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle>
              <AlertTriangle aria-hidden="true" className={cn("size-4", color)} />
            </CardHeader>
            <CardContent className="px-4 pb-4 pt-0">
              <p className={cn("text-3xl font-semibold tabular-nums", color)}>{count}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <Card className="rounded-sm shadow-none">
        <CardHeader className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
          <div>
            <CardTitle className="text-sm">Alert queue</CardTitle>
            <p className="mt-1 font-mono text-[10px] text-muted-foreground">
              Simulated time · {formatSimulatedTime(simulatedTime.toISOString())} UTC
            </p>
          </div>
          <span className="font-mono text-xs text-muted-foreground">
            {filteredAlerts.length} / {alerts.length} alerts
          </span>
        </CardHeader>
        <CardContent className="space-y-3 p-4">
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_12rem]">
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
              onChange={(event) =>
                setPriorityFilter(event.target.value as "all" | DemoAlertPriority)
              }
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
            <ol className="divide-y divide-border border-y border-border">
              {filteredAlerts.map((alert, index) => {
                const incident = incidents.find((item) => item.id === alert.incidentId);
                return (
                  <li
                    className="section-reveal"
                    data-visible={visible}
                    key={alert.id}
                    style={{ transitionDelay: `${Math.min(index, 6) * 45}ms` }}
                  >
                    <div className="grid gap-3 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                      <div className="flex min-w-0 gap-3">
                        <span
                          className={cn(
                            "mt-0.5 flex size-8 shrink-0 items-center justify-center border",
                            alert.priority === "critical"
                              ? "border-status-invalid/30 bg-status-invalid/10 text-status-invalid"
                              : alert.priority === "high"
                                ? "border-status-escalated/30 bg-status-escalated/10 text-status-escalated"
                                : "border-status-analysis/30 bg-status-analysis/10 text-status-analysis",
                          )}
                        >
                          <ShieldAlert aria-hidden="true" className="size-4" />
                        </span>
                        <span className="min-w-0">
                          <span className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-semibold">{alert.title}</span>
                            <Badge
                              className={cn(
                                "border",
                                alert.priority === "critical"
                                  ? "border-status-invalid/30 bg-status-invalid/10 text-status-invalid"
                                  : alert.priority === "high"
                                    ? "border-status-escalated/30 bg-status-escalated/10 text-status-escalated"
                                    : "border-status-analysis/30 bg-status-analysis/10 text-status-analysis",
                              )}
                            >
                              {priorityLabels[alert.priority]}
                            </Badge>
                          </span>
                          <span className="mt-1 block text-sm text-muted-foreground">
                            {alert.detail}
                          </span>
                          {incident && (
                            <span className="mt-1 block font-mono text-[10px] text-muted-foreground">
                              {incident.id} · {incident.risk.toUpperCase()} ·{" "}
                              {incident.status.replaceAll("_", " ")}
                            </span>
                          )}
                        </span>
                      </div>
                      {incident && (
                        <Button asChild size="sm" variant="outline">
                          <Link params={{ id: incident.id }} to="/incidents/$id">
                            Review case
                            <ArrowUpRight aria-hidden="true" />
                          </Link>
                        </Button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No alerts match this filter.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
