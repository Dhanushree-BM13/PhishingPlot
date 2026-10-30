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
