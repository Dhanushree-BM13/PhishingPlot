export interface DemoAuditEvent {
  offsetMinutes: number;
  type: string;
  detail: string;
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
  ] satisfies DemoAuditEvent[],
};
