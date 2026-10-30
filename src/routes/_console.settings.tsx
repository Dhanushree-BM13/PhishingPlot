import { createFileRoute } from "@tanstack/react-router";
import { RotateCcw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDemoStore } from "@/lib/store";

export const Route = createFileRoute("/_console/settings")({
  head: () => ({ meta: [{ title: "Settings — PHISHPILOT" }] }),
  component: Settings,
});

function Settings() {
  const { config, demoDataLabel, resetDemo } = useDemoStore();
  const entries = [
    ["Ruleset version", config.rulesetVersion],
    [
      "Approval TTL",
      config.approvalTtlMinutes === null
        ? "Not specified in demo fixtures"
        : `${config.approvalTtlMinutes} simulated minutes`,
    ],
    ["Trust break threshold", config.trustBreakThreshold],
  ];

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Read-only configuration for this demo.
          </p>
        </div>
        <Badge className="border-status-analysis/30 bg-status-analysis/10 text-status-analysis">
          {demoDataLabel}
        </Badge>
      </header>
      <Card className="max-w-2xl rounded-sm shadow-none">
        <CardHeader className="border-b border-border p-4">
          <CardTitle className="text-sm">Demo configuration</CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-border p-0">
          {entries.map(([label, value]) => (
            <div className="flex items-center justify-between gap-4 px-4 py-4" key={label}>
              <span className="text-sm text-muted-foreground">{label}</span>
              <span className="font-mono text-sm tabular-nums">{value}</span>
            </div>
          ))}
        </CardContent>
      </Card>
      <Button className="gap-2" onClick={resetDemo} variant="outline">
        <RotateCcw aria-hidden="true" className="size-4" />
        Reset demo
      </Button>
    </div>
  );
}
