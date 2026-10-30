import type { ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Ban,
  CheckCircle2,
  Clock3,
  FileClock,
  Link2,
  MailWarning,
  ScanSearch,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  Users,
  XCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useDemoStore } from "@/lib/store";

export const Route = createFileRoute("/_console/hurdle-guide")({
  head: () => ({ meta: [{ title: "Hurdle guide — PhishPilot" }] }),
  component: HurdleGuide,
});

const workflow = [
  { icon: MailWarning, label: "Report" },
  { icon: ScanSearch, label: "Triage" },
  { icon: Link2, label: "Investigate" },
  { icon: Users, label: "Risk review" },
  { icon: ShieldAlert, label: "Response" },
  { icon: UserCheck, label: "Human approval" },
  { icon: Clock3, label: "Re-check" },
  { icon: FileClock, label: "Audit" },
] as const;

const TRUST_BREAK = 25;

function HurdleGuide() {
  const store = useDemoStore();
  const trusted = store.trustedSenderCaseFixture;
  const [urlVerdict, senderVerdict] = store.scenarioVerdicts.dissent;
  const link = store.linkObservationFixture;

  return (
    <div className="cg-page space-y-8">
      <header className="cg-page-heading">
        <div>
          <p className="cg-eyebrow">THE HURDLE</p>
          <h1>The trusted sender turns</h1>
          <p>Three traps. Three answers. Click to show each one.</p>
        </div>
        <Badge className="cg-badge-demo">SYNTHETIC DATA</Badge>
      </header>

      <section aria-label="Workflow" className="cg-panel overflow-x-auto p-5">
        <ol className="guide-flow">
          {workflow.map(({ icon: Icon, label }, index) => (
            <li key={label} style={{ animationDelay: `${index * 120}ms` }}>
              <span className="guide-flow-icon">
                <Icon aria-hidden="true" className="size-5" />
              </span>
              <span className="guide-flow-label">{label}</span>
            </li>
          ))}
        </ol>
      </section>

      <div className="grid gap-5 xl:grid-cols-3">
        <ChallengeCard
          number="01"
          title="Trusted sender turns"
          trap="Hacked partner passes every check"
          say="Authentication says trusted. Behavior says compromised."
          action={<GuideLink to="/hurdle/trusted-sender">Open case study</GuideLink>}
        >
          <div className="flex flex-wrap gap-1.5">
            {["SPF", "DKIM", "DMARC"].map((check) => (
              <span className="guide-pill is-ok" key={check}>
                <CheckCircle2 aria-hidden="true" className="size-3" /> {check}
              </span>
            ))}
          </div>
          <div className="mt-4 space-y-2">
            {trusted.signals.map((signal, index) => (
              <div className="guide-bar-row" key={signal.id}>
                <span>{signal.id.replaceAll("_", " ").toLowerCase()}</span>
                <span className="guide-bar">
                  <span
                    style={{
                      width: `${signal.weight * 2.5}%`,
                      animationDelay: `${300 + index * 220}ms`,
                    }}
                  />
                </span>
                <span className="font-mono">+{signal.weight}</span>
              </div>
            ))}
          </div>
          <div className="guide-score">
            <span>
              Score <strong>{trusted.score}</strong>
              <small> · trust break at {TRUST_BREAK}</small>
            </span>
            <span className="guide-pill is-bad">HIGH</span>
          </div>
        </ChallengeCard>

        <ChallengeCard
          number="02"
          title="Link drifts after approval"
          trap="Clean link turns malicious later"
          say="When the evidence changes, the approval dies."
          action={
            <GuideLink incidentId={store.demoIncidents.linkDrift.id}>Open · press +2h</GuideLink>
          }
        >
          <div className="guide-timeline">
            <div className="guide-node is-ok">
              <ShieldCheck aria-hidden="true" className="size-5" />
              <span className="font-mono text-[0.65rem]">T0</span>
              <span>{link.observations[0].localReputation}</span>
            </div>
            <span className="guide-track" />
            <div className="guide-node is-bad">
              <Ban aria-hidden="true" className="size-5" />
              <span className="font-mono text-[0.65rem]">+{link.recheckAfterMinutes}m</span>
              <span>{link.observations[1].localReputation}</span>
            </div>
          </div>
          <div className="mt-5 flex items-center justify-center gap-3">
            <span className="guide-pill is-ok guide-strike">Approval valid</span>
            <ArrowRight aria-hidden="true" className="size-4 text-muted-foreground" />
            <span className="guide-pill is-bad">Invalidated</span>
          </div>
          <p className="mt-3 text-center font-mono text-[0.65rem] text-muted-foreground">
            fingerprint + expiry on every approval
          </p>
        </ChallengeCard>

        <ChallengeCard
          number="03"
          title="Analysts disagree"
          trap="Averaging hides the alarm"
          say="We don't average it away. A human decides, and says why."
          action={
            <GuideLink incidentId={store.demoIncidents.analyzerDissent.id}>
              Open · try Approve
            </GuideLink>
          }
        >
          <div className="flex items-end justify-center gap-6">
            <Gauge label="URL" level={urlVerdict.level} score={urlVerdict.score} />
            <span className="guide-neq">≠</span>
            <Gauge label="Sender" level={senderVerdict.level} score={senderVerdict.score} />
          </div>
          <div className="mt-5 flex items-center justify-center gap-3">
            <span className="guide-pill is-warn">
              <XCircle aria-hidden="true" className="size-3" /> Approve locked
            </span>
            <ArrowRight aria-hidden="true" className="size-4 text-muted-foreground" />
            <span className="guide-pill is-ok">
              <UserCheck aria-hidden="true" className="size-3" /> Reason ≥{" "}
              {store.demoIncidents.analyzerDissent.minimumJustificationLength} chars
            </span>
          </div>
        </ChallengeCard>
      </div>

      <section className="cg-panel flex flex-wrap items-center justify-between gap-4 p-5">
        <div>
          <p className="cg-eyebrow">SEE IT LIVE</p>
          <p className="mt-1 text-lg font-semibold">4 agents · real backend · approval gate</p>
        </div>
        <GuideLink to="/investigation">Investigate an email</GuideLink>
      </section>
    </div>
  );
}

