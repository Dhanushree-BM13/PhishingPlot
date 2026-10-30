import type { IncidentStatus, RiskLevel } from "@/lib/types";

export interface ShowcaseIncidentFixture {
  id: string;
  subject: string;
  sender: string;
  status: IncidentStatus;
  risk: RiskLevel;
}

export interface AdditionalIncidentFixture extends ShowcaseIncidentFixture {
  receivedAt: string;
  riskScore: number;
  summary: string;
  evidence: string[];
}

export const additionalIncidentFixtures: AdditionalIncidentFixture[] = [
  {
    id: "DEMO-CREDENTIAL-02",
    subject: "Review your shared workspace access",
    sender: "helpdesk@collab.example",
    status: "investigating",
    risk: "medium",
    riskScore: 56,
    receivedAt: "2026-10-30T11:42:00Z",
    summary:
      "A simulated credential prompt uses an unfamiliar sign-in domain and needs analyst review.",
    evidence: [
      "Sender display name matches the expected help desk label.",
      "Sign-in link uses the unfamiliar host access-collab.example.",
      "The sender has not requested credentials in the baseline sample.",
    ],
  },
  {
    id: "DEMO-STATEMENT-03",
    subject: "Your monthly statement is ready",
    sender: "notices@statements.example",
    status: "approved",
    risk: "low",
    riskScore: 12,
    receivedAt: "2026-10-30T11:55:00Z",
    summary:
      "A low-risk sample notice follows the expected sender pattern and contains no unusual request.",
    evidence: [
      "Sender and reply-to addresses match the sample baseline.",
      "Message contains no credential or payment request.",
      "No attachment is present in this synthetic email.",
    ],
  },
  {
    id: "DEMO-ATTACHMENT-04",
    subject: "Revised purchase order attached",
    sender: "orders@vendor.example",
    status: "new",
    risk: "critical",
    riskScore: 94,
    receivedAt: "2026-10-30T11:48:00Z",
    summary:
      "A synthetic purchase-order message includes an unexpected macro-enabled document and urgent instructions.",
    evidence: [
      "Unexpected attachment type: application/vnd.ms-word.document.macroEnabled.12.",
      "Urgent payment language is absent from the sample sender baseline.",
      "Do not open or execute attachments; this fixture does not contain a real file.",
    ],
  },
  {
    id: "DEMO-IMPERSONATION-05",
    subject: "Action required: confirm payroll account",
    sender: "payroll@company-support.example",
    status: "awaiting_approval",
    risk: "high",
    riskScore: 78,
    receivedAt: "2026-10-30T11:51:00Z",
    summary:
      "A synthetic payroll notice uses a lookalike sender domain and asks the recipient to confirm account details.",
    evidence: [
      "Sender domain differs from the internal payroll baseline.",
      "Message requests sensitive account confirmation.",
      "Reply-to does not match the visible sender.",
    ],
  },
  {
    id: "DEMO-PAYROLL-06",
    subject: "Urgent: release the revised payroll file",
    sender: "finance@partner.example",
    status: "rejected",
    risk: "medium",
    riskScore: 48,
    receivedAt: "2026-10-30T11:38:00Z",
    summary:
      "A synthetic payment request was rejected after its urgency and new destination account deviated from prior messages.",
    evidence: [
      "Sender is known, but the message asks to use a new payment destination.",
      "Urgency is unusual compared with the sender's sample history.",
      "The demo rejection records an analyst decision only.",
    ],
  },
];

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
