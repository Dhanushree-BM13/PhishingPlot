import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, Search, ShieldAlert } from "lucide-react";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useDemoStore } from "@/lib/store";

export const Route = createFileRoute("/_console/incidents/")({
  head: () => ({ meta: [{ title: "Incidents — PHISHPILOT" }] }),
  component: Incidents,
});

function Incidents() {
  const { incidents, approvals, demoDataLabel } = useDemoStore();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [approvalFilter, setApprovalFilter] = useState("all");

  const rows = useMemo(
    () =>
      incidents.filter((incident) => {
        const approvalState = approvals.find(
          (approval) => approval.incidentId === incident.id,
        )?.state;
        const text = `${incident.id} ${incident.subject} ${incident.sender}`.toLowerCase();
        return (
          text.includes(query.toLowerCase()) &&
          (statusFilter === "all" || incident.status === statusFilter) &&
          (approvalFilter === "all" || approvalState === approvalFilter)
        );
      }),
    [approvalFilter, approvals, incidents, query, statusFilter],
  );

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Incidents</h1>
          <p className="mt-1 text-sm text-muted-foreground">Review fixture-backed case records.</p>
        </div>
        <Badge className="border-status-analysis/30 bg-status-analysis/10 text-status-analysis">
          {demoDataLabel}
        </Badge>
      </header>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="relative sm:col-span-1">
          <Search
            aria-hidden="true"
            className="absolute left-3 top-2.5 size-4 text-muted-foreground"
          />
          <Input
            aria-label="Search incidents"
            className="pl-9"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search incident, subject, sender"
            value={query}
          />
        </label>
        <select
          aria-label="Filter by status"
          className="field"
          onChange={(event) => setStatusFilter(event.target.value)}
          value={statusFilter}
        >
          <option value="all">All statuses</option>
          <option value="new">New</option>
          <option value="investigating">In review</option>
          <option value="escalated">Escalated</option>
          <option value="needs_rereview">Needs re-review</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        <select
          aria-label="Filter by approval state"
          className="field"
          onChange={(event) => setApprovalFilter(event.target.value)}
          value={approvalFilter}
        >
          <option value="all">All approval states</option>
          <option value="valid">Valid</option>
          <option value="stale">Stale</option>
          <option value="invalidated">Invalidated</option>
          <option value="superseded">Superseded</option>
        </select>
      </div>
      <Card className="rounded-sm shadow-none">
        <CardHeader className="border-b border-border p-4">
          <CardTitle className="text-sm">{rows.length} incident records</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {rows.length ? (
            <ul className="divide-y divide-border">
              {rows.map((incident) => {
                const approval = approvals.find((entry) => entry.incidentId === incident.id);
                const flagged =
                  incident.status === "escalated" || incident.status === "needs_rereview";
                return (
                  <li key={incident.id}>
                    <Link
                      className="grid gap-3 px-4 py-4 transition-colors hover:bg-secondary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:grid-cols-[minmax(0,1fr)_auto_auto]"
                      params={{ id: incident.id }}
                      to="/incidents/$id"
                    >
                      <span className="min-w-0">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="truncate text-sm font-medium">{incident.subject}</span>
                          {flagged && (
                            <Badge className="gap-1 border-status-escalated/30 bg-status-escalated/10 text-status-escalated">
                              <AlertTriangle aria-hidden="true" className="size-3" />
                              {incident.status === "needs_rereview"
                                ? "Needs re-review"
                                : "Escalated"}
                            </Badge>
                          )}
                        </span>
                        <span className="mt-1 block break-all font-mono text-xs text-muted-foreground">
                          {incident.id} · {incident.sender}
                        </span>
                      </span>
                      <Badge className="gap-1 border-status-invalid/30 bg-status-invalid/10 text-status-invalid">
                        <ShieldAlert aria-hidden="true" className="size-3" />
                        {incident.risk.toUpperCase()}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Approval: {approval?.state ?? "none"}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="p-6 text-sm text-muted-foreground">No incidents match these filters.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
