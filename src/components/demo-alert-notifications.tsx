import { useEffect, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { deriveDemoAlerts } from "@/lib/demo-alerts";
import { useDemoStore } from "@/lib/store";

interface AlertSnapshot {
  statuses: Map<string, string>;
  approvalStates: Map<string, string>;
  decisionCount: number;
  elapsedMinutes: number;
}

function snapshotFor(
  incidents: ReturnType<typeof useDemoStore>["incidents"],
  approvals: ReturnType<typeof useDemoStore>["approvals"],
  decisionCount: number,
  elapsedMinutes: number,
): AlertSnapshot {
  return {
    statuses: new Map(incidents.map((incident) => [incident.id, incident.status])),
    approvalStates: new Map(approvals.map((approval) => [approval.incidentId, approval.state])),
    decisionCount,
    elapsedMinutes,
  };
}

export function DemoAlertNotifications() {
  const { incidents, approvals, decisions, elapsedMinutes, resetDemo } = useDemoStore();
  const navigate = useNavigate();
  const previous = useRef<AlertSnapshot | null>(null);
  const initialized = useRef(false);

  useEffect(() => {
    const current = snapshotFor(incidents, approvals, decisions.length, elapsedMinutes);
    const previousSnapshot = previous.current;
    previous.current = current;

    if (!previousSnapshot) {
      if (!initialized.current) {
        initialized.current = true;
        const criticalAlert = deriveDemoAlerts(incidents, approvals).find(
          (alert) => alert.priority === "critical",
        );
        if (criticalAlert) {
          toast.error(criticalAlert.title, {
            description: criticalAlert.detail,
            duration: 8000,
            action: {
              label: "Review case",
              onClick: () =>
                void navigate({
                  to: "/incidents/$id",
                  params: { id: criticalAlert.incidentId },
                }),
            },
          });
        }
      }
      return;
    }

    for (const incident of incidents) {
      const oldStatus = previousSnapshot.statuses.get(incident.id);
      const oldApproval = previousSnapshot.approvalStates.get(incident.id);
      const approval = approvals.find((item) => item.incidentId === incident.id);
      const isClosed =
        incident.status === "approved" ||
        incident.status === "rejected" ||
        incident.status === "resolved";

      if (
        oldStatus !== incident.status &&
        (incident.status === "approved" || incident.status === "rejected")
      ) {
        const decision = [...decisions].reverse().find((item) => item.incidentId === incident.id);
        toast.success(incident.status === "approved" ? "Case approved" : "Case rejected", {
          description: `${incident.subject} · ${decision?.decision ?? incident.status}. Decision recorded in the demo audit log.`,
          duration: 6500,
          action: {
            label: "View audit",
            onClick: () => void navigate({ to: "/audit" }),
          },
        });
        continue;
      }

      if (oldApproval !== "invalidated" && approval?.state === "invalidated") {
        toast.error("Approval invalidated", {
          description: `${incident.subject} needs fresh review because the simulated evidence changed.`,
          duration: 8000,
          action: {
            label: "Review case",
            onClick: () => void navigate({ to: "/incidents/$id", params: { id: incident.id } }),
          },
        });
        continue;
      }

      if (oldApproval === "valid" && approval?.state === "stale") {
        toast.warning("Approval expired", {
          description: `${incident.subject} needs a fresh review before its approval can be relied on.`,
          duration: 7000,
          action: {
            label: "Review case",
            onClick: () => void navigate({ to: "/incidents/$id", params: { id: incident.id } }),
          },
        });
        continue;
      }

      if (
        oldStatus !== incident.status &&
        !isClosed &&
        (incident.status === "escalated" || incident.status === "needs_rereview")
      ) {
        toast.error(
          incident.status === "needs_rereview" ? "Fresh review required" : "Incident escalated",
          {
            description: `${incident.subject} requires analyst attention.`,
            duration: 7500,
            action: {
              label: "Review case",
              onClick: () => void navigate({ to: "/incidents/$id", params: { id: incident.id } }),
            },
          },
        );
      }
    }

    if (
      elapsedMinutes === 0 &&
      (previousSnapshot.elapsedMinutes > 0 || decisions.length < previousSnapshot.decisionCount)
    ) {
      toast("Demo reset", {
        description: "Sample incidents and the simulated clock are back at their starting state.",
        duration: 4000,
      });
    }
  }, [approvals, decisions, elapsedMinutes, incidents, navigate, resetDemo]);

  return null;
}
