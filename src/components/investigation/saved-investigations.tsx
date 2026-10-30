import { useEffect, useState } from "react";
import { Database, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cyberguardApi, type SavedInvestigation } from "@/lib/cyberguard-api";

type LoadState = "loading" | "ready" | "unavailable";

/** Recent investigations read back from Supabase through the backend. */
export function SavedInvestigations({ refreshKey }: { refreshKey: number }) {
  const [items, setItems] = useState<SavedInvestigation[]>([]);
  const [state, setState] = useState<LoadState>("loading");
  const [reloads, setReloads] = useState(0);

  useEffect(() => {
    let active = true;
    setState("loading");
    cyberguardApi
      .listInvestigations()
      .then((rows) => {
        if (!active) return;
        setItems(rows);
        setState("ready");
      })
      .catch(() => active && setState("unavailable"));
    return () => {
      active = false;
    };
  }, [refreshKey, reloads]);

  return (
    <section className="cg-panel">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <h2 className="flex items-center gap-2 text-base font-semibold">
          <Database aria-hidden="true" className="size-4 text-primary" />
          Saved investigations
          <span className="font-mono text-[0.66rem] font-normal uppercase text-muted-foreground">
            Supabase
          </span>
        </h2>
        <Button onClick={() => setReloads((count) => count + 1)} size="sm" variant="outline">
          <RefreshCw aria-hidden="true" className={state === "loading" ? "animate-spin" : ""} />
          Refresh
        </Button>
      </div>
      {state === "unavailable" ? (
        <p className="px-5 py-4 text-sm text-muted-foreground">
          The database is not reachable from the backend yet. Investigations still run; they just
          are not stored.
        </p>
      ) : items.length === 0 ? (
        <p className="px-5 py-4 text-sm text-muted-foreground">
          {state === "loading"
            ? "Loading…"
            : "No investigations stored yet. Analyze an email above."}
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {items.map((item) => (
            <li
              className="feed-item grid grid-cols-[3px_minmax(0,1fr)_auto] items-center gap-4 py-3 pr-5"
              key={item.id}
            >
              <span className="h-full" style={{ background: `var(--risk-${item.risk})` }} />
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">{item.subject}</span>
                <span className="block truncate font-mono text-[0.68rem] text-muted-foreground">
                  {item.id.slice(0, 8)} · {item.sender} ·{" "}
                  {new Date(item.createdAt).toISOString().slice(0, 16).replace("T", " ")} UTC
                </span>
              </span>
              <span
                className="font-display text-lg font-bold tabular-nums"
                style={{ color: `var(--risk-${item.risk})` }}
              >
                {item.riskScore}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
