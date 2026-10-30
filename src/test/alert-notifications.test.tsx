import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const toastMock = vi.hoisted(() =>
  Object.assign(vi.fn(), {
    error: vi.fn(),
    success: vi.fn(),
    warning: vi.fn(),
  }),
);

vi.mock("sonner", () => ({ toast: toastMock }));

import { DemoAlertNotifications } from "@/components/demo-alert-notifications";
import { DemoStoreProvider, useDemoStore } from "@/lib/store";

function ScenarioControls() {
  const { advanceSimulatedTime, recordDecision } = useDemoStore();
  return (
    <>
      <button onClick={() => advanceSimulatedTime(120)} type="button">
        Advance demo clock
      </button>
      <button
        onClick={() =>
          recordDecision(
            "DEMO-DISSENT-01",
            "approved",
            "I reviewed the conflicting local evidence.",
          )
        }
        type="button"
      >
        Record approval
      </button>
    </>
  );
}

describe("demo alert notifications", () => {
  beforeEach(() => {
    toastMock.mockClear();
    toastMock.error.mockClear();
    toastMock.success.mockClear();
    toastMock.warning.mockClear();
  });

  it("shows red risk and evidence-change alerts, then a green decision confirmation", async () => {
    render(
      <DemoStoreProvider>
        <DemoAlertNotifications />
        <ScenarioControls />
      </DemoStoreProvider>,
    );

    await waitFor(() => {
      expect(toastMock.error).toHaveBeenCalledWith(
        "Critical-risk incident",
        expect.objectContaining({
          action: expect.objectContaining({ label: "Review case" }),
        }),
      );
    });

    toastMock.error.mockClear();
    fireEvent.click(screen.getByRole("button", { name: "Advance demo clock" }));

    await waitFor(() => {
      expect(toastMock.error).toHaveBeenCalledWith(
        "Approval invalidated",
        expect.objectContaining({
          description: expect.stringContaining("simulated evidence changed"),
        }),
      );
      expect(toastMock.warning).toHaveBeenCalledWith("Approval expired", expect.any(Object));
    });

    fireEvent.click(screen.getByRole("button", { name: "Record approval" }));

    await waitFor(() => {
      expect(toastMock.success).toHaveBeenCalledWith(
        "Case approved",
        expect.objectContaining({
          description: expect.stringContaining("Decision recorded"),
        }),
      );
    });
  });
});
