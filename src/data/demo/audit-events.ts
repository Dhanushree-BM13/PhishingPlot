export interface DemoAuditEvent {
  offsetMinutes: number;
  type: string;
  detail: string;
  incidentId?: string;
}

export const auditEventsFixture = {
  simulatedClock: "2026-10-30T12:00:00Z",
  events: [
    {
      offsetMinutes: 0,
      type: "Analysis run",
      detail: "Offline analyzers produced separate verdicts for the incident.",
    },
    {
      offsetMinutes: 1,
      type: "Dissent recorded",
      detail: "url_domain LOW and sender_behavior HIGH were retained side by side.",
    },
    {
      offsetMinutes: 2,
      type: "Escalated",
      detail: "The disagreement moved the incident to analyst review.",
    },
    {
      offsetMinutes: 4,
      type: "Justification saved",
      detail: "The analyst documented why approval was appropriate.",
    },
    {
      offsetMinutes: 5,
      type: "Approval recorded · Valid",
      detail: "The analyst decision was recorded against the current evidence.",
    },
    {
      offsetMinutes: 95,
      type: "Link re-check run",
      detail: "A local demo observation changed from clean to malicious.",
    },
    {
      offsetMinutes: 96,
      type: "Approval invalidated",
      detail: "The earlier decision no longer matches the changed evidence.",
    },
    {
      offsetMinutes: 97,
      type: "Returned to Needs re-review",
      detail: "The incident returned to the analyst queue for another decision.",
    },
    {
      offsetMinutes: -18,
      type: "Analysis run",
      detail: "Offline demo analysis flagged an unfamiliar sign-in domain for review.",
      incidentId: "DEMO-CREDENTIAL-02",
    },
    {
      offsetMinutes: -10,
      type: "Approval expired",
      detail: "The sample approval reached its fixture-defined expiry time.",
      incidentId: "DEMO-CREDENTIAL-02",
    },
    {
      offsetMinutes: -5,
      type: "Analysis run",
      detail: "Offline demo analysis found no unusual request in the sample notice.",
      incidentId: "DEMO-STATEMENT-03",
    },
    {
      offsetMinutes: -2,
      type: "Approval recorded · Valid",
      detail: "A sample analyst decision was recorded for the low-risk notice.",
      incidentId: "DEMO-STATEMENT-03",
    },
    {
      offsetMinutes: -22,
      type: "Analysis run",
      detail: "Offline demo analysis flagged an unexpected macro-enabled attachment.",
      incidentId: "DEMO-ATTACHMENT-04",
    },
    {
      offsetMinutes: -12,
      type: "Needs review",
      detail: "The critical-risk sample was added to the analyst queue.",
      incidentId: "DEMO-ATTACHMENT-04",
    },
    {
      offsetMinutes: -9,
      type: "Analysis run",
      detail: "Offline demo analysis flagged a lookalike sender and account-confirmation request.",
      incidentId: "DEMO-IMPERSONATION-05",
    },
    {
      offsetMinutes: -6,
      type: "Awaiting approval",
      detail: "A synthetic proposal is waiting for a human decision.",
      incidentId: "DEMO-IMPERSONATION-05",
    },
    {
      offsetMinutes: -25,
      type: "Analysis run",
      detail: "Offline demo analysis flagged an unusual payment destination and urgency.",
      incidentId: "DEMO-PAYROLL-06",
    },
    {
      offsetMinutes: -21,
      type: "Rejection recorded",
      detail: "The sample proposal was rejected; no external action was executed.",
      incidentId: "DEMO-PAYROLL-06",
    },
  ] satisfies DemoAuditEvent[],
};
