import type { NoiseCompliance, NoiseZone } from "@/lib/noiseTypes";

export const ZONE_LIMITS: Record<NoiseZone, { day: number; night: number }> = {
  Industrial: { day: 75, night: 70 },
  Commercial: { day: 65, night: 55 },
  Residential: { day: 55, night: 45 },
  Silence: { day: 50, night: 40 },
};

export function checkCompliance(laf: number, zone: NoiseZone, at = new Date()): NoiseCompliance {
  const hour = at.getHours();
  const isDay = hour >= 6 && hour < 22;
  const limits = ZONE_LIMITS[zone];
  const threshold = isDay ? limits.day : limits.night;
  const exceeded = laf > threshold;
  const delta = laf - threshold;

  return {
    compliant: !exceeded,
    threshold,
    period: isDay ? "Day" : "Night",
    exceeded_by: exceeded ? Number(delta.toFixed(1)) : 0,
    severity: !exceeded ? "OK" : delta > 10 ? "CRITICAL" : delta > 5 ? "HIGH" : "MODERATE",
    color: !exceeded ? "#4ade80" : delta > 10 ? "#ef4444" : "#f97316",
    status: exceeded ? "Violation" : "Compliant",
  };
}
