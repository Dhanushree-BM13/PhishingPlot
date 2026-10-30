import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertTriangle, ArrowUpRight, CheckCircle2, Clock3, ShieldAlert } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DemoScenarios, type DemoScenarioId } from "@/components/dashboard/demo-scenarios";
import { useDemoStore } from "@/lib/store";
import { useReducedMotion } from "@/lib/motion";

export const Route = createFileRoute("/_console/dashboard")({
  validateSearch: (search: Record<string, unknown>) => {
    const scenario = search["scenario"];
    return {
      scenario:
        scenario === "trusted-sender" ||
        scenario === "link-drift" ||
        scenario === "analyzer-dissent"
          ? scenario
          : undefined,
    };
  },
  head: () => ({ meta: [{ title: "Dashboard — PHISHPILOT" }] }),
  component: Dashboard,
});

function AnimatedCount({ value }: { value: number }) {
  const reducedMotion = useReducedMotion();
  const [displayValue, setDisplayValue] = useState(reducedMotion ? value : 0);

  useEffect(() => {
    if (reducedMotion) {
      setDisplayValue(value);
      return;
    }

    let frame = 0;
    const started = performance.now();
    const update = (now: number) => {
      const progress = Math.min(1, (now - started) / 500);
      setDisplayValue(Math.round(value * progress));
      if (progress < 1) frame = requestAnimationFrame(update);
    };
    frame = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frame);
  }, [reducedMotion, value]);

  return <span className="tabular-nums">{displayValue}</span>;
}

function Dashboard() {
  const { scenario } = Route.useSearch();
  const { incidents, approvals, auditEvents, elapsedMinutes } = useDemoStore();
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  const counts = [
    { label: "Incidents total", value: incidents.length, icon: Clock3 },
    {
      label: "Escalated",
      value: incidents.filter((incident) => incident.status === "escalated").length,
      icon: ShieldAlert,
    },
    {
      label: "Needs re-review",
      value: incidents.filter((incident) => incident.status === "needs_rereview").length,
      icon: AlertTriangle,
    },
    {
      label: "Approvals valid",
      value: approvals.filter((approval) => approval.state === "valid").length,
      icon: CheckCircle2,
    },
  ];

  const riskLevels = ["low", "medium", "high", "critical"] as const;
  const chartData = riskLevels.map((level) => ({
    level: level.toUpperCase(),
    count: incidents.filter((incident) => incident.risk === level).length,
  }));
  const currentEvents = auditEvents
    .filter((event) => event.offsetMinutes <= elapsedMinutes)
    .sort((a, b) => b.offsetMinutes - a.offsetMinutes)
    .slice(0, 5);
  const attention = incidents.filter(
    (incident) => incident.status === "escalated" || incident.status === "needs_rereview",
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-status-analysis">
            Offline analyst workspace
          </p>
          <h1 className="mt-1 text-2xl font-semibold">Security overview</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review fixture-backed incidents and recorded analyst decisions.
          </p>
        </div>
        <Badge className="border-status-analysis/30 bg-status-analysis/10 text-status-analysis">
          Demo data
        </Badge>
      </header>

      <section aria-label="Incident metrics" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {counts.map(({ label, value, icon: Icon }) => (
          <Card className="rounded-sm shadow-none" key={label}>
            <CardHeader className="flex-row items-center justify-between space-y-0 p-4">
              <CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle>
              <Icon aria-hidden="true" className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="px-4 pb-4 pt-0">
              {hydrated ? (
                <p className="text-3xl font-semibold tabular-nums">
                  <AnimatedCount value={value} />
                </p>
              ) : (
                <Skeleton className="h-9 w-16" />
              )}
            </CardContent>
          </Card>
        ))}
      </section>

      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="rounded-sm shadow-none">
          <CardHeader className="border-b border-border px-4 py-3">
            <CardTitle className="text-sm">Risk distribution</CardTitle>
            <p className="text-xs text-muted-foreground">Counts from the current demo incidents.</p>
          </CardHeader>
          <CardContent className="h-64 p-4">
            <ResponsiveContainer height="100%" width="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                <XAxis axisLine={false} dataKey="level" tickLine={false} />
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 4,
                    color: "var(--foreground)",
                  }}
                />
                <Bar
                  dataKey="count"
                  fill="var(--status-analysis)"
                  maxBarSize={44}
                  radius={[3, 3, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="rounded-sm shadow-none">
          <CardHeader className="border-b border-border px-4 py-3">
            <CardTitle className="text-sm">Needs attention</CardTitle>
            <p className="text-xs text-muted-foreground">Escalated or awaiting a fresh review.</p>
          </CardHeader>
          <CardContent className="p-0">
            {attention.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">No incidents need attention.</p>
            ) : (
              <ul className="divide-y divide-border">
                {attention.map((incident) => (
                  <li key={incident.id}>
                    <Link
                      className="flex min-w-0 items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-secondary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      params={{ id: incident.id }}
                      to="/incidents/$id"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">
                          {incident.subject}
                        </span>
                        <span className="mt-1 block font-mono text-xs text-muted-foreground">
                          {incident.id} · {incident.status.replaceAll("_", " ")}
                        </span>
                      </span>
                      <ArrowUpRight aria-hidden="true" className="size-4 shrink-0" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-sm shadow-none">
        <CardHeader className="border-b border-border px-4 py-3">
          <CardTitle className="text-sm">Activity feed</CardTitle>
          <p className="text-xs text-muted-foreground">Latest fixture events at simulated time.</p>
        </CardHeader>
        <CardContent className="p-0">
          {currentEvents.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">No events at this simulated time.</p>
          ) : (
            <ol className="divide-y divide-border">
              {currentEvents.map((event) => (
                <li
                  className="flex flex-wrap items-center justify-between gap-2 px-4 py-3"
                  key={event.id}
                >
                  <span className="text-sm">{event.type}</span>
                  <span className="font-mono text-xs text-muted-foreground">
                    T+{event.offsetMinutes}m · {event.actor}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>

      <DemoScenarios {...(scenario ? { activeScenario: scenario as DemoScenarioId } : {})} />
    </div>
  );
}
