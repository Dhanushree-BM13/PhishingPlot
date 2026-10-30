import { Ban, Braces, Code2, Database, Layers3, Shield, Workflow } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useInView } from "@/hooks/use-in-view";
import { useDemoStore } from "@/lib/store";

const stack = [
  ["React 19", Code2, "PHISHPILOT uses React 19 to render the interactive showcase interface."],
  ["TypeScript", Braces, "TypeScript defines the shared frontend domain and fixture types."],
  [
    "TanStack Start",
    Layers3,
    "TanStack Start provides the application's route and rendering framework.",
  ],
  ["Vite", Workflow, "Vite powers local development and frontend builds."],
  ["Tailwind CSS", Code2, "Tailwind CSS supplies utility classes used to style the interface."],
  ["shadcn/ui", Layers3, "shadcn/ui primitives provide cards, badges, and alerts in the showcase."],
  [
    "FastAPI",
    Braces,
    "FastAPI is planned for a future backend; no endpoints are implemented yet.",
    "Planned",
  ],
  [
    "Supabase",
    Database,
    "Supabase is connected to the project, but this showcase reads local demo fixtures.",
    "Optional, connected",
  ],
] as const;

export default function TechStackBento() {
  const { ref, isInView } = useInView<HTMLElement>();
  const { demoDataLabel, demoFixtureSourceCount } = useDemoStore();
  const reveal = isInView ? "is-visible" : "";

  return (
    <section
      className={`showcase-reveal mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16 ${reveal}`}
      ref={ref}
    >
      <Badge className="border-status-analysis/30 bg-status-analysis/10 text-status-analysis">
        {demoDataLabel}
      </Badge>
      <h2 className="mt-5 text-3xl font-semibold tracking-[-0.04em] text-foreground sm:text-4xl">
        Built for transparent triage
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
        A concise view of the current application stack and what remains planned.
      </p>

      <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card
          className={`showcase-reveal col-span-1 rounded-sm border-border bg-card p-5 text-card-foreground shadow-none sm:col-span-2 lg:col-span-4 ${reveal}`}
        >
          <div className="flex items-center gap-2">
            <Shield className="size-4 text-status-analysis" aria-hidden="true" />
            <h3 className="text-sm font-semibold text-foreground">Application stack</h3>
          </div>
          <ul className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {stack.map(([name, Icon, description, status]) => {
              return (
                <li key={name}>
                  <Card
                    aria-label={`${name}: ${description}`}
                    className="group min-h-24 rounded-sm border-border bg-background p-3 shadow-none transition-colors hover:border-status-analysis/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    tabIndex={0}
                  >
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Icon className="size-3.5 text-status-analysis" aria-hidden="true" />
                      <span className="text-xs font-medium text-foreground">{name}</span>
                      {status && (
                        <Badge className="border-status-escalated/30 bg-status-escalated/10 px-1.5 text-[9px] text-status-escalated">
                          {status}
                        </Badge>
                      )}
                    </div>
                    <p className="mt-2 text-[11px] leading-4 text-muted-foreground opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:opacity-100">
                      {description}
                    </p>
                  </Card>
                </li>
              );
            })}
          </ul>
          <p className="mt-3 text-xs text-muted-foreground">
            Real agent orchestration is not implemented.
          </p>
        </Card>

        <Card
          className={`showcase-reveal rounded-sm border-border bg-card p-5 text-card-foreground shadow-none sm:col-span-2 lg:col-span-2 ${reveal}`}
          style={{ transitionDelay: "70ms" }}
        >
          <h3 className="text-base font-semibold text-foreground">Analysis is deterministic</h3>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Analyzers are pure functions with an injected clock; no network calls happen during
            analysis.
          </p>
        </Card>

        <Card
          className={`showcase-reveal rounded-sm border-border bg-card p-5 text-card-foreground shadow-none ${reveal}`}
          style={{ transitionDelay: "140ms" }}
        >
          <div className="flex items-center gap-2">
            <Ban className="size-4 text-status-escalated" aria-hidden="true" />
            <h3 className="text-base font-semibold text-foreground">Not implemented yet</h3>
          </div>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>Real agent orchestration</li>
            <li>Live link scanning</li>
            <li>Live email ingestion</li>
            <li>FastAPI endpoints</li>
          </ul>
        </Card>

        <Card
          className={`showcase-reveal rounded-sm border-border bg-card p-5 text-card-foreground shadow-none ${reveal}`}
          style={{ transitionDelay: "210ms" }}
        >
          <div className="flex items-center gap-2">
            <Database className="size-4 text-status-analysis" aria-hidden="true" />
            <h3 className="text-base font-semibold text-foreground">Demo fixtures</h3>
          </div>
          <Badge className="mt-4 border-status-analysis/30 bg-status-analysis/10 text-status-analysis">
            {demoDataLabel}
          </Badge>
          <p className="mt-3 font-mono text-2xl font-semibold text-foreground">
            {demoFixtureSourceCount}
          </p>
          <p className="text-xs text-muted-foreground">maintained fixture data sources</p>
        </Card>
      </div>
    </section>
  );
}
