import type { ReactNode } from "react";
import type { RiskLevel, IncidentStatus } from "@/lib/types";

const riskStyles: Record<RiskLevel, string> = {
  low: "text-risk-low border-risk-low/40 bg-risk-low/10",
  medium: "text-risk-medium border-risk-medium/40 bg-risk-medium/10",
  high: "text-risk-high border-risk-high/40 bg-risk-high/10",
  critical: "text-risk-high border-risk-high/60 bg-risk-high/20",
};

export function RiskBadge({ level }: { level: RiskLevel | null }) {
  if (!level)
    return (
      <span className="inline-flex rounded border border-border px-2 py-0.5 font-mono text-xs text-muted-foreground">
        Unscored
      </span>
    );
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded border px-2 py-0.5 font-mono text-xs uppercase ${riskStyles[level]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {level}
    </span>
  );
}

const statusLabel: Record<IncidentStatus, string> = {
  new: "New",
  investigating: "Investigating",
  awaiting_approval: "Awaiting approval",
  resolved: "Resolved",
  escalated: "Escalated",
  needs_rereview: "Needs re-review",
  approved: "Approved",
  rejected: "Rejected",
};
export function StatusPill({ status }: { status: IncidentStatus }) {
  return (
    <span className="rounded bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
      {statusLabel[status]}
    </span>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function EmptyNote({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
      {children}
    </div>
  );
}
