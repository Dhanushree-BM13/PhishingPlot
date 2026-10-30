import type { DemoApprovalFixture } from "@/data/demo/approvals";
import type { DemoIncident } from "@/lib/store";

export type DemoAlertPriority = "critical" | "high" | "warning" | "info";

export interface DemoAlert {
  id: string;
  incidentId: string;
  priority: DemoAlertPriority;
  title: string;
  detail: string;
}

const closedStatuses = new Set(["approved", "rejected", "resolved"]);

export function deriveDemoAlerts(
  incidents: DemoIncident[],
  approvals: DemoApprovalFixture[],
): DemoAlert[] {
  const alerts: DemoAlert[] = [];

  for (const incident of incidents) {
    const approval = approvals.find((item) => item.incidentId === incident.id);
    const isOpen = !closedStatuses.has(incident.status);

    if (isOpen && incident.risk === "critical") {
      alerts.push({
        id: `${incident.id}-critical-risk`,
        incidentId: incident.id,
        priority: "critical",
        title: "Critical-risk incident",
        detail: `${incident.subject} is waiting for analyst review.`,
      });
    }

    if (incident.status === "needs_rereview" || incident.status === "escalated") {
      alerts.push({
        id: `${incident.id}-review`,
        incidentId: incident.id,
        priority: "high",
        title:
          incident.status === "needs_rereview" ? "Fresh review required" : "Incident escalated",
        detail: `${incident.subject} needs a human review.`,
      });
    } else if (incident.status === "awaiting_approval") {
      alerts.push({
        id: `${incident.id}-decision`,
        incidentId: incident.id,
        priority: "warning",
        title: "Analyst decision pending",
        detail: `${incident.subject} is awaiting an analyst decision.`,
      });
    }

    if (approval?.state === "stale" || approval?.state === "invalidated") {
      alerts.push({
        id: `${incident.id}-approval-${approval.state}`,
        incidentId: incident.id,
        priority: approval.state === "invalidated" ? "high" : "warning",
        title: approval.state === "invalidated" ? "Approval invalidated" : "Approval is stale",
        detail: `${incident.subject} needs a fresh evidence review before a decision.`,
      });
    }
  }

  return alerts.sort((left, right) => {
    const rank: Record<DemoAlertPriority, number> = {
      critical: 0,
      high: 1,
      warning: 2,
      info: 3,
    };
    return rank[left.priority] - rank[right.priority];
  });
}
