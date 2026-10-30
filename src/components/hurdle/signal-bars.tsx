import { useSectionReveal } from "@/lib/motion";
import type { DemoStoreValue } from "@/lib/store";

type Props = Pick<DemoStoreValue, "trustedSenderCaseFixture">;

export function SignalBars({ trustedSenderCaseFixture }: Props) {
  const { ref, visible } = useSectionReveal<HTMLElement>();
  const maximum = Math.max(...trustedSenderCaseFixture.signals.map((signal) => signal.weight), 1);

  return (
    <section
      aria-labelledby="signals-title"
      className="section-reveal border-t border-border py-8"
      data-visible={visible}
      ref={ref}
    >
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-xs uppercase tracking-wider text-status-analysis">
            04 · Analysis
          </p>
          <h2 className="mt-2 text-xl font-semibold" id="signals-title">
            Triggered deviation signals
          </h2>
        </div>
        <p className="font-mono text-sm tabular-nums">
          Total score{" "}
          <strong className="ml-2 text-status-invalid">{trustedSenderCaseFixture.score}/100</strong>
        </p>
      </div>
      <ul className="space-y-4">
        {trustedSenderCaseFixture.signals.map((signal, index) => (
          <li className="grid gap-2 sm:grid-cols-[13rem_1fr_3rem]" key={signal.id}>
            <div>
              <p className="font-mono text-xs font-medium">{signal.id}</p>
              <p className="mt-1 text-xs text-muted-foreground">{signal.detail}</p>
            </div>
            <div
              aria-label={`${signal.weight} signal weight`}
              className="h-2 self-center overflow-hidden rounded-sm bg-secondary"
            >
              <div
                className="h-full bg-status-escalated transition-[width] duration-500 ease-out motion-reduce:transition-none"
                style={{
                  width: visible ? `${(signal.weight / maximum) * 100}%` : "0%",
                  transitionDelay: `${Math.min(index, 5) * 50}ms`,
                }}
              />
            </div>
            <span className="font-mono text-xs tabular-nums sm:text-right">{signal.weight}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
