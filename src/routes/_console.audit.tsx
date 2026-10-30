import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { CountUp } from "@/components/dashboard/live-widgets";
import { Input } from "@/components/ui/input";
import { useDemoStore } from "@/lib/store";

export const Route = createFileRoute("/_console/audit")({
  head: () => ({ meta: [{ title: "Audit log — PHISHPILOT" }] }),
  component: AuditLog,
});

type Tone = "decision" | "broken" | "check" | "neutral";

function toneFor(type: string): Tone {
  const value = type.toLowerCase();
  if (value.includes("invalidated") || value.includes("expired") || value.includes("rejection"))
    return "broken";
  if (value.includes("approval recorded") || value.includes("justification")) return "decision";
  if (value.includes("re-check") || value.includes("re-review") || value.includes("escalat"))
    return "check";
  return "neutral";
}

const toneColor: Record<Tone, string> = {
  decision: "var(--primary)",
  broken: "var(--risk-critical)",
  check: "var(--risk-medium)",
  neutral: "var(--risk-low)",
};

function AuditLog() {
  const { auditEvents, incidents, demoDataLabel, formatSimulatedTime } = useDemoStore();
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const types = [...new Set(auditEvents.map((event) => event.type))].sort();
  const rows = useMemo(
    () =>
      [...auditEvents]
        .sort((left, right) => right.timestamp.localeCompare(left.timestamp))
        .filter((event) => {
          const incident = incidents.find((item) => item.id === event.incidentId);
          const searchable = `${event.type} ${event.detail} ${event.incidentId} ${incident?.subject ?? ""}`;
          return (
            searchable.toLowerCase().includes(query.toLowerCase()) &&
            (typeFilter === "all" || event.type === typeFilter)
          );
        }),
    [auditEvents, incidents, query, typeFilter],
  );
  const stats = [
    { label: "Events logged", value: auditEvents.length, color: "var(--foreground)" },
    {
      label: "Decisions",
      value: auditEvents.filter((event) => toneFor(event.type) === "decision").length,
      color: "var(--primary)",
    },
    {
      label: "Approvals broken",
      value: auditEvents.filter((event) => toneFor(event.type) === "broken").length,
      color: "var(--risk-critical)",
    },
    {
      label: "Re-checks",
      value: auditEvents.filter((event) => toneFor(event.type) === "check").length,
      color: "var(--risk-medium)",
    },
  ];

  return (
    <div className="cg-page space-y-6">
      <header className="cg-page-heading">
        <div>
          <p className="cg-eyebrow">Govern · evidence trail</p>
          <h1>Audit log</h1>
          <p>
            Every decision, re-check and invalidation, newest first. Nothing here can be edited.
          </p>
        </div>
        <span className="cg-badge-demo">{demoDataLabel}</span>
      </header>

      <section className="grid gap-px overflow-hidden rounded-md border border-border bg-border sm:grid-cols-4">
        {stats.map((stat) => (
          <div className="bg-card p-5" key={stat.label}>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
            <p
              className="mt-2 font-display text-4xl font-bold tracking-tight tabular-nums"
              style={{ color: stat.color }}
            >
              <CountUp value={stat.value} />
            </p>
          </div>
        ))}
      </section>

      <div className="grid gap-3 sm:grid-cols-[1fr_16rem]">
        <label className="relative">
          <Search
            aria-hidden="true"
            className="absolute left-3 top-2.5 size-4 text-muted-foreground"
          />
          <Input
            aria-label="Search audit events"
            className="pl-9"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search events or incidents"
            value={query}
          />
        </label>
        <select
          aria-label="Filter by event type"
          className="field"
          onChange={(event) => setTypeFilter(event.target.value)}
          value={typeFilter}
        >
          <option value="all">All event types</option>
          {types.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      <section className="cg-panel p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold">{rows.length} events</h2>
          <span className="flex flex-wrap gap-3 text-[0.68rem] text-muted-foreground">
            {(Object.keys(toneColor) as Tone[]).map((tone) => (
              <span className="flex items-center gap-1.5 capitalize" key={tone}>
                <span className="size-2 rounded-full" style={{ background: toneColor[tone] }} />
                {tone === "broken" ? "invalidated" : tone}
              </span>
            ))}
          </span>
        </div>
        <ol className="audit-timeline">
          {rows.map((event, index) => {
            const incident = incidents.find((item) => item.id === event.incidentId);
            const tone = toneFor(event.type);
            return (
              <li
                className="audit-item list-row-in"
                key={`${event.id}-${typeFilter}`}
                style={
                  {
                    "--node": toneColor[tone],
                    animationDelay: `${Math.min(index, 12) * 40}ms`,
                  } as React.CSSProperties
                }
              >
                <span className="audit-node" />
                <div className="grid gap-1 sm:grid-cols-[10.5rem_minmax(0,1fr)] sm:gap-4">
                  <time className="font-mono text-[0.7rem] tabular-nums text-muted-foreground">
                    {formatSimulatedTime(event.timestamp)}
                  </time>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold" style={{ color: toneColor[tone] }}>
                      {event.type}
                    </p>
                    <p className="mt-0.5 text-sm text-muted-foreground">{event.detail}</p>
                    {incident && (
                      <Link
                        className="mt-1 inline-block font-mono text-[0.7rem] text-foreground/80 underline-offset-4 hover:text-primary hover:underline"
                        params={{ id: incident.id }}
                        to="/incidents/$id"
                      >
                        {incident.id} · {incident.subject}
                      </Link>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}
