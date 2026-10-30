import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { DemoStoreValue } from "@/lib/store";

type Props = Pick<DemoStoreValue, "demoIncidents" | "trustedSenderCaseFixture">;

export function EmailPreview({ demoIncidents, trustedSenderCaseFixture }: Props) {
  const incident = demoIncidents.trustedSender;
  const message = trustedSenderCaseFixture.thread;

  return (
    <Card className="min-w-0 rounded-sm shadow-none">
      <CardHeader className="border-b border-border p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-mono text-xs text-muted-foreground">
              {message.threadId} · Existing thread
            </p>
            <h3 className="mt-2 text-base font-semibold">{message.subject}</h3>
            <p className="mt-1 break-all text-sm text-muted-foreground">
              {message.from} <span aria-hidden="true">→</span> {message.to}
            </p>
          </div>
          <Badge className="border-status-escalated/30 bg-status-escalated/10 text-status-escalated">
            <span className="mr-1" aria-hidden="true">
              !
            </span>
            {incident.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 p-4">
        <dl className="grid gap-2 text-xs sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Reply-To</dt>
            <dd className="mt-1 break-all font-mono">{message.replyTo}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Sending infrastructure</dt>
            <dd className="mt-1 font-mono">{message.infrastructure}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Sent</dt>
            <dd className="mt-1 font-mono">{message.sentAt}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Authentication</dt>
            <dd className="mt-1 flex flex-wrap gap-2">
              {incident.authChecks.map((check) => (
                <span className="text-status-valid" key={check.name}>
                  {check.name}: {check.status}
                </span>
              ))}
            </dd>
          </div>
        </dl>
        <div className="border-t border-border pt-4 text-sm leading-7">
          {message.body.map((part, index) => (
            <span
              className={
                "emphasis" in part && part.emphasis === "link"
                  ? "rounded-sm border border-status-escalated/40 bg-status-escalated/10 px-1 font-mono text-status-escalated"
                  : "emphasis" in part && part.emphasis === "bank-detail"
                    ? "rounded-sm border border-status-invalid/40 bg-status-invalid/10 px-1 text-status-invalid"
                    : ""
              }
              key={`${part.text}-${index}`}
            >
              {part.text}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