function ChallengeCard({
  number,
  title,
  trap,
  say,
  action,
  children,
}: {
  number: string;
  title: string;
  trap: string;
  say: string;
  action: ReactNode;
  children: ReactNode;
}) {
  return (
    <article className="cg-panel guide-card flex flex-col p-5">
      <div className="flex items-baseline gap-3">
        <span className="guide-number">{number}</span>
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>
      <p className="mt-1 text-sm text-rose-300/90">Trap: {trap}</p>
      <div className="guide-visual">{children}</div>
      <p className="guide-say">“{say}”</p>
      <div className="mt-4">{action}</div>
    </article>
  );
}

function Gauge({ label, level, score }: { label: string; level: string; score: number }) {
  const tone = score >= 70 ? "is-bad" : score >= 40 ? "is-warn" : "is-ok";
  return (
    <div className="flex flex-col items-center gap-2">
      <span className={`guide-gauge ${tone}`}>
        <span style={{ height: `${score}%` }} />
      </span>
      <span className="font-mono text-xs">{score}</span>
      <span className={`guide-pill ${tone}`}>
        {label} · {level.toUpperCase()}
      </span>
    </div>
  );
}

function GuideLink({
  children,
  to,
  incidentId,
}: {
  children: ReactNode;
  to?: "/hurdle/trusted-sender" | "/investigation";
  incidentId?: string;
}) {
  return (
    <Button asChild className="cg-primary-button" size="sm">
      {incidentId ? (
        <Link params={{ id: incidentId }} to="/incidents/$id">
          {children} <ArrowRight aria-hidden="true" />
        </Link>
      ) : (
        <Link to={to ?? "/investigation"}>
          {children} <ArrowRight aria-hidden="true" />
        </Link>
      )}
    </Button>
  );
}
