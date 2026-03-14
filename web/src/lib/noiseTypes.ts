export type NoiseZone = "Industrial" | "Commercial" | "Residential" | "Silence";

export type NoiseSource = "live" | "snapshot" | "simulated";

export type NoiseSeverity = "OK" | "MODERATE" | "HIGH" | "CRITICAL";

export interface NoiseCompliance {
  compliant: boolean;
  threshold: number;
  period: "Day" | "Night";
  exceeded_by: number;
  severity: NoiseSeverity;
  color: string;
  status: "Compliant" | "Violation";
}

export interface NoiseStation {
  station_id: number;
  name: string;
  city: string;
  state: string;
  zone: NoiseZone;
  lat: number;
  lng: number;
  is_online: boolean;
  last_updated: string;
  laf: number | null;
  las: number | null;
  lcf: number | null;
  lcs: number | null;
  lae: number | null;
  lce: number | null;
  lpeak: number | null;
  lpeak_day: number | null;
  max: number | null;
  min: number | null;
  battery: number | null;
  source: NoiseSource;
  source_label: string;
  source_detail: string;
  compliance: NoiseCompliance;
}

export interface NoiseAlert {
  station_id: number;
  station_name: string;
  city: string;
  state: string;
  zone: NoiseZone;
  lat: number;
  lng: number;
  laf: number;
  threshold: number;
  exceeded_by: number;
  severity: NoiseSeverity;
  color: string;
  period: "Day" | "Night";
  last_updated: string;
  source: NoiseSource;
  source_label: string;
}

export interface NoiseSummary {
  total_stations: number;
  live: number;
  snapshot: number;
  simulated: number;
  compliant: number;
  violation: number;
  critical: number;
  avg_laf_db: number | null;
  active_alerts: NoiseAlert[];
  period: "Day" | "Night";
  status_mode: NoiseSource;
}

export interface NoiseFilter {
  city: string;
  zone: string;
  compliance: string;
  searchQuery: string;
}

export interface NoiseSnapshotPayload {
  station_id: number;
  name: string;
  city: string;
  state: string;
  zone: NoiseZone;
  lat: number;
  lng: number;
  laf: number | null;
  las: number | null;
  lcf: number | null;
  lcs: number | null;
  lae: number | null;
  lce: number | null;
  lpeak: number | null;
  lpeak_day: number | null;
  max: number | null;
  min: number | null;
  battery: number | null;
  snapshot_taken: string;
  source: "snapshot";
}
