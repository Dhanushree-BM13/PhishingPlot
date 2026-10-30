// Shared domain types. Shapes mirror the planned FastAPI / database schema.
export type RiskLevel = "low" | "medium" | "high" | "critical";
export type IncidentStatus =
  | "new"
  | "investigating"
  | "awaiting_approval"
  | "resolved"
  | "escalated"
  | "needs_rereview"
  | "approved"
  | "rejected";
export type AgentStatus = "idle" | "queued" | "running" | "completed" | "failed";
export type AnalyzerId = "triage" | "url_domain" | "sender_behavior" | "risk_reviewer";
export type ApprovalState = "valid" | "stale" | "invalidated" | "superseded";
export type ApprovalDecision = "approved" | "rejected";

export interface AnalyzerSignal {
  id: string;
  weight: number;
  detail: string;
}

export interface AnalyzerVerdict {
  analyzerId: AnalyzerId;
  level: RiskLevel;
  score: number;
  confidence: number;
  signals: AnalyzerSignal[];
  rationale: string;
  rulesetVersion: string;
}

export interface EmailRecord {
  senderAddress: string;
  subject: string;
  body: string;
  sentAt: string;
  urls: string[];
  attachmentTypes: string[];
  replyTo?: string;
  infraFingerprint?: string;
  threadId?: string;
  authenticated?: boolean;
}

export interface SenderBaseline {
  senderAddress: string;
  sampleSize: number;
  knownLinkDomains: string[];
  knownAttachmentTypes: string[];
  knownReplyTo: string[];
  knownInfraFingerprints: string[];
  sendHourRange: [number, number];
  hasRequestedPayment: boolean;
  hasRequestedCredentials: boolean;
  hasRequestedBankDetailChanges: boolean;
  medianLength: number;
  urgencyRate: number;
}

export interface DisagreementReport {
  hasDisagreement: boolean;
  spread: number;
  pairs: {
    a: string;
    b: string;
    levelA: RiskLevel;
    levelB: RiskLevel;
    rationaleA?: string;
    rationaleB?: string;
  }[];
  summary: string;
}

export interface ApprovalSnapshot {
  id: string;
  incidentId: string;
  decision: ApprovalDecision;
  fingerprint: string;
  approvedUrls: string[];
  decidedAt: string;
  expiresAt: string;
  rulesetVersion: string;
  verdictsSnapshot: AnalyzerVerdict[];
  disagreement?: DisagreementReport;
  justification?: string;
  decidedBy: string;
}

export interface SenderBehaviorAnalysis {
  baseline: SenderBaseline;
  deviationScore: number;
  trustDiscountApplied: boolean;
  trustDiscountRemoved: boolean;
  verdict: AnalyzerVerdict;
}

export type AuditEventType =
  "APPROVAL_EXPIRED" | "APPROVAL_INVALIDATED" | "DISSENT_RECORDED" | "RECHECK_RUN";

export interface Incident {
  id: string;
  subject: string;
  sender: string;
  reporter: string;
  receivedAt: string;
  status: IncidentStatus;
  /** Risk is null until the backend analysis pipeline produces a real score. */
  risk: RiskLevel | null;
  riskScore: number | null;
  evidence?: string[];
  recommendation?: string | null;
  analyzerVerdicts?: AnalyzerVerdict[];
  senderBehavior?: SenderBehaviorAnalysis;
}

export interface Agent {
  id: string;
  name: string;
  role: string;
  status: AgentStatus;
  lastRun: string | null;
}

export interface ApprovalItem {
  id: string;
  incidentId: string;
  action: string;
  requestedBy: string;
  requestedAt: string;
  status?: "pending" | "approved" | "rejected";
}

export interface AuditEntry {
  id: string;
  at: string;
  actor: string;
  event: string;
  target: string;
  eventType?: AuditEventType;
  details?: Record<string, unknown>;
}
