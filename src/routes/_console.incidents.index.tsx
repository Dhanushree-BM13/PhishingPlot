import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { CountUp } from "@/components/dashboard/live-widgets";
import { Input } from "@/components/ui/input";
import { useDemoStore } from "@/lib/store";
import type { ApprovalState, RiskLevel } from "@/lib/types";

export const Route = createFileRoute("/_console/incidents/")({
  head: () => ({ meta: [{ title: "Incidents — PHISHPILOT" }] }),
  component: Incidents,
});

const riskFilters: (RiskLevel | "all")[] = ["all", "critical", "high", "medium", "low"];
const approvalTone: Record<ApprovalState, string> = {
  valid: "guide-pill is-ok",
  stale: "guide-pill is-warn",
  invalidated: "guide-pill is-bad",
  superseded: "cg-badge-demo",
};

function Incidents() {
  const { incidents, approvals, demoDataLabel } = useDemoStore();
  const [query, setQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState<RiskLevel | "all">("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [approvalFilter, setApprovalFilter] = useState("all");

  const rows = useMemo(
    () =>
      incidents
        .filter((incident) => {
          const approvalState = approvals.find(
            (approval) => approval.incidentId === incident.id,
          )?.state;
          const text = `${incident.id} ${incident.subject} ${incident.sender}`.toLowerCase();
          return (
            text.includes(query.toLowerCase()) &&
            (riskFilter === "all" || incident.risk === riskFilter) &&
            (statusFilter === "all" || incident.status === statusFilter) &&
            (approvalFilter === "all" || approvalState === approvalFilter)
          );
        })
        .sort((left, right) => right.riskScore - left.riskScore),
    [approvalFilter, approvals, incidents, query, riskFilter, statusFilter],
  );

  return (
    <div className="cg-page space-y-6">
      <header className="cg-page-heading">
        <div>
          <p className="cg-eyebrow">Operate · case records</p>
          <h1>Incidents</h1>
          <p>Every reported email as a case, ranked by risk. Open one to see its evidence.</p>
        </div>
        <span className="cg-badge-demo">{demoDataLabel}</span>
      </header>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by risk">
        {riskFilters.map((level) => {
          const count =
            level === "all"
              ? incidents.length
              : incidents.filter((incident) => incident.risk === level).length;
          const active = riskFilter === level;
          return (
            <button
              aria-pressed={active}
              className={`risk-chip ${active ? "is-active" : ""}`}
              key={level}
              onClick={() => setRiskFilter(level)}
              style={
                level === "all"
                  ? undefined
                  : ({ "--chip": `var(--risk-${level})` } as React.CSSProperties)
              }
              type="button"
            >
              {level !== "all" && <span className="risk-chip-dot" />}
              <span className="capitalize">{level}</span>
              <span className="font-mono text-xs tabular-nums opacity-70">
                <CountUp value={count} duration={500} />
              </span>
            </button>
          );
        })}
      </div>

      <div className="grid gap-3 sm:grid-cols-[minmax(0,2fr)_1fr_1fr]">
        <label className="relative">
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
          <option value="awaiting_approval">Awaiting approval</option>
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

      <section className="cg-panel">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h2 className="text-sm font-semibold">{rows.length} incident records</h2>
          <span className="font-mono text-[0.66rem] uppercase text-muted-foreground">
            Sorted by risk score
          </span>
        </div>
        {rows.length ? (
          <ul className="divide-y divide-border">
            {rows.map((incident, index) => {
              const approval = approvals.find((entry) => entry.incidentId === incident.id);
              return (
                <li
                  className="list-row-in"
                  key={`${incident.id}-${riskFilter}-${statusFilter}-${approvalFilter}`}
                  style={{ animationDelay: `${index * 45}ms` }}
                >
                  <Link
                    className="incident-row grid grid-cols-[3px_minmax(0,1fr)_auto] items-center gap-4 py-3.5 pr-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    params={{ id: incident.id }}
                    to="/incidents/$id"
                  >
                    <span
                      className="h-full"
                      style={{ background: `var(--risk-${incident.risk})` }}
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">{incident.subject}</span>
                      <span className="mt-0.5 block truncate font-mono text-[0.68rem] text-muted-foreground">
                        {incident.id} · {incident.sender}
                      </span>
                    </span>
                    <span className="flex items-center gap-4">
                      <span className="hidden text-xs capitalize text-muted-foreground lg:inline">
                        {incident.status.replaceAll("_", " ")}
                      </span>
                      {approval && (
                        <span className={`hidden sm:inline-flex ${approvalTone[approval.state]}`}>
                          {approval.state}
                        </span>
                      )}
                      <span className="dash-score">
                        <span
                          style={{
                            width: `${incident.riskScore}%`,
                            background: `var(--risk-${incident.risk})`,
                          }}
                        />
                      </span>
                      <span
                        className="w-9 text-right font-display text-xl font-bold tabular-nums"
                        style={{ color: `var(--risk-${incident.risk})` }}
                      >
                        {incident.riskScore}
                      </span>
                      <ArrowRight
                        aria-hidden="true"
                        className="row-arrow size-4 text-muted-foreground"
                      />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="p-6 text-sm text-muted-foreground">No incidents match these filters.</p>
        )}
      </section>
    </div>
  );
}
