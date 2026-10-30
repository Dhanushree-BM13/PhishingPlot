import { useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  LoaderCircle,
  ScanSearch,
  ShieldCheck,
} from "lucide-react";

import { BackendStatus } from "@/components/cyberguard/backend-status";
import { ActionApprovals, AgentPipeline } from "@/components/investigation/agent-pipeline";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  cyberguardApi,
  isCyberguardApiConfigured,
  type EmailAnalysisRequest,
  type EmailAnalysisResult,
} from "@/lib/cyberguard-api";

export const Route = createFileRoute("/_console/investigation")({
  head: () => ({ meta: [{ title: "Phishing Investigation — PhishPilot" }] }),
  component: Investigation,
});

const examples = [
  {
    label: "Password-reset phish",
    subject: "Your password expires today",
    sender: "it-support@company-helpdesk.example",
    body: "Your password expires in 2 hours. Reset it immediately to avoid account lockout.",
    urls: "https://passwrd-reset-secure.example/login",
  },
  {
    label: "Credential lure",
    subject: "Action required: confirm your account",
    sender: "support@account-check.example",
    body: "Your account will be suspended today. Verify your password and sign in immediately using the link below.",
    urls: "https://account-check.example/verify",
  },
  {
    label: "Trusted sender anomaly",
    subject: "Updated remittance details",
    sender: "ap@partner.example",
    body: "We changed our bank account. Please urgently send payment to the new account listed in the attached document.",
    urls: "https://remittance-update.example/details",
  },
  {
    label: "Routine notice",
    subject: "Your monthly statement is ready",
    sender: "notices@statements.example",
    body: "Your monthly statement is available in your usual account portal. No action is required.",
    urls: "https://statements.example/portal",
  },
] as const;

function analyzeLocally(input: EmailAnalysisRequest): EmailAnalysisResult {
  const text = `${input.subject}\n${input.body}`.toLowerCase();
  const indicators: string[] = [];
  const evidence: string[] = [];
  let score = 8;

  const checks: Array<{ terms: string[]; indicator: string; detail: string; weight: number }> = [
    {
      terms: ["urgent", "immediately", "today", "suspended", "expire"],
      indicator: "Urgency or pressure language",
      detail: "The message uses time pressure to encourage a quick response.",
      weight: 20,
    },
    {
      terms: ["password", "verify", "sign in", "credentials", "account"],
      indicator: "Credential or account request",
      detail: "The text references account access or asks the recipient to verify information.",
      weight: 25,
    },
    {
      terms: ["bank account", "remittance", "payment", "wire", "invoice"],
      indicator: "Payment or financial change",
      detail: "The message includes payment language or requests financial changes.",
      weight: 26,
    },
  ];

  for (const check of checks) {
    if (check.terms.some((term) => text.includes(term))) {
      score += check.weight;
      indicators.push(check.indicator);
      evidence.push(check.detail);
    }
  }

  if (input.urls.length > 0) {
    const senderDomain = input.sender.split("@")[1]?.toLowerCase();
    const unrelatedUrl = input.urls.some((url) => {
      try {
        const host = new URL(url).hostname.toLowerCase();
        return !senderDomain || !(host === senderDomain || host.endsWith(`.${senderDomain}`));
      } catch {
        return true;
      }
    });
    if (unrelatedUrl) {
      score += 24;
      indicators.push("Link domain differs from sender domain");
      evidence.push("At least one supplied URL does not match the visible sender's domain.");
    }
  }

  if (indicators.length === 0) {
    evidence.push("No configured demo rules matched the supplied message text.");
  }
  score = Math.min(100, score);
  return {
    riskScore: score,
    indicators,
    evidence,
    explanation:
      "This is a deterministic, local demonstration using a few text and domain heuristics. It is not an AI verdict, a URL reputation check, or a security decision.",
  };
}

