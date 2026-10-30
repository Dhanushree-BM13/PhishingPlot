import type { AnalyzerId, RiskLevel } from "@/lib/types";
import { demoIncidents } from "@/data/demo/incidents";
import { scenarioVerdicts } from "@/data/demo/verdicts";

export interface AnalyzerCardFixture {
  analyzerId: AnalyzerId;
  level: RiskLevel;
  score: number;
  confidence: number;
  rationale: string;
  signalIds: string[];
}

const [urlDomain, senderBehavior] = scenarioVerdicts.dissent;

export const analyzerVerdictFixture = {
  disagreement: {
    detected: true,
    message: demoIncidents.analyzerDissent.disagreementMessage,
  },
  verdicts: [
    {
      analyzerId: "triage",
      level: "high",
      score: 67,
      confidence: 0.87,
      rationale: "The message requests a bank-detail change and introduces a new link domain.",
      signalIds: ["BANK_DETAIL_CHANGE", "NEW_LINK_DOMAIN"],
    },
    {
      ...urlDomain,
      confidence: 0.76,
      signalIds: ["LOCAL_URL_CLEAN"],
    },
    {
      ...senderBehavior,
      confidence: 0.91,
      signalIds: ["NEW_LINK_DOMAIN", "BANK_DETAIL_CHANGE"],
    },
    {
      analyzerId: "risk_reviewer",
      level: "high",
      score: 74,
      confidence: 0.84,
      rationale:
        "The high sender-behavior verdict conflicts with the low URL verdict and requires human review.",
      signalIds: ["ANALYZER_DISAGREEMENT", "HUMAN_REVIEW_REQUIRED"],
    },
  ] satisfies AnalyzerCardFixture[],
} as const;

export const additionalIncidentVerdictFixtures = [
  {
    incidentId: "DEMO-CREDENTIAL-02",
    verdicts: [
      {
        analyzerId: "triage",
        level: "medium",
        score: 56,
        confidence: 0.82,
        rationale: "The message asks the recipient to confirm access through an unfamiliar host.",
        signalIds: ["UNFAMILIAR_SIGN_IN_DOMAIN", "CREDENTIAL_REQUEST"],
      },
      {
        analyzerId: "sender_behavior",
        level: "medium",
        score: 51,
        confidence: 0.78,
        rationale: "The sender's sample history contains no credential requests.",
        signalIds: ["NEW_CREDENTIAL_REQUEST"],
      },
    ],
  },
  {
    incidentId: "DEMO-STATEMENT-03",
    verdicts: [
      {
        analyzerId: "triage",
        level: "low",
        score: 12,
        confidence: 0.9,
        rationale: "The notice matches its sample sender pattern and makes no unusual request.",
        signalIds: ["KNOWN_SENDER_PATTERN", "NO_CREDENTIAL_REQUEST"],
      },
      {
        analyzerId: "url_domain",
        level: "low",
        score: 8,
        confidence: 0.88,
        rationale: "The sample notice uses its expected statement domain.",
        signalIds: ["KNOWN_LINK_DOMAIN"],
      },
    ],
  },
  {
    incidentId: "DEMO-ATTACHMENT-04",
    verdicts: [
      {
        analyzerId: "triage",
        level: "critical",
        score: 94,
        confidence: 0.93,
        rationale: "An unexpected macro-enabled attachment is paired with urgent payment language.",
        signalIds: ["MACRO_ENABLED_ATTACHMENT", "UNUSUAL_URGENCY"],
      },
      {
        analyzerId: "sender_behavior",
        level: "high",
        score: 81,
        confidence: 0.86,
        rationale: "The attachment type and urgency differ from the vendor's sample baseline.",
        signalIds: ["NEW_ATTACHMENT_TYPE", "URGENCY_DEVIATION"],
      },
    ],
  },
  {
    incidentId: "DEMO-IMPERSONATION-05",
    verdicts: [
      {
        analyzerId: "triage",
        level: "high",
        score: 78,
        confidence: 0.89,
        rationale: "The message requests payroll account confirmation from a lookalike sender.",
        signalIds: ["LOOKALIKE_SENDER", "SENSITIVE_ACCOUNT_REQUEST"],
      },
      {
        analyzerId: "sender_behavior",
        level: "high",
        score: 88,
        confidence: 0.91,
        rationale: "No prior sender baseline exists for this address.",
        signalIds: ["NO_SENDER_BASELINE", "REPLY_TO_MISMATCH"],
      },
    ],
  },
  {
    incidentId: "DEMO-PAYROLL-06",
    verdicts: [
      {
        analyzerId: "triage",
        level: "medium",
        score: 48,
        confidence: 0.8,
        rationale: "The request uses a new payment destination and unusual urgency.",
        signalIds: ["NEW_PAYMENT_DESTINATION", "UNUSUAL_URGENCY"],
      },
      {
        analyzerId: "sender_behavior",
        level: "medium",
        score: 44,
        confidence: 0.77,
        rationale: "The known sender's message differs from its prior payment requests.",
        signalIds: ["PAYMENT_PATTERN_DEVIATION"],
      },
    ],
  },
] satisfies {
  incidentId: string;
  verdicts: AnalyzerCardFixture[];
}[];
