import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Database, Gauge, RotateCcw, Server, ShieldCheck, Timer } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cyberguardApi, isCyberguardApiConfigured } from "@/lib/cyberguard-api";
import { useDemoStore } from "@/lib/store";

export const Route = createFileRoute("/_console/settings")({
  head: () => ({ meta: [{ title: "Settings — PHISHPILOT" }] }),
  component: Settings,
});

type Health = { api: string; database: string };

function useHealth(): Health {
  const [health, setHealth] = useState<Health>({
    api: isCyberguardApiConfigured ? "checking" : "not configured",
    database: isCyberguardApiConfigured ? "checking" : "not configured",
  });
  useEffect(() => {
    if (!isCyberguardApiConfigured) return;
    let active = true;
    cyberguardApi
      .health()
      .then(
        (result) =>
          active &&
          setHealth({
            api: result.status === "ok" ? "online" : "degraded",
            database: (result.database ?? "unknown").replace("_", " "),
          }),
      )
      .catch(() => active && setHealth({ api: "offline", database: "unknown" }));
    return () => {
      active = false;
    };
  }, []);
  return health;
}

function Settings() {
  const { config, demoDataLabel, resetDemo, trustedSenderCaseFixture } = useDemoStore();
  const health = useHealth();
  const maxWeight = Math.max(...trustedSenderCaseFixture.signals.map((signal) => signal.weight));
  const tiles = [
    { icon: ShieldCheck, label: "Ruleset version", value: config.rulesetVersion },
    {
      icon: Timer,
      label: "Approval TTL",
      value:
        config.approvalTtlMinutes === null ? "Not specified" : `${config.approvalTtlMinutes} min`,
    },
    { icon: Gauge, label: "Trust break threshold", value: config.trustBreakThreshold },
  ];
  const services = [
    { icon: Server, label: "Agent API", value: health.api },
    { icon: Database, label: "Supabase", value: health.database },
  ];

  return (
    <div className="cg-page space-y-6">
      <header className="cg-page-heading">
        <div>
          <p className="cg-eyebrow">Govern · configuration</p>
          <h1>Settings</h1>
          <p>Read-only rules that drive scoring and approvals, and the state of each service.</p>
        </div>
        <span className="cg-badge-demo">{demoDataLabel}</span>
      </header>

      <section className="grid gap-3 md:grid-cols-3">
        {tiles.map(({ icon: Icon, label, value }) => (
          <div className="cg-panel p-5" key={label}>
            <Icon aria-hidden="true" className="size-5 text-primary" />
            <p className="mt-4 text-xs text-muted-foreground">{label}</p>
            <p className="mt-1 font-mono text-lg font-semibold">{value}</p>
          </div>
        ))}
      </section>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <section className="cg-panel p-5">
          <h2 className="text-sm font-semibold">Sender-behavior signal weights</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Points each deviation adds to a trusted sender&apos;s risk (
            {trustedSenderCaseFixture.rulesetVersion}).
          </p>
          <ul className="mt-5 space-y-3">
            {trustedSenderCaseFixture.signals.map((signal, index) => (
              <li className="guide-bar-row" key={signal.id}>
                <span>{signal.id.replaceAll("_", " ").toLowerCase()}</span>
                <span className="guide-bar">
                  <span
                    style={{
                      width: `${(signal.weight / maxWeight) * 100}%`,
                      animationDelay: `${200 + index * 150}ms`,
                    }}
                  />
                </span>
                <span className="font-mono">+{signal.weight}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="cg-panel p-5">
          <h2 className="text-sm font-semibold">Services</h2>
          <ul className="mt-4 space-y-2">
            {services.map(({ icon: Icon, label, value }) => {
              const state =
                value === "online" || value === "connected"
                  ? "up"
                  : value === "checking"
                    ? "checking"
                    : value === "not configured"
                      ? "off"
                      : "down";
              return (
                <li className="cg-system-row border border-border" key={label}>
                  <span className="cg-system-icon">
                    <Icon aria-hidden="true" />
                  </span>
                  <span>
                    <strong>{label}</strong>
                    <small className="capitalize">{value}</small>
                  </span>
                  <span className={`status-dot is-${state} ml-auto`} />
                </li>
              );
            })}
          </ul>
          <div className="mt-5 border-t border-border pt-4">
            <p className="text-xs text-muted-foreground">
              Restore the sample incidents, approvals and simulated clock.
            </p>
            <Button
              className="mt-3 gap-2"
              onClick={() => {
                resetDemo();
                toast.success("Demo reset", { description: "Fixtures and clock restored." });
              }}
              variant="outline"
            >
              <RotateCcw aria-hidden="true" className="size-4" />
              Reset demo
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