function Investigation() {
  const [form, setForm] = useState({ subject: "", sender: "", body: "", urls: "" });
  const [result, setResult] = useState<EmailAnalysisResult | null>(null);
  const [resultSource, setResultSource] = useState<"simulated" | "backend" | null>(null);
  const [backendError, setBackendError] = useState("");
  const [analyzing, setAnalyzing] = useState(false);

  const fillExample = (example: (typeof examples)[number]) => {
    setForm({ ...example });
    setResult(null);
    setBackendError("");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload: EmailAnalysisRequest = {
      subject: form.subject.trim(),
      sender: form.sender.trim(),
      body: form.body.trim(),
      urls: form.urls
        .split(/\r?\n/)
        .map((url) => url.trim())
        .filter(Boolean),
    };
    setAnalyzing(true);
    setResult(null);
    setBackendError("");

    if (isCyberguardApiConfigured) {
      try {
        const analysis = await cyberguardApi.analyzeEmail(payload);
        setResult(analysis);
        setResultSource("backend");
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "The backend request failed unexpectedly.";
        setBackendError(`${message} Showing a clearly labeled local demo estimate instead.`);
        setResult(analyzeLocally(payload));
        setResultSource("simulated");
      } finally {
        setAnalyzing(false);
      }
      return;
    }

    setResult(analyzeLocally(payload));
    setResultSource("simulated");
    setAnalyzing(false);
  };

  const riskTone =
    result?.riskScore === undefined
      ? "text-foreground"
      : result.riskScore >= 75
        ? "text-rose-300"
        : result.riskScore >= 40
          ? "text-amber-300"
          : "text-emerald-300";

  return (
    <div className="cg-page space-y-5">
      <header className="cg-page-heading">
        <div>
          <p className="cg-eyebrow">MAIL DEFENSE / MANUAL TRIAGE</p>
          <h1>Phishing investigation</h1>
          <p>Inspect a supplied message and its links. No message is sent or opened externally.</p>
        </div>
        <BackendStatus />
      </header>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)]">
        <Card className="cg-panel">
          <CardHeader className="border-b border-white/5">
            <CardTitle className="flex items-center gap-2 text-sm">
              <ScanSearch aria-hidden="true" className="size-4 text-cyan-300" />
              Message evidence
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <div className="mb-5 flex flex-wrap gap-2">
              {examples.map((example) => (
                <Button
                  className="cg-example-button"
                  key={example.label}
                  onClick={() => fillExample(example)}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  {example.label}
                </Button>
              ))}
            </div>
            <form className="space-y-4" onSubmit={(event) => void handleSubmit(event)}>
              <label className="cg-field-label">
                Email subject
                <Input
                  onChange={(event) =>
                    setForm((current) => ({ ...current, subject: event.target.value }))
                  }
                  placeholder="Subject line"
                  required
                  value={form.subject}
                />
              </label>
              <label className="cg-field-label">
                Sender address
                <Input
                  onChange={(event) =>
                    setForm((current) => ({ ...current, sender: event.target.value }))
                  }
                  placeholder="sender@example.com"
                  required
                  type="email"
                  value={form.sender}
                />
              </label>
              <label className="cg-field-label">
                Email body
                <Textarea
                  className="min-h-36"
                  onChange={(event) =>
                    setForm((current) => ({ ...current, body: event.target.value }))
                  }
                  placeholder="Paste message text for local rule-based inspection."
                  required
                  value={form.body}
                />
              </label>
              <label className="cg-field-label">
                Suspicious URLs{" "}
                <span className="font-normal text-muted-foreground">(one per line)</span>
                <Textarea
                  className="min-h-20 font-mono text-xs"
                  onChange={(event) =>
                    setForm((current) => ({ ...current, urls: event.target.value }))
                  }
                  placeholder="https://example.com/path"
                  value={form.urls}
                />
              </label>
              <Button
                className="cg-primary-button w-full sm:w-auto"
                disabled={analyzing}
                type="submit"
              >
                {analyzing ? (
                  <LoaderCircle aria-hidden="true" className="animate-spin" />
                ) : (
                  <ScanSearch aria-hidden="true" />
                )}
                {analyzing ? "Analyzing…" : "Analyze email"}
                {!analyzing && <ArrowRight aria-hidden="true" />}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="cg-panel min-h-72">
          <CardHeader className="border-b border-white/5">
            <CardTitle className="flex items-center justify-between gap-2 text-sm">
              Analysis results
              {resultSource && (
                <Badge className={resultSource === "backend" ? "cg-badge-live" : "cg-badge-demo"}>
                  {resultSource === "backend" ? "LIVE BACKEND ANALYSIS" : "SIMULATED RESULT"}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            {!result ? (
              <div className="flex min-h-52 flex-col items-center justify-center text-center">
                <ShieldCheck aria-hidden="true" className="size-9 text-cyan-300/70" />
                <p className="mt-3 text-sm font-medium">Ready for analyst review</p>
                <p className="mt-1 max-w-xs text-xs leading-relaxed text-muted-foreground">
                  Load a fictional sample or provide message details to see findings.
                </p>
              </div>
            ) : (
              <div aria-live="polite" className="space-y-5">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="cg-eyebrow">RISK SCORE</p>
                    <p className={`cg-risk-score ${riskTone}`}>
                      {result.riskScore}
                      <span>/100</span>
                    </p>
                  </div>
                  <p className="pb-2 text-xs text-muted-foreground">
                    {result.risk
                      ? `${result.risk.toUpperCase()} risk`
                      : result.riskScore >= 75
                        ? "High risk"
                        : result.riskScore >= 40
                          ? "Review required"
                          : "Lower risk"}
                  </p>
                </div>
                <div className="cg-risk-track">
                  <span
                    className={
                      result.riskScore >= 75
                        ? "is-critical"
                        : result.riskScore >= 40
                          ? "is-warning"
                          : ""
                    }
                    style={{ width: `${result.riskScore}%` }}
                  />
                </div>

                {backendError && (
                  <p
                    className="rounded-lg border border-amber-300/20 bg-amber-300/5 p-3 text-xs text-amber-100"
                    role="status"
                  >
                    <AlertTriangle aria-hidden="true" className="mr-2 inline size-3.5" />
                    {backendError}
                  </p>
                )}
                <section>
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Suspicious indicators
                  </h2>
                  {result.indicators.length ? (
                    <ul className="mt-2 space-y-2">
                      {result.indicators.map((indicator) => (
                        <li className="flex items-center gap-2 text-sm" key={indicator}>
                          <AlertTriangle
                            aria-hidden="true"
                            className="size-3.5 shrink-0 text-amber-300"
                          />
                          {indicator}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 flex items-center gap-2 text-sm text-emerald-200">
                      <Check aria-hidden="true" className="size-4" />
                      No demo indicators matched.
                    </p>
                  )}
                </section>
                <section>
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Evidence & explanation
                  </h2>
                  <ul className="mt-2 space-y-2 text-xs leading-relaxed text-muted-foreground">
                    {result.evidence.map((item) => (
                      <li className="border-l border-cyan-300/30 pl-3" key={item}>
                        {item}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 border-t border-white/5 pt-3 text-xs leading-relaxed text-muted-foreground">
                    {result.explanation}
                  </p>
                </section>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      {result?.agents && <AgentPipeline agents={result.agents} />}
      {result?.recommendedActions && result.recommendedActions.length > 0 && (
        <ActionApprovals actions={result.recommendedActions} />
      )}
      <p className="text-xs leading-relaxed text-muted-foreground">
        <AlertTriangle aria-hidden="true" className="mr-1 inline size-3.5 text-amber-300" />
        {resultSource === "backend"
          ? "Agents use transparent, offline rules over synthetic logs. Links are never opened and no response action is executed."
          : "Local results use simple deterministic rules, not an AI model or URL reputation feed. Treat results as a UI demonstration, not security guidance."}
      </p>
    </div>
  );
}
