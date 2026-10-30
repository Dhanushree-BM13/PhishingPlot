import { useEffect, useState } from "react";
import { Activity, Circle, Radio } from "lucide-react";

import { isCyberguardApiConfigured, cyberguardApi } from "@/lib/cyberguard-api";
import { cn } from "@/lib/utils";

type BackendState = "checking" | "connected" | "offline";

export function BackendStatus({ compact = false }: { compact?: boolean }) {
  const [state, setState] = useState<BackendState>(
    isCyberguardApiConfigured ? "checking" : "offline",
  );
  const [version, setVersion] = useState("");

  useEffect(() => {
    if (!isCyberguardApiConfigured) return;
    let active = true;

    const check = () => {
      void cyberguardApi
        .health()
        .then((health) => {
          if (!active) return;
          setState(health.status === "ok" ? "connected" : "offline");
          setVersion(health.version ?? "");
        })
        .catch((error: unknown) => {
          if (!active) return;
          setState("offline");
          console.info(
            "The PhishPilot backend is unavailable; the app stays in clearly labeled demo mode.",
            error,
          );
        });
    };

    check();
    const interval = window.setInterval(check, 30_000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  const copy = state === "connected" ? "API CONNECTED" : "SIMULATED MODE";
  const detail =
    state === "connected"
      ? `Backend API${version ? ` · v${version}` : ""}`
      : isCyberguardApiConfigured
        ? "Backend unavailable · local demo data"
        : "Backend not configured · local demo data";

  return (
    <span
      aria-label={detail}
      className={cn(
        "cg-status-chip",
        state === "connected" ? "cg-status-connected" : "cg-status-demo",
        compact && "cg-status-compact",
      )}
      title={detail}
    >
      {state === "checking" ? (
        <Radio aria-hidden="true" className="size-3 animate-pulse" />
      ) : state === "connected" ? (
        <Activity aria-hidden="true" className="size-3" />
      ) : (
        <Circle aria-hidden="true" className="size-2 fill-current" />
      )}
      <span>{copy}</span>
    </span>
  );
}
