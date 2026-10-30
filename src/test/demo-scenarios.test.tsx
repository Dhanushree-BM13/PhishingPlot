import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DemoScenarios } from "@/components/dashboard/demo-scenarios";
import { deriveDemoAlerts } from "@/lib/demo-alerts";
import { DemoStoreProvider, useDemoStore } from "@/lib/store";

function StoreProbe() {
  const store = useDemoStore();
  return (
    <div>
      <p>
        Approval state:{" "}
        {
          store.approvals.find(
            (approval) => approval.incidentId === store.demoIncidents.linkDrift.id,
          )?.state
        }
      </p>
      <p>
        Incident state:{" "}
        {
          store.incidents.find((incident) => incident.id === store.demoIncidents.linkDrift.id)
            ?.status
        }
      </p>
      <p>
        Dissent incident state:{" "}
        {
          store.incidents.find((incident) => incident.id === store.demoIncidents.analyzerDissent.id)
            ?.status
        }
      </p>
      <p>Recorded events: {store.auditEvents.length}</p>
      <p>Sample incidents: {store.incidents.length}</p>
      <p>Derived alerts: {deriveDemoAlerts(store.incidents, store.approvals).length}</p>
      <p>
        Credential approval state:{" "}
        {store.approvals.find((approval) => approval.incidentId === "DEMO-CREDENTIAL-02")?.state}
      </p>
      <p>
        Statement approval state:{" "}
        {store.approvals.find((approval) => approval.incidentId === "DEMO-STATEMENT-03")?.state}
      </p>
      <button
        onClick={() => {
          const approvalOffset =
            store.auditEventsFixture.events.find(
              (event) => event.type === "Approval recorded · Valid",
            )?.offsetMinutes ?? 0;
          store.advanceSimulatedTime(
            approvalOffset + store.linkObservationFixture.recheckAfterMinutes,
          );
        }}
        type="button"
      >
        Advance simulated time
      </button>
      <button
        onClick={() =>
          store.recordDecision(
            store.demoIncidents.analyzerDissent.id,
            "approved",
            "Reviewed the conflicting local evidence.",
          )
        }
        type="button"
      >
        Approve with justification
      </button>
      <p>Latest decision: {store.decisions.at(-1)?.decision ?? "none"}</p>
      <p>
        Dissent approval state:{" "}
        {
          store.approvals.find(
            (approval) => approval.incidentId === store.demoIncidents.analyzerDissent.id,
          )?.state
        }
      </p>
      <p>
        Verdicts:{" "}
        {store.analyzerVerdictFixture.verdicts
          .map((verdict) => `${verdict.level.toUpperCase()} ${verdict.score}`)
          .join(", ")}
      </p>
    </div>
  );
}

describe("dashboard demo scenarios", () => {
  it("shows fixture-backed scenario navigation inside the shared store", () => {
    render(
      <DemoStoreProvider>
        <DemoScenarios />
        <StoreProbe />
      </DemoStoreProvider>,
    );

    expect(screen.getByText("Demo data")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Walk through a demo scenario" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Dissent approval state: superseded")).toBeInTheDocument();
  });

  it("invalidates the link approval once the simulated fixture observation is reached", () => {
    render(
      <DemoStoreProvider>
        <StoreProbe />
      </DemoStoreProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Advance simulated time" }));

    expect(screen.getByText("Approval state: invalidated")).toBeInTheDocument();
    expect(screen.getByText("Incident state: needs_rereview")).toBeInTheDocument();
    expect(screen.getByText("Recorded events: 22")).toBeInTheDocument();
  });

  it("loads the additional demo incidents with matching approvals", () => {
    render(
      <DemoStoreProvider>
        <StoreProbe />
      </DemoStoreProvider>,
    );

    expect(screen.getByText("Sample incidents: 8")).toBeInTheDocument();
    expect(screen.getByText("Derived alerts: 8")).toBeInTheDocument();
    expect(screen.getByText("Credential approval state: stale")).toBeInTheDocument();
    expect(screen.getByText("Statement approval state: valid")).toBeInTheDocument();
    expect(screen.getByText("Dissent incident state: escalated")).toBeInTheDocument();
    expect(screen.getByText("Verdicts: HIGH 67, LOW 18, HIGH 82, HIGH 74")).toBeInTheDocument();
  });

  it("records justified decisions and resets them with the demo state", () => {
    render(
      <DemoStoreProvider>
        <StoreProbe />
      </DemoStoreProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Approve with justification" }));

    expect(screen.getByText("Approval state: valid")).toBeInTheDocument();
    expect(screen.getByText("Latest decision: approved")).toBeInTheDocument();
    expect(screen.getByText("Dissent incident state: approved")).toBeInTheDocument();
  });

  it("keeps the dissenting fixture verdicts separate", () => {
    render(
      <DemoStoreProvider>
        <StoreProbe />
      </DemoStoreProvider>,
    );

    expect(screen.getByText("Verdicts: HIGH 67, LOW 18, HIGH 82, HIGH 74")).toBeInTheDocument();
  });
});
