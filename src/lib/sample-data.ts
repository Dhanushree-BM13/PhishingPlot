import type { Agent, ApprovalItem, AuditEntry, Incident } from "./types";

// SAMPLE DATA ONLY — replaced by the API layer in src/lib/api.ts once the backend is live.
// Risk values here are analyst-assigned triage labels, not AI investigation output.
export const incidents: Incident[] = [
  {
    id: "INC-1042",
    subject: "Urgent: Verify your payroll account",
    sender: "hr-payroll@secure-pay.co",
    reporter: "a.sharma@company.com",
    receivedAt: "2026-10-30T05:12:00Z",
    status: "new",
    risk: "high",
    riskScore: null,
  },
  {
    id: "INC-1041",
    subject: "Shared document: Q4 Budget.xlsx",
    sender: "noreply@docs-share.net",
    reporter: "r.mehta@company.com",
    receivedAt: "2026-10-30T03:40:00Z",
    status: "investigating",
    risk: "medium",
    riskScore: null,
  },
  {
    id: "INC-1040",
    subject: "Your parcel could not be delivered",
    sender: "tracking@dhl-notice.info",
    reporter: "k.iyer@company.com",
    receivedAt: "2026-10-29T16:05:00Z",
    status: "awaiting_approval",
    risk: "medium",
    riskScore: null,
  },
  {
    id: "INC-1039",
    subject: "Team lunch Friday",
    sender: "events@company.com",
    reporter: "s.rao@company.com",
    receivedAt: "2026-10-29T11:22:00Z",
    status: "resolved",
    risk: "low",
    riskScore: null,
  },
  {
    id: "INC-1038",
    subject: "Password expires in 24 hours",
    sender: "it-support@micros0ft-login.com",
    reporter: "p.nair@company.com",
    receivedAt: "2026-10-28T09:48:00Z",
    status: "new",
    risk: null,
    riskScore: null,
  },
];

export const agents: Agent[] = [
  {
    id: "orchestrator",
    name: "Orchestrator Agent",
    role: "Plans the investigation and delegates tasks",
    status: "idle",
    lastRun: null,
  },
  {
    id: "header",
    name: "Header Analysis Agent",
    role: "Checks SPF, DKIM, DMARC and routing",
    status: "idle",
    lastRun: null,
  },
  {
    id: "url",
    name: "URL & Domain Agent",
    role: "Inspects links and domain reputation",
    status: "idle",
    lastRun: null,
  },
  {
    id: "attachment",
    name: "Attachment Agent",
    role: "Sandboxes and inspects attachments",
    status: "idle",
    lastRun: null,
  },
  {
    id: "content",
    name: "Content & Intent Agent",
    role: "Assesses social-engineering language",
    status: "idle",
    lastRun: null,
  },
  {
    id: "response",
    name: "Response Agent",
    role: "Proposes containment actions for approval",
    status: "idle",
    lastRun: null,
  },
];

export const approvals: ApprovalItem[] = [
  {
    id: "APR-210",
    incidentId: "INC-1040",
    action: "Quarantine message from all mailboxes",
    requestedBy: "Analyst · k.iyer",
    requestedAt: "2026-10-29T17:10:00Z",
  },
  {
    id: "APR-209",
    incidentId: "INC-1041",
    action: "Block sender domain docs-share.net",
    requestedBy: "Analyst · r.mehta",
    requestedAt: "2026-10-30T04:02:00Z",
  },
];

export const auditLogs: AuditEntry[] = [
  {
    id: "L-5",
    at: "2026-10-30T05:12:00Z",
    actor: "a.sharma",
    event: "Incident submitted",
    target: "INC-1042",
  },
  {
    id: "L-4",
    at: "2026-10-30T04:02:00Z",
    actor: "r.mehta",
    event: "Approval requested",
    target: "APR-209",
  },
  {
    id: "L-3",
    at: "2026-10-30T03:40:00Z",
    actor: "r.mehta",
    event: "Status changed → investigating",
    target: "INC-1041",
  },
  {
    id: "L-2",
    at: "2026-10-29T17:10:00Z",
    actor: "k.iyer",
    event: "Approval requested",
    target: "APR-210",
  },
  {
    id: "L-1",
    at: "2026-10-29T12:00:00Z",
    actor: "s.rao",
    event: "Incident resolved",
    target: "INC-1039",
  },
];
