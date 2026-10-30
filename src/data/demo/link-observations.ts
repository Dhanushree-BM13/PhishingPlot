import type { ApprovalState } from "@/lib/types";

export const linkObservationFixture = {
  incidentId: "DEMO-LINK-DRIFT-01",
  url: "https://secure-updates.example/document",
  recheckAfterMinutes: 90,
  observations: [
    {
      observedAt: "T0",
      localReputation: "clean",
      note: "Local demo fixture at approval time.",
    },
    {
      observedAt: "T0 + 90m",
      localReputation: "malicious",
      note: "Later local demo fixture; no live scan is performed.",
    },
  ],
  timelineLabel: "Simulated",
  initialApprovalState: "valid" satisfies ApprovalState,
  finalApprovalState: "invalidated" satisfies ApprovalState,
  invalidatedMessage:
    "Approval invalidated after the local observation changed for https://secure-updates.example/document.",
} as const;
