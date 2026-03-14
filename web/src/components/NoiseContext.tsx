"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { fetchAllStationData } from "@/lib/noiseService";
import type { NoiseAlert, NoiseFilter, NoiseStation, NoiseSummary } from "@/lib/noiseTypes";

interface NoiseContextValue {
  stations: NoiseStation[];
  stats: NoiseSummary | null;
  loading: boolean;
  refreshing: boolean;
  lastUpdated: string;
  filter: NoiseFilter;
  setFilter: React.Dispatch<React.SetStateAction<NoiseFilter>>;
  selectedStation: NoiseStation | null;
  setSelectedStation: (station: NoiseStation | null) => void;
  filteredStations: NoiseStation[];
  refresh: () => void;
}

const NoiseContext = createContext<NoiseContextValue | null>(null);

const REFRESH_INTERVAL = 60_000;

function buildAlerts(stations: NoiseStation[]): NoiseAlert[] {
  return stations
    .filter((station) => station.laf !== null && station.compliance.status === "Violation")
    .sort((left, right) => right.compliance.exceeded_by - left.compliance.exceeded_by)
    .map((station) => ({
      station_id: station.station_id,
      station_name: station.name,
      city: station.city,
      state: station.state,
      zone: station.zone,
      lat: station.lat,
      lng: station.lng,
      laf: station.laf ?? 0,
      threshold: station.compliance.threshold,
      exceeded_by: station.compliance.exceeded_by,
      severity: station.compliance.severity,
      color: station.compliance.color,
      period: station.compliance.period,
      last_updated: station.last_updated,
      source: station.source,
      source_label: station.source_label,
    }));
}

function buildSummary(stations: NoiseStation[]): NoiseSummary {
  const live = stations.filter((station) => station.source === "live").length;
  const snapshot = stations.filter((station) => station.source === "snapshot").length;
  const simulated = stations.filter((station) => station.source === "simulated").length;
  const compliant = stations.filter((station) => station.compliance.status === "Compliant").length;
  const violation = stations.filter((station) => station.compliance.status === "Violation").length;
  const critical = stations.filter((station) => station.compliance.severity === "CRITICAL").length;
  const alerts = buildAlerts(stations);
  const lafs = stations.flatMap((station) => (station.laf === null ? [] : [station.laf]));
  const hour = new Date().getHours();

  return {
    total_stations: stations.length,
    live,
    snapshot,
    simulated,
    compliant,
    violation,
    critical,
    avg_laf_db: lafs.length > 0 ? Number((lafs.reduce((sum, value) => sum + value, 0) / lafs.length).toFixed(1)) : null,
    active_alerts: alerts,
    period: stations[0]?.compliance.period ?? (hour >= 6 && hour < 22 ? "Day" : "Night"),
    status_mode: simulated > 0 ? "simulated" : snapshot > 0 ? "snapshot" : "live",
  };
}

function sortStations(stations: NoiseStation[]): NoiseStation[] {
  const sourceWeight = { live: 0, snapshot: 1, simulated: 2 } as const;

  return [...stations].sort((left, right) => {
    const leftPriority = left.compliance.status === "Violation" ? 0 : 1;
    const rightPriority = right.compliance.status === "Violation" ? 0 : 1;
    if (leftPriority !== rightPriority) {
      return leftPriority - rightPriority;
    }

    if (left.compliance.exceeded_by !== right.compliance.exceeded_by) {
      return right.compliance.exceeded_by - left.compliance.exceeded_by;
    }

    const sourceGap = sourceWeight[left.source] - sourceWeight[right.source];
    if (sourceGap !== 0) {
      return sourceGap;
    }

    return left.name.localeCompare(right.name);
  });
}

export function NoiseProvider({ children }: { children: React.ReactNode }) {
  const [stations, setStations] = useState<NoiseStation[]>([]);
  const [stats, setStats] = useState<NoiseSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState("");
  const [selectedStation, setSelectedStation] = useState<NoiseStation | null>(null);
  const [filter, setFilter] = useState<NoiseFilter>({
    city: "",
    zone: "",
    compliance: "",
    searchQuery: "",
  });

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const requestVersionRef = useRef(0);

  const commitStations = useCallback((stationData: NoiseStation[]) => {
    setStations(stationData);
    setStats(buildSummary(stationData));
    setLastUpdated(new Date().toISOString());
  }, []);

  const fetchData = useCallback(async (isManual = false) => {
    const requestVersion = ++requestVersionRef.current;

    if (isManual) {
      setRefreshing(true);
    }

    try {
      const fastData = sortStations(await fetchAllStationData("fast"));
      if (requestVersion !== requestVersionRef.current) {
        return;
      }

      commitStations(fastData);
    } catch (error) {
      console.error("[NoiseContext] fallback fetch error", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }

    try {
      const liveData = sortStations(await fetchAllStationData("full"));
      if (requestVersion !== requestVersionRef.current) {
        return;
      }

      commitStations(liveData);
    } catch (error) {
      console.error("[NoiseContext] live refresh error", error);
    }
  }, [commitStations]);

  useEffect(() => {
    fetchData();
    intervalRef.current = setInterval(() => {
      fetchData();
    }, REFRESH_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchData]);

  const filteredStations = useMemo(() => {
    return stations.filter((station) => {
      if (filter.city && !station.city.toLowerCase().includes(filter.city.toLowerCase())) return false;
      if (filter.zone && station.zone.toLowerCase() !== filter.zone.toLowerCase()) return false;
      if (filter.compliance && station.compliance.status.toLowerCase() !== filter.compliance.toLowerCase()) return false;

      if (filter.searchQuery) {
        const query = filter.searchQuery.toLowerCase();
        const haystack = [station.name, station.city, station.state].join(" ").toLowerCase();
        if (!haystack.includes(query)) return false;
      }

      return true;
    });
  }, [filter.city, filter.compliance, filter.searchQuery, filter.zone, stations]);

  return (
    <NoiseContext.Provider
      value={{
        stations,
        stats,
        loading,
        refreshing,
        lastUpdated,
        filter,
        setFilter,
        selectedStation,
        setSelectedStation,
        filteredStations,
        refresh: () => fetchData(true),
      }}
    >
      {children}
    </NoiseContext.Provider>
  );
}

export function useNoise() {
  const context = useContext(NoiseContext);
  if (!context) {
    throw new Error("useNoise must be used inside <NoiseProvider>");
  }

  return context;
}
