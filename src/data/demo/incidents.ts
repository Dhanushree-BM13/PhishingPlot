import type { IncidentStatus, RiskLevel } from "@/lib/types";

export interface ShowcaseIncidentFixture {
  id: string;
  subject: string;
  sender: string;
  status: IncidentStatus;
  risk: RiskLevel;
}

export const demoIncidents = {
  trustedSender: {
    id: "DEMO-TRUSTED-01",
    subject: "Updated remittance details",
    sender: "ap@partner.example",
    status: "escalated",
    risk: "high",
    authChecks: [
      { name: "SPF", status: "pass" },
      { name: "DKIM", status: "pass" },
      { name: "DMARC", status: "pass" },
    ],
    newLinkDomain: "remittance-update.example",
    bankDetailChangeText: "Requests a change to bank details.",
    banner: "Trusted sender behaving unusually.",
    trustDiscountState: "removed",
  },
  linkDrift: {
    id: "DEMO-LINK-DRIFT-01",
    subject: "Review the shared document",
    sender: "collaboration@partner.example",
    status: "needs_rereview",
    intelligenceLabel: "Simulated local intelligence",
  },
  analyzerDissent: {
    id: "DEMO-DISSENT-01",
    subject: "Review the shared document",
    sender: "collaboration@partner.example",
    status: "escalated",
    minimumJustificationLength: 15,
    disagreementMessage: "Analysts disagree. Human review is required.",
  },
} as const;

export const demoModeLabel = "Demo mode";
export const demoDataLabel = "Demo data";

export const showcaseScenarioSteps = [
  {
    id: "trusted-sender",
    eyebrow: "Identity is not enough",
    title: "Trusted sender turns",
    problem: "The most dangerous email comes from someone you trust.",
    description:
      "A familiar sender passes authentication, then introduces a new link domain and changes bank details.",
  },
  {
    id: "link-drift",
    eyebrow: "Approval is evidence-bound",
    title: "Link changes after approval",
    problem: "A link can turn malicious after you approved it.",
    description:
      "A local observation changes after approval. Re-checking the evidence invalidates that decision.",
  },
  {
    id: "analyzer-dissent",
    eyebrow: "Keep the disagreement",
    title: "Analyzers disagree",
    problem: "Your analyzers disagree, and that disagreement should be seen.",
    description:
      "Verdicts remain separate, the incident escalates, and an analyst must document a justification.",
  },
] as const;
