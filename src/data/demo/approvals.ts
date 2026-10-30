import type { ApprovalState } from "@/lib/types";

export interface DemoApprovalFixture {
  id: string;
  incidentId: string;
  state: ApprovalState;
  decidedAt: string | null;
  expiresAt: string;
  fingerprint: string;
  approvedUrls: string[];
}

export const approvalFixtures: DemoApprovalFixture[] = [
  {
    id: "DEMO-APR-TRUSTED-01",
    incidentId: "DEMO-TRUSTED-01",
    state: "stale",
    decidedAt: null,
    expiresAt: "2026-10-30T10:29:00Z",
    fingerprint: "demo-trusted-sender-fingerprint",
    approvedUrls: ["https://remittance-update.example/portal"],
  },
  {
    id: "DEMO-APR-LINK-01",
    incidentId: "DEMO-LINK-DRIFT-01",
    state: "valid",
    decidedAt: "2026-10-30T12:05:00Z",
    expiresAt: "2026-10-30T14:00:00Z",
    fingerprint: "demo-link-drift-fingerprint",
    approvedUrls: ["https://secure-updates.example/document"],
  },
  {
    id: "DEMO-APR-DISSENT-01",
    incidentId: "DEMO-DISSENT-01",
    state: "superseded",
    decidedAt: "2026-10-30T12:05:00Z",
    expiresAt: "2026-10-30T12:20:00Z",
    fingerprint: "demo-dissent-fingerprint",
    approvedUrls: [],
  },
  {
    id: "DEMO-APR-CREDENTIAL-02",
    incidentId: "DEMO-CREDENTIAL-02",
    state: "stale",
    decidedAt: "2026-10-30T10:30:00Z",
    expiresAt: "2026-10-30T11:30:00Z",
    fingerprint: "demo-credential-fingerprint",
    approvedUrls: [],
  },
  {
    id: "DEMO-APR-STATEMENT-03",
    incidentId: "DEMO-STATEMENT-03",
    state: "valid",
    decidedAt: "2026-10-30T11:58:00Z",
    expiresAt: "2026-10-30T13:58:00Z",
    fingerprint: "demo-statement-fingerprint",
    approvedUrls: [],
  },
  {
    id: "DEMO-APR-ATTACHMENT-04",
    incidentId: "DEMO-ATTACHMENT-04",
    state: "stale",
    decidedAt: null,
    expiresAt: "2026-10-30T11:48:00Z",
    fingerprint: "demo-attachment-fingerprint",
    approvedUrls: [],
  },
  {
    id: "DEMO-APR-IMPERSONATION-05",
    incidentId: "DEMO-IMPERSONATION-05",
    state: "valid",
    decidedAt: "2026-10-30T11:51:00Z",
    expiresAt: "2026-10-30T13:51:00Z",
    fingerprint: "demo-impersonation-fingerprint",
    approvedUrls: ["https://access-collab.example/confirm"],
  },
  {
    id: "DEMO-APR-PAYROLL-06",
    incidentId: "DEMO-PAYROLL-06",
    state: "superseded",
    decidedAt: "2026-10-30T11:39:00Z",
    expiresAt: "2026-10-30T13:39:00Z",
    fingerprint: "demo-payroll-fingerprint",
    approvedUrls: [],
  },
];
