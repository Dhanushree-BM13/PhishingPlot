import { ArrowRight, CheckCircle2, Clock3, ShieldAlert } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { DemoStoreValue } from "@/lib/store";

type Props = Pick<DemoStoreValue, "demoIncidents" | "linkObservationFixture">;

export function LinkDriftTimeline({ demoIncidents, linkObservationFixture }: Props) {
  return (
    <section aria-labelledby="link-drift-title" className="border-t border-border py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-mono text-xs uppercase tracking-wider text-status-analysis">
            06 · Follow-up
          </p>
          <h2 className="mt-2 text-xl font-semibold" id="link-drift-title">
            The link changes after approval
          </h2>
        </div>
        <Badge className="border-status-escalated/30 bg-status-escalated/10 text-status-escalated">
          Simulated local intelligence, not live scanning
        </Badge>
      </div>
      <p className="mt-2 font-mono text-xs text-muted-foreground">{demoIncidents.linkDrift.id}</p>
      <p className="mt-3 break-all font-mono text-sm">{linkObservationFixture.url}</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto_1fr_auto_1fr] sm:items-center">
        <Card className="rounded-sm p-4 shadow-none">
          <p className="font-mono text-xs text-muted-foreground">
            {linkObservationFixture.observations[0].observedAt}
          </p>
          <p className="mt-2 flex items-center gap-2 text-sm font-medium text-status-valid">
            <CheckCircle2 aria-hidden="true" className="size-4" />
            {linkObservationFixture.observations[0].localReputation}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Approval {linkObservationFixture.initialApprovalState}
          </p>
        </Card>
        <ArrowRight aria-hidden="true" className="mx-auto size-4 text-muted-foreground" />
        <Card className="rounded-sm p-4 shadow-none">
          <p className="font-mono text-xs text-muted-foreground">
            {linkObservationFixture.observations[1].observedAt}
          </p>
          <p className="mt-2 flex items-center gap-2 text-sm font-medium text-status-invalid">
            <ShieldAlert aria-hidden="true" className="size-4" />
            {linkObservationFixture.observations[1].localReputation}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Local fixture observation</p>
        </Card>
        <ArrowRight aria-hidden="true" className="mx-auto size-4 text-muted-foreground" />
        <Card className="rounded-sm border-status-invalid/30 p-4 shadow-none">
          <p className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
            <Clock3 aria-hidden="true" className="size-3.5" />
            Re-check
          </p>
          <p className="mt-2 text-sm font-medium text-status-invalid">
            {linkObservationFixture.initialApprovalState} →{" "}
            {linkObservationFixture.finalApprovalState}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Needs re-review</p>
        </Card>
      </div>
    </section>
  );
}
