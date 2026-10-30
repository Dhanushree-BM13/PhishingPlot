import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DemoScenarios } from "@/components/dashboard/demo-scenarios";
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
      <p>Recorded events: {store.auditEvents.length}</p>
      <button
        onClick={() => store.advanceSimulatedTime(store.linkObservationFixture.recheckAfterMinutes)}
        type="button"
      >
        Advance simulated time
      </button>
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
    expect(screen.getByText("Approval state: valid")).toBeInTheDocument();
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
    expect(screen.getByText("Recorded events: 9")).toBeInTheDocument();
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
