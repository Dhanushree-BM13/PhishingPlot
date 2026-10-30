import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useDemoStore } from "@/lib/store";

export const Route = createFileRoute("/_console/audit")({
  head: () => ({ meta: [{ title: "Audit log — PHISHPILOT" }] }),
  component: AuditLog,
});

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

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Audit log</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Chronological decisions from the local demo.
          </p>
        </div>
        <Badge className="border-status-analysis/30 bg-status-analysis/10 text-status-analysis">
          {demoDataLabel}
        </Badge>
      </header>
      <div className="grid gap-3 sm:grid-cols-[1fr_15rem]">
        <Input
          aria-label="Search audit events"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search events or incidents"
          value={query}
        />
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
      <Card className="rounded-sm shadow-none">
        <CardHeader className="border-b border-border p-4">
          <CardTitle className="text-sm">{rows.length} events</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ol className="divide-y divide-border">
            {rows.map((event) => {
              const incident = incidents.find((item) => item.id === event.incidentId);
              return (
                <li
                  className="grid gap-2 px-4 py-4 sm:grid-cols-[10rem_10rem_minmax(0,1fr)]"
                  key={event.id}
                >
                  <time className="font-mono text-xs tabular-nums text-muted-foreground">
                    {formatSimulatedTime(event.timestamp)}
                  </time>
                  <Badge className="w-fit border-border bg-secondary text-secondary-foreground">
                    {event.type}
                  </Badge>
                  <div className="min-w-0">
                    <p className="text-sm">{event.detail}</p>
                    {incident && (
                      <Link
                        className="mt-1 inline-block font-mono text-xs text-status-analysis underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        params={{ id: incident.id }}
                        to="/incidents/$id"
                      >
                        {incident.subject}
                      </Link>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
