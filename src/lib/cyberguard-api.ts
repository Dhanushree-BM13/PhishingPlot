import { z } from "zod";

const apiBaseUrl = import.meta.env["VITE_CYBERGUARD_API_URL"]?.replace(/\/+$/, "");

const healthSchema = z.object({
  status: z.enum(["ok", "degraded"]),
  version: z.string().optional(),
  database: z.enum(["connected", "not_configured", "error"]).optional(),
});

const savedInvestigationSchema = z.object({
  id: z.string(),
  createdAt: z.string(),
  subject: z.string(),
  sender: z.string(),
  risk: z.enum(["low", "medium", "high", "critical"]),
  riskScore: z.number(),
  status: z.string(),
});

const investigationAuditSchema = z.object({
  at: z.string(),
  event: z.string(),
  detail: z.string(),
});

const incidentSchema = z.object({
  id: z.string(),
  subject: z.string(),
  sender: z.string(),
  status: z.string(),
  risk: z.enum(["low", "medium", "high", "critical"]).nullable(),
  riskScore: z.number().min(0).max(100).nullable(),
  receivedAt: z.string().optional(),
  evidence: z.array(z.string()).optional(),
});

const agentSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.string(),
  status: z.enum(["idle", "queued", "running", "completed", "failed"]),
  lastRun: z.string().nullable().optional(),
  task: z.string().optional(),
  progress: z.number().min(0).max(100).optional(),
  findings: z.array(z.string()).optional(),
});

const approvalSchema = z.object({
  id: z.string(),
  incidentId: z.string(),
  action: z.string(),
  requestedBy: z.string(),
  requestedAt: z.string(),
  status: z.enum(["pending", "approved", "rejected"]),
  evidence: z.array(z.string()).optional(),
  impact: z.string().optional(),
});

const auditEntrySchema = z.object({
  id: z.string(),
  at: z.string(),
  actor: z.string(),
  event: z.string(),
  target: z.string(),
  details: z.record(z.string(), z.unknown()).optional(),
});

const investigationAgentSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.enum(["completed", "failed"]),
  task: z.string(),
  evidence: z.array(z.string()),
  reasoning: z.string(),
  confidence: z.number().min(0).max(1),
  durationMs: z.number().nonnegative(),
});

const recommendedActionSchema = z.object({
  id: z.string(),
  title: z.string(),
  target: z.string(),
  impact: z.string(),
  status: z.literal("pending_approval"),
  recordId: z.string().nullable().optional(),
});

const analysisSchema = z.object({
  risk: z.enum(["low", "medium", "high", "critical"]).optional(),
  riskScore: z.number().min(0).max(100),
  indicators: z.array(z.string()),
  evidence: z.array(z.string()),
  explanation: z.string(),
  incidentId: z.string().optional(),
  persisted: z.boolean().optional(),
  agents: z.array(investigationAgentSchema).optional(),
  recommendedActions: z.array(recommendedActionSchema).optional(),
});

export type SavedInvestigation = z.infer<typeof savedInvestigationSchema>;
export type InvestigationAuditEntry = z.infer<typeof investigationAuditSchema>;

export type CyberguardIncident = z.infer<typeof incidentSchema>;
export type CyberguardAgent = z.infer<typeof agentSchema>;
export type CyberguardApproval = z.infer<typeof approvalSchema>;
export type CyberguardAuditEntry = z.infer<typeof auditEntrySchema>;
export type EmailAnalysisRequest = {
  subject: string;
  sender: string;
  body: string;
  urls: string[];
};
export type EmailAnalysisResult = z.infer<typeof analysisSchema>;
export type InvestigationAgent = z.infer<typeof investigationAgentSchema>;
export type RecommendedAction = z.infer<typeof recommendedActionSchema>;

export const isCyberguardApiConfigured = Boolean(apiBaseUrl);

async function request<T>(path: string, schema: z.ZodType<T>, init?: RequestInit): Promise<T> {
  if (!apiBaseUrl) {
    throw new Error("Backend API is not configured. Set VITE_CYBERGUARD_API_URL to enable it.");
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...init?.headers,
    },
    signal: init?.signal ?? AbortSignal.timeout(8000),
  });

  if (!response.ok) {
    throw new Error(`Backend API returned HTTP ${response.status} for ${path}.`);
  }

  const payload: unknown = await response.json();
  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    throw new Error(`Backend API returned an invalid response for ${path}.`);
  }
  return parsed.data;
}

export const cyberguardApi = {
  health: () => request("/api/health", healthSchema),
  getDashboard: () =>
    request(
      "/api/dashboard",
      z.object({
        totalEmailsAnalyzed: z.number().nonnegative(),
        phishingIncidents: z.number().nonnegative(),
        criticalThreats: z.number().nonnegative(),
        pendingApprovals: z.number().nonnegative(),
      }),
    ),
  listIncidents: () => request("/api/incidents", z.array(incidentSchema)),
  listAgents: () => request("/api/agents", z.array(agentSchema)),
  listApprovals: () => request("/api/approvals", z.array(approvalSchema)),
  listAuditLogs: () => request("/api/audit", z.array(auditEntrySchema)),
  analyzeEmail: (input: EmailAnalysisRequest) =>
    request("/api/analyze", analysisSchema, {
      method: "POST",
      body: JSON.stringify(input),
    }),
  listInvestigations: () => request("/api/investigations", z.array(savedInvestigationSchema)),
  investigationAudit: (investigationId: string) =>
    request(
      `/api/investigations/${encodeURIComponent(investigationId)}/audit`,
      z.array(investigationAuditSchema),
    ),
  decideAction: (investigationId: string, actionId: string, decision: "approved" | "rejected") =>
    request(
      `/api/investigations/${encodeURIComponent(investigationId)}/actions/${encodeURIComponent(actionId)}/decision`,
      z.object({ id: z.string(), status: z.string(), decidedAt: z.string().nullable() }),
      { method: "POST", body: JSON.stringify({ decision }) },
    ),
};
