import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";

import { useReducedMotion } from "@/lib/motion";

/** Animates a number from its previous value to `value`. */
export function CountUp({ value, duration = 900 }: { value: number; duration?: number }) {
  const reducedMotion = useReducedMotion();
  const [shown, setShown] = useState(reducedMotion ? value : 0);
  const from = useRef(0);

  useEffect(() => {
    if (reducedMotion) {
      setShown(value);
      from.current = value;
      return;
    }
    const start = performance.now();
    const origin = from.current;
    let frame = 0;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - progress) ** 3;
      setShown(Math.round(origin + (value - origin) * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
      else from.current = value;
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, duration, reducedMotion]);

  return <>{shown}</>;
}

const POINTS = 32;

function nextRate(previous = 18) {
  return Math.max(4, Math.min(38, previous + Math.round((Math.random() - 0.45) * 7)));
}

/** Simulated mail-gateway throughput, refreshed every two seconds. */
export function ThroughputSparkline() {
  const [series, setSeries] = useState<number[]>(() => {
    const seed: number[] = [18];
    for (let index = 1; index < POINTS; index += 1) seed.push(nextRate(seed[index - 1]));
    return seed;
  });

  useEffect(() => {
    const interval = window.setInterval(
      () => setSeries((current) => [...current.slice(1), nextRate(current[current.length - 1])]),
      2000,
    );
    return () => window.clearInterval(interval);
  }, []);

  const max = 40;
  const path = series
    .map((value, index) => `${(index / (POINTS - 1)) * 100},${30 - (value / max) * 28}`)
    .join(" L ");
  const latest = series[series.length - 1];

  return (
    <div className="w-full min-w-48">
      <div className="flex items-baseline justify-between gap-3">
        <p className="cg-eyebrow">Gateway throughput</p>
        <p className="font-mono text-xs">
          <span className="font-display text-2xl font-bold tabular-nums text-foreground">
            {latest}
          </span>{" "}
          <span className="text-muted-foreground">msg/min</span>
        </p>
      </div>
      <svg
        aria-hidden="true"
        className="mt-2 h-14 w-full"
        preserveAspectRatio="none"
        viewBox="0 0 100 30"
      >
        <path d={`M 0,30 L ${path} L 100,30 Z`} fill="rgb(198 244 50 / 10%)" />
        <path
          d={`M ${path}`}
          fill="none"
          stroke="var(--primary)"
          strokeWidth="1.2"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <p className="font-mono text-[0.62rem] uppercase text-muted-foreground">
        Simulated · updates every 2s
      </p>
    </div>
  );
}

export interface FeedEvent {
  id: string;
  tone: "critical" | "high" | "medium" | "low" | "ok";
  source: string;
  text: string;
  incidentId?: string;
}

const toneColor: Record<FeedEvent["tone"], string> = {
  critical: "var(--risk-critical)",
  high: "var(--risk-high)",
  medium: "var(--risk-medium)",
  low: "var(--risk-low)",
  ok: "var(--primary)",
};

const streamTemplates: Omit<FeedEvent, "id">[] = [
  { tone: "low", source: "gateway", text: "Batch of inbound mail scanned, no indicators" },
  {
    tone: "high",
    source: "proxy",
    text: "Blocked request to passwrd-reset-secure.example",
    incidentId: "DEMO-CREDENTIAL-02",
  },
  {
    tone: "ok",
    source: "triage",
    text: "Triage agent finished DEMO-STATEMENT-03 · LOW",
    incidentId: "DEMO-STATEMENT-03",
  },
  { tone: "medium", source: "identity", text: "Sign-in from new location flagged for review" },
  {
    tone: "critical",
    source: "risk",
    text: "Risk reviewer escalated DEMO-ATTACHMENT-04 · 94",
    incidentId: "DEMO-ATTACHMENT-04",
  },
  { tone: "low", source: "gateway", text: "User report received from finance@company.example" },
  {
    tone: "high",
    source: "behavior",
    text: "ap@partner.example broke its sender baseline",
    incidentId: "DEMO-TRUSTED-01",
  },
  { tone: "ok", source: "approval", text: "Approval fingerprint re-verified · unchanged" },
];

/** Event stream: seeded with real alerts, then simulated events arrive every few seconds. */
export function LiveFeed({ seed }: { seed: FeedEvent[] }) {
  const [events, setEvents] = useState<(FeedEvent & { at: string })[]>(() =>
    seed.map((event) => ({ ...event, at: "now" })),
  );
  const counter = useRef(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      const template = streamTemplates[counter.current % streamTemplates.length];
      counter.current += 1;
      if (!template) return;
      const at = new Date().toISOString().slice(11, 19);
      setEvents((current) =>
        [{ ...template, id: `live-${counter.current}`, at }, ...current].slice(0, 9),
      );
    }, 3500);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <ul className="divide-y divide-border">
      {events.map((event) => {
        const body = (
          <>
            <span
              className="mt-1.5 size-2 shrink-0"
              style={{ background: toneColor[event.tone] }}
            />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm">{event.text}</span>
              <span className="font-mono text-[0.64rem] uppercase text-muted-foreground">
                {event.source} · {event.at}
              </span>
            </span>
          </>
        );
        return (
          <li className="feed-item" key={event.id}>
            {event.incidentId ? (
              <Link
                className="dash-row flex gap-3 px-5 py-2.5"
                params={{ id: event.incidentId }}
                to="/incidents/$id"
              >
                {body}
              </Link>
            ) : (
              <div className="flex gap-3 px-5 py-2.5">{body}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
