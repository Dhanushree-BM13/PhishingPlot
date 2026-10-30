import type { DemoIncident } from "@/lib/store";

const SWEEP_SECONDS = 4;

function angleFor(id: string) {
  let hash = 0;
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) % 360;
  return hash;
}

/**
 * Radar sweep over the incident queue. Riskier incidents sit closer to the centre; each blip
 * flashes as the beam passes its bearing. The centre shows how many need attention now.
 */
export function ThreatRadar({ incidents, urgent }: { incidents: DemoIncident[]; urgent: number }) {
  return (
    <div className="radar" role="img" aria-label={`Threat radar: ${urgent} urgent incidents`}>
      <div className="radar-rings" />
      <div className="radar-sweep" style={{ animationDuration: `${SWEEP_SECONDS}s` }} />
      {incidents.map((incident) => {
        const angle = angleFor(incident.id);
        const distance = 14 + (100 - incident.riskScore) * 0.34;
        const radians = ((angle - 90) * Math.PI) / 180;
        return (
          <span
            className="radar-blip"
            key={incident.id}
            style={{
              left: `${50 + Math.cos(radians) * distance}%`,
              top: `${50 + Math.sin(radians) * distance}%`,
              background: `var(--risk-${incident.risk})`,
              color: `var(--risk-${incident.risk})`,
              animationDuration: `${SWEEP_SECONDS}s`,
              animationDelay: `${(angle / 360) * SWEEP_SECONDS - SWEEP_SECONDS}s`,
            }}
            title={`${incident.id} · ${incident.riskScore}`}
          />
        );
      })}
      <div className="radar-center">
        <span className="radar-count">{urgent}</span>
        <span className="radar-label">urgent</span>
      </div>
    </div>
  );
}
