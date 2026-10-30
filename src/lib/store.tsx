import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

import { approvalFixtures, type DemoApprovalFixture } from "@/data/demo/approvals";
import { analyzerVerdictFixture } from "@/data/demo/analyzer-verdicts";
import { auditEventsFixture } from "@/data/demo/audit-events";
import {
  demoDataLabel,
  demoIncidents,
  demoModeLabel,
  showcaseScenarioSteps,
} from "@/data/demo/incidents";
import { demoFixtureSourceCount } from "@/data/demo/fixture-count";
import { linkObservationFixture } from "@/data/demo/link-observations";
import { senderBaselineFixture } from "@/data/demo/sender-baselines";
import { scenarioVerdicts } from "@/data/demo/verdicts";
import { trustedSenderCaseFixture } from "@/data/demo/trusted-sender-case";
import type { ApprovalDecision, IncidentStatus, RiskLevel } from "@/lib/types";

const clockEpoch = Date.parse(auditEventsFixture.simulatedClock);

export interface DemoIncident {
  id: string;
  subject: string;
  sender: string;
  reporter: "Demo analyst";
  receivedAt: string;
  status: IncidentStatus;
  risk: RiskLevel;
  riskScore: number;
}

export interface DemoAuditEvent {
  id: string;
  incidentId: string;
  offsetMinutes: number;
  timestamp: string;
  type: string;
  detail: string;
  actor: "Demo analyst";
}

export interface DemoDecision {
  id: string;
  incidentId: string;
  decision: ApprovalDecision;
  justification: string;
  decidedAt: string;
  fingerprint: string;
}

export interface DemoStoreValue {
  incidents: DemoIncident[];
  approvals: DemoApprovalFixture[];
  decisions: DemoDecision[];
  analyzerVerdictFixture: typeof analyzerVerdictFixture;
  analyzerVerdicts: typeof analyzerVerdicts;
  auditEvents: DemoAuditEvent[];
  auditEventsFixture: typeof auditEventsFixture;
  config: {
    rulesetVersion: string;
    approvalTtlMinutes: number | null;
    trustBreakThreshold: string;
  };
  demoDataLabel: string;
  demoModeLabel: string;
  demoFixtureSourceCount: number;
  demoIncidents: typeof demoIncidents;
  linkObservationFixture: typeof linkObservationFixture;
  scenarioVerdicts: typeof scenarioVerdicts;
  senderBaselineFixture: typeof senderBaselineFixture;
  showcaseScenarioSteps: typeof showcaseScenarioSteps;
  trustedSenderCaseFixture: typeof trustedSenderCaseFixture;
  elapsedMinutes: number;
  simulatedTime: Date;
  formatSimulatedTime: (timestamp: string) => string;
  advanceSimulatedTime: (minutes: number) => void;
  recordDecision: (incidentId: string, decision: ApprovalDecision, justification?: string) => void;
  recheckIncident: (incidentId: string) => { changed: boolean; fingerprint: string };
  resetDemo: () => void;
}

const DemoStoreContext = createContext<DemoStoreValue | null>(null);
const validLinkApproval = approvalFixtures.find(
  (approval) => approval.incidentId === demoIncidents.linkDrift.id,
);
const linkRecheckEventFixture = auditEventsFixture.events.find(
  (event) => event.type === "Link re-check run",
);
if (!linkRecheckEventFixture) {
  throw new Error("The demo audit fixture must include its link re-check event.");
}
const linkRecheckEventType = linkRecheckEventFixture.type;
const approvalRecordedOffset =
  auditEventsFixture.events.find((event) => event.type === "Approval recorded · Valid")
    ?.offsetMinutes ?? 0;
const linkRecheckOffset = approvalRecordedOffset + linkObservationFixture.recheckAfterMinutes;
const riskReviewerVerdict = analyzerVerdictFixture.verdicts.find(
  (verdict) => verdict.analyzerId === "risk_reviewer",
);
if (!riskReviewerVerdict) {
  throw new Error("The demo analyzer fixture must include its risk_reviewer verdict.");
}
const riskReviewerScore = riskReviewerVerdict.score;

const analyzerVerdicts = analyzerVerdictFixture.verdicts.map((verdict, index) => ({
  ...verdict,
  id: `DEMO-VERDICT-${index + 1}`,
  incidentId: demoIncidents.analyzerDissent.id,
}));

