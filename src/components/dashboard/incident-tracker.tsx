import { ArrowUpRight, CheckCircle2, CircleDot, Clock3, ScanSearch } from "lucide-react";
import { Link } from "@tanstack/react-router";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSectionReveal } from "@/lib/motion";
import { useDemoStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const stages = ["Received", "Analysis", "Human review", "Decision"] as const;

function stageFor(status: string) {
  if (status === "new") return 0;
  if (status === "investigating") return 1;
  if (status === "approved" || status === "rejected" || status === "resolved") return 3;
  return 2;
}

function stageLabel(status: string) {
  if (status === "needs_rereview") return "Fresh review";
  if (status === "awaiting_approval") return "Awaiting decision";
  return status.replaceAll("_", " ");
}

export function IncidentTracker() {
  const { incidents, auditEvents, formatSimulatedTime } = useDemoStore();
  const { ref, visible } = useSectionReveal<HTMLElement>();

  return (
    <section
      aria-labelledby="incident-tracker-title"
      className="section-reveal"
      data-visible={visible}
      ref={ref}
    >
      <Card className="overflow-hidden rounded-sm shadow-none">
        <CardHeader className="flex flex-row flex-wrap items-end justify-between gap-3 border-b border-border p-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-status-analysis">
              Investigation path · simulated
            </p>
            <CardTitle className="mt-1 text-sm" id="incident-tracker-title">
              Incident tracker
            </CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              Follow each sample from intake to its current review stage.
            </p>
          </div>
          <Badge className="border-border bg-secondary text-secondary-foreground">
            {incidents.length} tracked cases
          </Badge>
        </CardHeader>
        <CardContent className="divide-y divide-border p-0">
          {incidents.map((incident, rowIndex) => {
            const stage = stageFor(incident.status);
            const latestEvent = [...auditEvents]
              .filter((event) => event.incidentId === incident.id)
              .sort((left, right) => right.offsetMinutes - left.offsetMinutes)[0];
            const progress = (stage / (stages.length - 1)) * 100;
            const isClosed =
              incident.status === "approved" ||
              incident.status === "rejected" ||
              incident.status === "resolved";

            return (
              <Link
                className="tracker-row group grid gap-4 px-4 py-4 transition-colors hover:bg-secondary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:grid-cols-[minmax(12rem,1fr)_minmax(15rem,1.3fr)_auto]"
                key={incident.id}
                params={{ id: incident.id }}
                style={{
                  animationDelay: `${Math.min(rowIndex, 6) * 45}ms`,
                }}
                to="/incidents/$id"
              >
                <span className="min-w-0">
                  <span className="flex items-center gap-2">
                    {isClosed ? (
                      <CheckCircle2 aria-hidden="true" className="size-4 text-status-valid" />
                    ) : (
                      <CircleDot
                        aria-hidden="true"
                        className={cn(
                          "size-4",
                          incident.risk === "critical" || incident.status === "needs_rereview"
                            ? "text-status-invalid"
                            : "text-status-analysis",
                        )}
                      />
                    )}
                    <span className="truncate text-sm font-medium">{incident.subject}</span>
                  </span>
                  <span className="mt-1 block truncate font-mono text-[10px] text-muted-foreground">
                    {incident.id} · {incident.sender}
                  </span>
                </span>

                <span className="self-center">
                  <span aria-label={`Stage ${stage + 1} of ${stages.length}`} className="block">
                    <span className="relative grid grid-cols-4">
                      <span className="absolute left-[8%] right-[8%] top-[5px] h-px bg-border" />
                      <span
                        className="absolute left-[8%] top-[5px] h-px bg-status-analysis transition-[width] duration-500 ease-out motion-reduce:transition-none"
                        style={{
                          width: visible ? `${Math.max(0, progress * 0.84)}%` : "0%",
                        }}
                      />
                      {stages.map((label, index) => (
                        <span className="relative flex flex-col items-center gap-2" key={label}>
                          <span
                            className={cn(
                              "size-[11px] rounded-full border transition-colors duration-300 motion-reduce:transition-none",
                              index < stage
                                ? "border-status-analysis bg-status-analysis"
                                : index === stage
                                  ? "border-status-analysis bg-background ring-2 ring-status-analysis/20"
                                  : "border-border bg-background",
                            )}
                          />
                          <span
                            className={cn(
                              "text-[9px] sm:text-[10px]",
                              index === stage ? "text-foreground" : "text-muted-foreground",
                            )}
                          >
                            {label}
                          </span>
                        </span>
                      ))}
                    </span>
                  </span>
                </span>

                <span className="flex items-center justify-between gap-3 md:justify-end">
                  <Badge
                    className={cn(
                      "capitalize",
                      isClosed
                        ? "border-status-valid/30 bg-status-valid/10 text-status-valid"
                        : incident.status === "needs_rereview" || incident.status === "escalated"
                          ? "border-status-escalated/30 bg-status-escalated/10 text-status-escalated"
                          : "border-border bg-secondary text-secondary-foreground",
                    )}
                  >
                    {stageLabel(incident.status)}
                  </Badge>
                  {latestEvent ? (
                    <span
                      className="hidden items-center gap-1 font-mono text-[10px] text-muted-foreground lg:flex"
                      title={`${latestEvent.type} · ${formatSimulatedTime(latestEvent.timestamp)}`}
                    >
                      {latestEvent.offsetMinutes >= 0 ? (
                        <Clock3 aria-hidden="true" className="size-3" />
                      ) : (
                        <ScanSearch aria-hidden="true" className="size-3" />
                      )}
                      {latestEvent.type}
                    </span>
                  ) : (
                    <ArrowUpRight
                      aria-hidden="true"
                      className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 motion-reduce:transform-none"
                    />
                  )}
                </span>
              </Link>
            );
          })}
        </CardContent>
      </Card>
    </section>
  );
}
