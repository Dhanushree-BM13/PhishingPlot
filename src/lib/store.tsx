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
import type { IncidentStatus, RiskLevel } from "@/lib/types";

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

export interface DemoStoreValue {
  incidents: DemoIncident[];
  approvals: DemoApprovalFixture[];
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
  const [auditEvents, setAuditEvents] = useState(createInitialAuditEvents);

  const advanceSimulatedTime = useCallback(
    (minutes: number) => {
      if (!Number.isFinite(minutes) || minutes <= 0) {
        throw new RangeError("Simulated time can only advance by a positive number of minutes.");
      }

      const next = elapsedMinutes + minutes;
      setElapsedMinutes(next);
      if (
        elapsedMinutes < linkObservationFixture.recheckAfterMinutes &&
        next >= linkObservationFixture.recheckAfterMinutes
      ) {
        setApprovals((currentApprovals) =>
          currentApprovals.map((approval) =>
            approval.incidentId === demoIncidents.linkDrift.id
              ? { ...approval, state: linkObservationFixture.finalApprovalState }
              : approval,
          ),
        );
        setIncidents((currentIncidents) =>
          currentIncidents.map((incident) =>
            incident.id === demoIncidents.linkDrift.id
              ? { ...incident, status: demoIncidents.linkDrift.status }
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
          const offset = linkObservationFixture.recheckAfterMinutes;
          return [
            ...currentEvents,
            {
              id: "DEMO-AUDIT-LINK-RECHECK",
              incidentId: demoIncidents.linkDrift.id,
              offsetMinutes: offset,
              timestamp: new Date(clockEpoch + offset * 60_000).toISOString(),
              type: linkRecheckEventType,
              detail: linkObservationFixture.invalidatedMessage,
              actor: "Demo analyst",
            },
          ];
        });
      }
    },
    [elapsedMinutes],
  );

  const resetDemo = useCallback(() => {
    setElapsedMinutes(0);
    setIncidents(createInitialIncidents());
    setApprovals(approvalFixtures);
    setAuditEvents(createInitialAuditEvents());
  }, []);

  const value = useMemo<DemoStoreValue>(
    () => ({
      incidents,
      approvals,
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
      resetDemo,
    }),
    [advanceSimulatedTime, approvals, auditEvents, elapsedMinutes, incidents, resetDemo],
  );

  return <DemoStoreContext.Provider value={value}>{children}</DemoStoreContext.Provider>;
}

export function useDemoStore() {
  const store = useContext(DemoStoreContext);
  if (!store) throw new Error("useDemoStore must be used within DemoStoreProvider.");
  return store;
}
