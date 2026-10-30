import { AlertTriangle, ShieldAlert } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import type { DemoStoreValue } from "@/lib/store";

type Props = Pick<DemoStoreValue, "demoIncidents">;

export function OutcomeBanner({ demoIncidents }: Props) {
  const incident = demoIncidents.trustedSender;
  return (
    <section aria-labelledby="outcome-title" className="border-t border-border py-8">
      <p className="font-mono text-xs uppercase tracking-wider text-status-analysis">
        05 · Outcome
      </p>
      <h2 className="mt-2 text-xl font-semibold" id="outcome-title">
        Trust is evidence, not an exemption
      </h2>
      <div className="mt-4 flex flex-wrap gap-3">
        <Badge className="gap-1.5 border-status-escalated/30 bg-status-escalated/10 text-status-escalated">
          <AlertTriangle aria-hidden="true" className="size-3.5" />
          Trust discount {incident.trustDiscountState}
        </Badge>
        <Badge className="gap-1.5 border-status-invalid/30 bg-status-invalid/10 text-status-invalid">
          <ShieldAlert aria-hidden="true" className="size-3.5" />
          Final risk {incident.risk.toUpperCase()}
        </Badge>
      </div>
      <Alert className="mt-4 rounded-sm border-status-invalid/30 bg-status-invalid/5">
        <ShieldAlert aria-hidden="true" className="size-4 text-status-invalid" />
        <AlertTitle>{incident.banner}</AlertTitle>
        <AlertDescription>
          Authentication passed, but the new link domain and first bank-detail request cross the
          sender behavior trust-break threshold.
        </AlertDescription>
      </Alert>
    </section>
  );
}
