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
];
