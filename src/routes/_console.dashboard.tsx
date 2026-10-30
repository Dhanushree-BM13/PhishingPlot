import { createFileRoute, Link } from "@tanstack/react-router";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  Activity,
  ArrowUpRight,
  Bot,
  CheckCircle2,
  Globe2,
  Mail,
  ScanSearch,
  ShieldAlert,
  Siren,
} from "lucide-react";

import { BackendStatus } from "@/components/cyberguard/backend-status";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDemoStore } from "@/lib/store";

export const Route = createFileRoute("/_console/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — PhishPilot" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { incidents, approvals } = useDemoStore();
  const metrics = [
    { label: "Emails analyzed", value: incidents.length, icon: Mail, note: "synthetic samples" },
    {
      label: "Phishing incidents",
      value: incidents.filter((incident) => incident.riskScore >= 40).length,
      icon: ShieldAlert,
      note: "demo risk ≥ 40",
    },
    {
      label: "Critical threats",
      value: incidents.filter((incident) => incident.risk === "critical").length,
      icon: Siren,
      note: "immediate review",
    },
    {
      label: "Pending approvals",
      value: incidents.filter((incident) => incident.status === "awaiting_approval").length,
      icon: CheckCircle2,
      note: "human decision required",
    },
  ];
  const chartData = ["critical", "high", "medium", "low"].map((level) => ({
    level,
    count: incidents.filter((incident) => incident.risk === level).length,
  }));
  const recentIncidents = [...incidents]
    .sort((left, right) => right.receivedAt.localeCompare(left.receivedAt))
    .slice(0, 5);

  return (
    <div className="cg-page space-y-5">
      <header className="cg-page-heading">
        <div>
          <p className="cg-eyebrow">SECURITY OPERATIONS / THREAT OVERVIEW</p>
          <h1>Threat command center</h1>
          <p>AI-assisted phishing investigation with analyst-controlled response.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <BackendStatus />
          <Badge className="cg-badge-demo">SYNTHETIC DATA</Badge>
        </div>
      </header>

      <section aria-label="Security metrics" className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
        {metrics.map(({ label, value, icon: Icon, note }, index) => (
          <Card
            className="cg-panel cg-metric-card"
            key={label}
            style={{ animationDelay: `${index * 70}ms` }}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <p className="text-xs font-medium text-muted-foreground">{label}</p>
                <Icon aria-hidden="true" className="size-4 text-cyan-300" />
              </div>
              <p className="mt-4 text-3xl font-semibold tracking-tight tabular-nums">{value}</p>
              <p className="mt-1 text-[10px] text-muted-foreground">{note}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 2xl:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.8fr)]">
        <Card className="cg-panel overflow-hidden">
          <CardHeader className="flex-row items-start justify-between border-b border-white/5 px-5 py-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Globe2 aria-hidden="true" className="size-4 text-cyan-300" />
                Threat surface
              </CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">
                Open incidents by risk tier · synthetic data
              </p>
            </div>
            <span className="cg-live-indicator">
              <span /> SIMULATION
            </span>
          </CardHeader>
          <CardContent className="p-0">
            <div className="grid grid-cols-1 gap-2 p-4 sm:grid-cols-3">
              {[
                [
                  "Critical",
                  `${incidents.filter((item) => item.risk === "critical").length}`,
                  "critical",
                ],
                ["Elevated", `${incidents.filter((item) => item.risk === "high").length}`, "high"],
                [
                  "Monitored",
                  `${incidents.filter((item) => item.risk === "medium" || item.risk === "low").length}`,
                  "normal",
                ],
              ].map(([label, amount, tone]) => (
                <div className="cg-threat-legend" key={label}>
                  <span className={`cg-threat-dot ${tone}`} />
                  <span className="text-xs text-muted-foreground">{label}</span>
                  <span className="ml-auto font-mono text-xs">{amount}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="cg-panel">
          <CardHeader className="border-b border-white/5 px-5 py-4">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Activity aria-hidden="true" className="size-4 text-cyan-300" />
              Threat severity
            </CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              Current fixture distribution · not live telemetry
            </p>
          </CardHeader>
          <CardContent className="h-[270px] p-4">
            <ResponsiveContainer height="100%" width="100%">
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  horizontal={false}
                  stroke="rgba(125,190,220,.09)"
                  strokeDasharray="3 5"
                />
                <XAxis
                  allowDecimals={false}
                  axisLine={false}
                  tick={{ fill: "#8294aa", fontSize: 10 }}
                  tickLine={false}
                  type="number"
                />
                <YAxis
                  axisLine={false}
                  dataKey="level"
                  tick={{ fill: "#a8bad0", fontSize: 10 }}
                  tickLine={false}
                  type="category"
                  width={58}
                />
                <Tooltip
                  contentStyle={{
                    background: "#0b1626",
                    border: "1px solid rgba(85,170,210,.2)",
                    borderRadius: 8,
                    color: "#e5f3ff",
                  }}
                />
                <Bar dataKey="count" fill="#39cce8" maxBarSize={20} radius={[0, 5, 5, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(17rem,0.6fr)]">
        <Card className="cg-panel overflow-hidden">
          <CardHeader className="flex-row items-center justify-between border-b border-white/5 px-5 py-4">
            <div>
              <CardTitle className="text-sm">Recent incidents</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">
                Fixture-backed investigation queue
              </p>
            </div>
            <Button asChild size="sm" variant="outline">
              <Link to="/incidents">
                All incidents <ArrowUpRight aria-hidden="true" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <table className="cg-table w-full min-w-[620px] text-left text-xs">
              <thead>
                <tr>
                  <th>Incident</th>
                  <th>Severity</th>
                  <th>Score</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentIncidents.map((incident) => (
                  <tr key={incident.id}>
                    <td>
                      <Link
                        className="font-medium hover:text-cyan-200"
                        params={{ id: incident.id }}
                        to="/incidents/$id"
                      >
                        {incident.subject}
                      </Link>
                      <span className="mt-1 block font-mono text-[10px] text-muted-foreground">
                        {incident.id} · {incident.sender}
                      </span>
                    </td>
                    <td>
                      <span className={`cg-severity severity-${incident.risk}`}>
                        {incident.risk}
                      </span>
                    </td>
                    <td className="font-mono tabular-nums">{incident.riskScore}</td>
                    <td className="text-muted-foreground">
                      {incident.status.replaceAll("_", " ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card className="cg-panel">
          <CardHeader className="border-b border-white/5 px-5 py-4">
            <CardTitle className="text-sm">System status</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">Environment and workflow health</p>
          </CardHeader>
          <CardContent className="space-y-1 p-3">
            <div className="cg-system-row">
              <span className="cg-system-icon">
                <Bot aria-hidden="true" />
              </span>
              <span>
                <strong>Agent orchestrator</strong>
                <small>Demo workflow ready</small>
              </span>
              <span className="cg-system-ok">READY</span>
            </div>
            <div className="cg-system-row">
              <span className="cg-system-icon">
                <CheckCircle2 aria-hidden="true" />
              </span>
              <span>
                <strong>Human approval gate</strong>
                <small>{approvals.length} sample decisions available</small>
              </span>
              <span className="cg-system-ok">ACTIVE</span>
            </div>
            <div className="cg-system-row">
              <span className="cg-system-icon">
                <Activity aria-hidden="true" />
              </span>
              <span>
                <strong>Incident telemetry</strong>
                <small>Local fixture stream</small>
              </span>
              <span className="cg-system-demo">DEMO</span>
            </div>
          </CardContent>
          <div className="flex flex-wrap gap-2 border-t border-white/5 px-4 py-4">
            <Button asChild className="cg-primary-button" size="sm">
              <Link to="/investigation">
                <ScanSearch aria-hidden="true" /> Investigate email
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link to="/agents">
                <Bot aria-hidden="true" /> Agent network
              </Link>
            </Button>
          </div>
        </Card>
      </section>
    </div>
  );
}