const approvalTtlMinutes =
  validLinkApproval?.decidedAt && validLinkApproval.expiresAt
    ? Math.round(
        (Date.parse(validLinkApproval.expiresAt) - Date.parse(validLinkApproval.decidedAt)) /
          60_000,
      )
    : null;

function formatSimulatedTime(timestamp: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(new Date(timestamp));
}

function fingerprintFor(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `demo-${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

function createActionEvent(
  incidentId: string,
  offsetMinutes: number,
  type: string,
  detail: string,
  id: string,
): DemoAuditEvent {
  return {
    id,
    incidentId,
    offsetMinutes,
    timestamp: new Date(clockEpoch + offsetMinutes * 60_000).toISOString(),
    type,
    detail,
    actor: "Demo analyst",
  };
}

function createInitialIncidents(): DemoIncident[] {
  return [
    {
      id: demoIncidents.trustedSender.id,
      subject: demoIncidents.trustedSender.subject,
      sender: demoIncidents.trustedSender.sender,
      reporter: "Demo analyst",
      receivedAt: trustedSenderCaseFixture.thread.sentAt,
      status: demoIncidents.trustedSender.status,
      risk: demoIncidents.trustedSender.risk,
      riskScore: trustedSenderCaseFixture.score,
    },
    {
      id: demoIncidents.linkDrift.id,
      subject: demoIncidents.linkDrift.subject,
      sender: "collaboration@partner.example",
      reporter: "Demo analyst",
      receivedAt: auditEventsFixture.simulatedClock,
      status: demoIncidents.linkDrift.status,
      risk: scenarioVerdicts.dissent[1].level,
      riskScore: scenarioVerdicts.dissent[1].score,
    },
    {
      id: demoIncidents.analyzerDissent.id,
      subject: demoIncidents.analyzerDissent.subject,
      sender: demoIncidents.analyzerDissent.sender,
      reporter: "Demo analyst",
      receivedAt: auditEventsFixture.simulatedClock,
      status: demoIncidents.analyzerDissent.status,
      risk: scenarioVerdicts.dissent[1].level,
      riskScore: riskReviewerScore,
    },
  ];
}

function createInitialAuditEvents(): DemoAuditEvent[] {
  return auditEventsFixture.events.map((event, index) => ({
    id: `DEMO-AUDIT-${index + 1}`,
    incidentId: demoIncidents.analyzerDissent.id,
    offsetMinutes: event.offsetMinutes,
    timestamp: new Date(clockEpoch + event.offsetMinutes * 60_000).toISOString(),
    type: event.type,
    detail: event.detail,
    actor: "Demo analyst",
  }));
}

export function DemoStoreProvider({ children }: { children: ReactNode }) {
  const [elapsedMinutes, setElapsedMinutes] = useState(0);
  const [incidents, setIncidents] = useState(createInitialIncidents);
  const [approvals, setApprovals] = useState(approvalFixtures);
  const [decisions, setDecisions] = useState<DemoDecision[]>([]);
  const [auditEvents, setAuditEvents] = useState(createInitialAuditEvents);

  const recordDecision = useCallback(
    (incidentId: string, decision: ApprovalDecision, justification = "") => {
      const incident = incidents.find((item) => item.id === incidentId);
      if (!incident) throw new Error(`No demo incident exists for ${incidentId}.`);
      const approval = approvals.find((item) => item.incidentId === incidentId);
      if (!approval) throw new Error(`No demo approval exists for incident ${incidentId}.`);

      const trimmedJustification = justification.trim();
      if (
        incidentId === demoIncidents.analyzerDissent.id &&
        decision === "approved" &&
        trimmedJustification.length < demoIncidents.analyzerDissent.minimumJustificationLength
      ) {
        throw new RangeError(
          `Approval requires at least ${demoIncidents.analyzerDissent.minimumJustificationLength} characters of justification.`,
        );
      }

      const timestamp = new Date(clockEpoch + elapsedMinutes * 60_000).toISOString();
      const fingerprint = fingerprintFor(
        `${incidentId}|${incident.risk}|${incident.riskScore}|${trimmedJustification}`,
      );
      const nextDecision: DemoDecision = {
        id: `DEMO-DECISION-${decisions.length + 1}`,
        incidentId,
        decision,
        justification: trimmedJustification,
        decidedAt: timestamp,
        fingerprint,
      };

      setDecisions((current) => [...current, nextDecision]);
      setIncidents((current) =>
        current.map((item) =>
          item.id === incidentId
            ? { ...item, status: decision === "approved" ? "approved" : "rejected" }
            : item,
        ),
      );
      setApprovals((current) =>
        current.map((item) =>
          item.incidentId === incidentId
            ? {
                ...item,
                state: decision === "approved" ? "valid" : "superseded",
                decidedAt: timestamp,
                expiresAt: new Date(
                  Date.parse(timestamp) + (approvalTtlMinutes ?? 120) * 60_000,
                ).toISOString(),
                fingerprint,
              }
            : item,
        ),
      );
      setAuditEvents((current) => {
        const events: DemoAuditEvent[] = [];
        if (trimmedJustification) {
          events.push(
            createActionEvent(
              incidentId,
              elapsedMinutes,
              "Justification saved",
              `The analyst recorded a ${trimmedJustification.length}-character justification.`,
              `DEMO-AUDIT-DECISION-${decisions.length + 1}-JUSTIFICATION`,
            ),
          );
        }
        events.push(
          createActionEvent(
            incidentId,
            elapsedMinutes,
            decision === "approved" ? "Approval recorded · Valid" : "Rejection recorded",
            decision === "approved"
              ? "The analyst decision was recorded against the current evidence."
              : "The analyst rejected the proposed action. No external action was executed.",
            `DEMO-AUDIT-DECISION-${decisions.length + 1}`,
          ),
        );
        return [...current, ...events];
      });
    },
    [approvals, decisions.length, elapsedMinutes, incidents],
  );

  const recheckIncident = useCallback(
    (incidentId: string) => {
      const approval = approvals.find((item) => item.incidentId === incidentId);
      if (!approval) throw new Error(`No demo approval exists for incident ${incidentId}.`);

      const isLinkDrift = incidentId === demoIncidents.linkDrift.id;
      const changed = isLinkDrift && elapsedMinutes >= linkRecheckOffset;
      const needsInvalidation =
        changed && approval.state !== linkObservationFixture.finalApprovalState;
      const fingerprint = needsInvalidation
        ? fingerprintFor(
            `${approval.fingerprint}|${linkObservationFixture.observations[1].localReputation}`,
          )
        : approval.fingerprint;
      const offsetMinutes = elapsedMinutes;

      if (needsInvalidation) {
        setApprovals((current) =>
          current.map((item) =>
            item.incidentId === incidentId
              ? { ...item, state: linkObservationFixture.finalApprovalState, fingerprint }
              : item,
          ),
        );
        setIncidents((current) =>
          current.map((item) =>
            item.id === incidentId ? { ...item, status: "needs_rereview" } : item,
          ),
        );
      }

      setAuditEvents((current) => {
        if (
          current.some(
            (event) =>
              event.incidentId === incidentId &&
              event.type === linkRecheckEventType &&
              event.offsetMinutes === offsetMinutes,
          )
        ) {
          return current;
        }
        const next = [
          ...current,
          createActionEvent(
            incidentId,
            offsetMinutes,
            linkRecheckEventType,
            changed
              ? linkObservationFixture.invalidatedMessage
              : isLinkDrift
                ? "The local demo observation remains clean; no network scan was performed."
                : "Local demo evidence was reviewed; no network scan was performed.",
            `DEMO-AUDIT-RECHECK-${incidentId}-${offsetMinutes}`,
          ),
        ];
        if (needsInvalidation) {
          next.push(
            createActionEvent(
              incidentId,
              offsetMinutes + 1,
              "Approval invalidated",
              "The approval no longer matches the changed local evidence.",
              `DEMO-AUDIT-INVALIDATED-${incidentId}-${offsetMinutes}`,
            ),
            createActionEvent(
              incidentId,
              offsetMinutes + 2,
              "Returned to Needs re-review",
              "The incident returned to the analyst queue for another decision.",
              `DEMO-AUDIT-REREVIEW-${incidentId}-${offsetMinutes}`,
            ),
          );
        }
        return next;
      });

      return { changed, fingerprint };
    },
    [approvals, elapsedMinutes],
  );

  const advanceSimulatedTime = useCallback(
    (minutes: number) => {
      if (!Number.isFinite(minutes) || minutes <= 0) {
        throw new RangeError("Simulated time can only advance by a positive number of minutes.");
      }

      const next = elapsedMinutes + minutes;
      setElapsedMinutes(next);
      const linkObservationChanged =
        elapsedMinutes < linkRecheckOffset && next >= linkRecheckOffset;
      if (linkObservationChanged) {
        setApprovals((currentApprovals) =>
          currentApprovals.map((approval) =>
            approval.incidentId === demoIncidents.linkDrift.id
              ? {
                  ...approval,
                  state: linkObservationFixture.finalApprovalState,
                  fingerprint: fingerprintFor(
                    `${approval.fingerprint}|${linkObservationFixture.observations[1].localReputation}`,
                  ),
                }
              : approval,
          ),
        );
        setIncidents((currentIncidents) =>
          currentIncidents.map((incident) =>
            incident.id === demoIncidents.linkDrift.id
              ? { ...incident, status: "needs_rereview" }
              : incident,
          ),
        );
        setAuditEvents((currentEvents) => {
          if (
            currentEvents.some(
              (event) =>
                event.incidentId === demoIncidents.linkDrift.id &&
                event.type === "Approval invalidated",
            )
          ) {
            return currentEvents;
          }
          const offset = linkRecheckOffset;
          return [
            ...currentEvents,
            createActionEvent(
              demoIncidents.linkDrift.id,
              offset,
              linkRecheckEventType,
              linkObservationFixture.invalidatedMessage,
              "DEMO-AUDIT-LINK-RECHECK",
            ),
            createActionEvent(
              demoIncidents.linkDrift.id,
              offset + 1,
              "Approval invalidated",
              "The earlier decision no longer matches the changed evidence.",
              "DEMO-AUDIT-LINK-INVALIDATED",
            ),
            createActionEvent(
              demoIncidents.linkDrift.id,
              offset + 2,
              "Returned to Needs re-review",
              "The incident returned to the analyst queue for another decision.",
              "DEMO-AUDIT-LINK-REREVIEW",
            ),
          ];
        });
      }

      const expired = approvals.filter(
        (approval) =>
          approval.state === "valid" &&
          !(linkObservationChanged && approval.incidentId === demoIncidents.linkDrift.id) &&
          Date.parse(approval.expiresAt) <= clockEpoch + next * 60_000,
      );
      if (expired.length) {
        setApprovals((currentApprovals) =>
          currentApprovals.map((approval) =>
            expired.some((item) => item.id === approval.id)
              ? { ...approval, state: "stale" }
              : approval,
          ),
        );
      }
      setAuditEvents((currentEvents) => [
        ...currentEvents,
        createActionEvent(
          demoIncidents.linkDrift.id,
          next,
          "Simulated time advanced",
          `Demo time advanced by ${minutes} minutes.`,
          `DEMO-AUDIT-TIME-${elapsedMinutes}-${next}`,
        ),
        ...expired.map((approval, index) =>
          createActionEvent(
            approval.incidentId,
            next + index,
            "Approval expired",
            "The approval reached its fixture-defined expiry time.",
            `DEMO-AUDIT-EXPIRED-${approval.id}-${next}`,
          ),
        ),
      ]);
    },
    [approvals, elapsedMinutes],
  );

  const resetDemo = useCallback(() => {
    setElapsedMinutes(0);
    setIncidents(createInitialIncidents());
    setApprovals(approvalFixtures);
    setDecisions([]);
    setAuditEvents(createInitialAuditEvents());
  }, []);

  const value = useMemo<DemoStoreValue>(
    () => ({
      incidents,
      approvals,
      decisions,
      analyzerVerdictFixture,
      analyzerVerdicts,
      auditEvents,
      auditEventsFixture,
      config: {
        rulesetVersion: trustedSenderCaseFixture.rulesetVersion,
        approvalTtlMinutes,
        trustBreakThreshold: "Not specified in demo fixtures",
      },
      demoDataLabel,
      demoModeLabel,
      demoFixtureSourceCount,
      demoIncidents,
      linkObservationFixture,
      scenarioVerdicts,
      senderBaselineFixture,
      showcaseScenarioSteps,
      trustedSenderCaseFixture,
      elapsedMinutes,
      simulatedTime: new Date(clockEpoch + elapsedMinutes * 60_000),
      formatSimulatedTime,
      advanceSimulatedTime,
      recordDecision,
      recheckIncident,
      resetDemo,
    }),
    [
      advanceSimulatedTime,
      approvals,
      auditEvents,
      decisions,
      elapsedMinutes,
      incidents,
      recordDecision,
      recheckIncident,
      resetDemo,
    ],
  );

  return <DemoStoreContext.Provider value={value}>{children}</DemoStoreContext.Provider>;
}

export function useDemoStore() {
  const store = useContext(DemoStoreContext);
  if (!store) throw new Error("useDemoStore must be used within DemoStoreProvider.");
  return store;
}
