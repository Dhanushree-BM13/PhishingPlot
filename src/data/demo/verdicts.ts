import type { AnalyzerId, RiskLevel } from "@/lib/types";

export interface DemoVerdictFixture {
  analyzerId: AnalyzerId;
  level: RiskLevel;
  score: number;
  rationale: string;
}

export const scenarioVerdicts = {
  trustedSender: {
    analyzerId: "sender_behavior",
    level: "high",
    score: 85,
    rationale:
      "The authenticated sender introduced an unseen link domain and a bank-detail change.",
  },
  dissent: [
    {
      analyzerId: "url_domain",
      level: "low",
      score: 18,
      rationale: "The current local URL fixture has no matching high-risk indicator.",
    },
    {
      analyzerId: "sender_behavior",
      level: "high",
      score: 82,
      rationale: "The sender's request deviates sharply from its behavioral baseline.",
    },
  ],
} satisfies {
  trustedSender: DemoVerdictFixture;
  dissent: [DemoVerdictFixture, DemoVerdictFixture];
};
