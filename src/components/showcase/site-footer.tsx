import { Link } from "@tanstack/react-router";
import { Shield } from "lucide-react";

import { useDemoStore } from "@/lib/store";

export function SiteFooter() {
  const { demoDataLabel } = useDemoStore();
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-8 sm:px-8 md:flex-row md:items-center md:justify-between">
        <Link
          aria-label="PHISHPILOT home"
          className="inline-flex w-fit items-center gap-2 rounded-md text-sm font-semibold tracking-wide text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          to="/"
        >
          <Shield className="size-5 text-status-analysis" aria-hidden="true" />
          PHISHPILOT
        </Link>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          Offline analysis cannot re-scan links at click time. Approvals expire and are invalidated
          on re-check to mitigate this.
        </p>
        <Link
          className="w-fit rounded-md text-sm font-medium text-status-analysis underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          search={{ scenario: undefined }}
          to="/dashboard"
        >
          Open dashboard
        </Link>
        <p className="text-xs text-muted-foreground">
          {demoDataLabel} shown. Not connected to live email or threat feeds.
        </p>
      </div>
    </footer>
  );
}
