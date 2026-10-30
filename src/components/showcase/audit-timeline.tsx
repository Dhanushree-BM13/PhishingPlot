import {
  AlertCircle,
  Check,
  Clock3,
  FileCheck2,
  Link2,
  ListChecks,
  MessageSquareWarning,
  RotateCcw,
  ShieldAlert,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useInView } from "@/hooks/use-in-view";
import { useDemoStore } from "@/lib/store";

const eventIcons = [
  ListChecks,
  MessageSquareWarning,
  ShieldAlert,
  FileCheck2,
  Check,
  Link2,
  AlertCircle,
  RotateCcw,
];

function relativeTime(offsetMinutes: number) {
  const hours = Math.floor(offsetMinutes / 60);
  const minutes = offsetMinutes % 60;
  return `T+${hours ? `${hours}h ` : ""}${minutes}m`;
}

export default function AuditTimeline() {
  const { ref, isInView } = useInView<HTMLElement>();
  const { auditEventsFixture, demoDataLabel } = useDemoStore();
  const clockLabel = auditEventsFixture.simulatedClock.replace("T", " ").replace(":00Z", " UTC");

  return (
    <section
      className={`showcase-reveal mx-auto max-w-7xl px-5 pb-24 pt-12 sm:px-8 sm:pb-32 ${isInView ? "is-visible" : ""}`}
      ref={ref}
    >
      <Badge className="border-primary/25 bg-primary/8 text-primary">{demoDataLabel}</Badge>
      <div className="mt-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl">
            Audit timeline
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
            Fixture events are shown relative to a simulated clock, never the current time.
          </p>
        </div>
        <Badge className="border-white/10 bg-white/[0.04] text-slate-300">
          <Clock3 className="mr-1 size-3" aria-hidden="true" />
          Simulated · {clockLabel}
        </Badge>
      </div>

      <Card className="mt-7 rounded-2xl border-white/10 bg-[#10131d] p-5 shadow-none sm:p-8">
        <ol className="relative space-y-0 before:absolute before:bottom-5 before:left-[15px] before:top-5 before:w-px before:bg-white/10">
          {auditEventsFixture.events.map((event, index) => {
            const Icon = eventIcons[index] ?? Clock3;
            return (
              <li
                className={`showcase-reveal relative grid grid-cols-[32px_1fr] gap-3 pb-6 last:pb-0 sm:grid-cols-[40px_1fr] sm:gap-4 ${isInView ? "is-visible" : ""}`}
                key={`${event.offsetMinutes}-${event.type}`}
                style={{ transitionDelay: `${index * 70}ms` }}
              >
                <span className="z-10 flex size-8 items-center justify-center rounded-full border border-primary/25 bg-[#10131d] text-primary sm:size-9">
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <div className="min-w-0 rounded-xl border border-white/8 bg-black/20 p-3 sm:p-4">
                  <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                    <h3 className="text-sm font-semibold text-white">{event.type}</h3>
                    <time className="font-mono text-xs text-primary">
                      {relativeTime(event.offsetMinutes)}
                    </time>
                  </div>
                  <p className="mt-1 text-sm leading-6 text-slate-400">{event.detail}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </Card>
      <p className="mt-4 rounded-xl border border-white/8 bg-white/[0.02] px-4 py-3 text-xs leading-relaxed text-slate-400">
        Approval records a decision only. No external action is executed.
      </p>
    </section>
  );
}
