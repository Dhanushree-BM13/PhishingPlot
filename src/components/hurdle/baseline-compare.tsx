import { ArrowRight, Check, CircleAlert } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { DemoStoreValue } from "@/lib/store";

type Props = Pick<DemoStoreValue, "senderBaselineFixture" | "trustedSenderCaseFixture">;

function ComparisonValue({ value, changed }: { value: string; changed: boolean }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      {changed ? (
        <Badge className="gap-1 border-status-escalated/30 bg-status-escalated/10 text-status-escalated">
          <CircleAlert aria-hidden="true" className="size-3" />
          Changed
        </Badge>
      ) : (
        <Check aria-label="Matches baseline" className="size-4 text-status-valid" />
      )}
      <span className="break-all font-mono text-xs">{value}</span>
    </span>
  );
}

export function BaselineCompare({ senderBaselineFixture, trustedSenderCaseFixture }: Props) {
  const current = trustedSenderCaseFixture.thread;
  const rows = [
    {
      label: "Link domain",
      prior: senderBaselineFixture.knownLinkDomains.join(", "),
      current: current.linkDomain,
    },
    {
      label: "Reply-To",
      prior: senderBaselineFixture.knownReplyTo.join(", "),
      current: current.replyTo,
    },
    {
      label: "Sending infrastructure",
      prior: senderBaselineFixture.knownInfraFingerprints.join(", "),
      current: current.infrastructure,
    },
    {
      label: "Send hour",
      prior: `${senderBaselineFixture.sendHourRange[0]}–${senderBaselineFixture.sendHourRange[1]} UTC`,
      current: `${current.sendHourUtc}:00 UTC`,
    },
    {
      label: "Payment request",
      prior: senderBaselineFixture.hasRequestedPayment ? "Seen before" : "Not seen",
      current: current.requestsPayment ? "Requested" : "Not requested",
      changed: current.requestsPayment !== senderBaselineFixture.hasRequestedPayment,
    },
    {
      label: "Credential request",
      prior: senderBaselineFixture.hasRequestedCredentials ? "Seen before" : "Not seen",
      current: current.requestsCredentials ? "Requested" : "Not requested",
      changed: current.requestsCredentials !== senderBaselineFixture.hasRequestedCredentials,
    },
  ];

  return (
    <Card className="min-w-0 rounded-sm shadow-none">
      <CardHeader className="border-b border-border p-4">
        <h3 className="text-sm font-semibold">Baseline vs. this message</h3>
        <p className="text-xs text-muted-foreground">
          Summary of {senderBaselineFixture.sampleSize} prior benign messages.
        </p>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead className="border-b border-border text-xs text-muted-foreground">
              <tr>
                <th className="p-3 font-medium">Signal</th>
                <th className="p-3 font-medium">Prior messages</th>
                <th className="p-3 font-medium">This message</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((row) => {
                const changed =
                  row.changed ??
                  (row.label === "Link domain"
                    ? !senderBaselineFixture.knownLinkDomains.includes(current.linkDomain)
                    : row.label === "Send hour"
                      ? current.sendHourUtc < senderBaselineFixture.sendHourRange[0] ||
                        current.sendHourUtc > senderBaselineFixture.sendHourRange[1]
                      : row.label === "Reply-To"
                        ? !senderBaselineFixture.knownReplyTo.includes(current.replyTo)
                        : row.label === "Sending infrastructure"
                          ? !senderBaselineFixture.knownInfraFingerprints.includes(
                              current.infrastructure,
                            )
                          : false);
                return (
                  <tr key={row.label}>
                    <th className="p-3 font-medium">{row.label}</th>
                    <td className="p-3 text-muted-foreground">{row.prior}</td>
                    <td className="p-3">
                      <span className="flex items-center gap-2">
                        <ArrowRight
                          aria-hidden="true"
                          className="size-3 shrink-0 text-muted-foreground"
                        />
                        <ComparisonValue changed={changed} value={row.current} />
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
