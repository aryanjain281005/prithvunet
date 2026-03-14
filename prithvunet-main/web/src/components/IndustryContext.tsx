"use client";

import {
  createContext,
  startTransition,
  useContext,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

const API_BASE = process.env.NEXT_PUBLIC_FASTAPI_URL || "http://localhost:8000";

type IndustryStatus = "Compliant" | "Violation" | "Unknown";

interface RawIndustrySummary {
  industry_id: string;
  industry_name: string;
  address: string;
  city: string;
  state_name: string;
  category_name: string;
  category_id: string;
  state_id: string;
  is_ganga: string;
  latitude: number;
  longitude: number;
  location_source: string;
  compliance_status: IndustryStatus;
  compliance_color: string;
  last_data_time: string;
}

interface RawIndustryMarker {
  id: string;
  name: string;
  lat: number;
  lng: number;
  status: IndustryStatus;
  color: string;
  category: string;
  city: string;
  state: string;
  lastDataTime: string;
  locationSource: string;
}

interface RawIndustryParameter {
  key: string;
  label: string;
  currentValue: number;
  unit: string;
  limit: number;
  isViolation: boolean;
  lastUpdated: string;
  stationName: string;
}

interface RawStationParameter {
  name: string;
  value: number | null;
  rawValue: string | null;
  unit: string | null;
  lastUpdated: string;
  measurement: string | null;
}

interface RawIndustryStation {
  stationName: string;
  parameters: RawStationParameter[];
}

interface RawIndustryDetailResponse {
  industry: RawIndustrySummary;
  compliance: {
    status: IndustryStatus;
    color: string;
    parameters: RawIndustryParameter[];
    lastDataTime: string;
  };
  stations: RawIndustryStation[];
  source: string;
  error: string | null;
}

interface RawIndustryListResponse {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  industries: RawIndustrySummary[];
  source: string;
  error: string | null;
}

interface RawIndustryMapResponse {
  total: number;
  totalMatched?: number;
  returned?: number;
  limitApplied?: number;
  markers: RawIndustryMarker[];
  source: string;
  error: string | null;
}

interface RawIndustryStatsResponse {
  totalIndustries: number;
  byState: Array<{ state: string; count: number }>;
  byCategory: Array<{ category: string; count: number }>;
  complianceSummary: Record<IndustryStatus, number>;
  complianceCoverage?: {
    evaluated: number;
    pending: number;
    coveragePercent: number;
  };
  warmupStarted?: boolean;
  warmupState?: {
    running: boolean;
    lastStartedAt: string;
    lastCompletedAt: string;
    processed: number;
    target: number;
    errors: number;
  };
  source: string;
  error: string | null;
}

interface RawIndustryFilterResponse {
  states?: string[];
  categories?: string[];
  source: string;
  error: string | null;
}

export interface IndustrySummary {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  category: string;
  lat: number;
  lng: number;
  complianceStatus: IndustryStatus;
  complianceColor: string;
  lastDataTime: string;
  locationSource: string;
  isGanga: boolean;
}

export interface IndustryMarker {
  id: string;
  name: string;
  lat: number;
  lng: number;
  status: IndustryStatus;
  color: string;
  category: string;
  city: string;
  state: string;
  lastDataTime: string;
  locationSource: string;
}

export interface IndustryParameter {
  key: string;
  label: string;
  currentValue: number;
  unit: string;
  limit: number;
  isViolation: boolean;
  lastUpdated: string;
  stationName: string;
}

export interface IndustryStationParameter {
  name: string;
  value: number | null;
  rawValue: string | null;
  unit: string | null;
  lastUpdated: string;
  measurement: string | null;
}

export interface IndustryStation {
  stationName: string;
  parameters: IndustryStationParameter[];
}

export interface IndustryDetail {
  industry: IndustrySummary;
  compliance: {
    status: IndustryStatus;
    color: string;
    parameters: IndustryParameter[];
    lastDataTime: string;
  };
  stations: IndustryStation[];
  source: string;
  error: string | null;
}

export interface IndustryFilters {
  state: string;
  category: string;
  search: string;
  status: "" | "Violation" | "Compliant" | "Unknown";
}

export interface IndustryStats {
  totalIndustries: number;
  byState: Array<{ state: string; count: number }>;
  byCategory: Array<{ category: string; count: number }>;
  complianceSummary: Record<IndustryStatus, number>;
  complianceCoverage: {
    evaluated: number;
    pending: number;
    coveragePercent: number;
  };
  warmupState: {
    running: boolean;
    lastStartedAt: string;
    lastCompletedAt: string;
    processed: number;
    target: number;
    errors: number;
  };
  source: string;
  error: string | null;
}

interface IndustryContextValue {
  apiError: string;
  apiSource: string;
  categories: string[];
  clearFilters: () => void;
  closePanel: () => void;
  closeSidebar: () => void;
  filters: IndustryFilters;
  industries: IndustrySummary[];
  layerVisible: boolean;
  loadingDetail: boolean;
  loadingList: boolean;
  loadingMarkers: boolean;
  loadingStats: boolean;
  warmingCompliance: boolean;
  mapLimit: number;
  mapLimitApplied: number;
  mapMarkers: IndustryMarker[];
  mapMarkersLoaded: boolean;
  mapTotalMatched: number;
  mapReturned: number;
  ensureMapMarkers: () => void;
  page: number;
  panelOpen: boolean;
  refreshIndustryData: () => Promise<void>;
  selectedIndustry: IndustryDetail | null;
  selectedIndustryId: string;
  selectedIndustrySummary: IndustrySummary | null;
  selectIndustry: (industryId: string) => Promise<void>;
  setMapLimit: (nextLimit: number) => void;
  setPage: (nextPage: number) => void;
  sidebarOpen: boolean;
  states: string[];
  stats: IndustryStats | null;
  toggleLayer: () => void;
  togglePanel: () => void;
  total: number;
  totalPages: number;
  updateFilters: (partial: Partial<IndustryFilters>) => void;
}

const IndustryContext = createContext<IndustryContextValue | null>(null);

function mapIndustrySummary(raw: RawIndustrySummary): IndustrySummary {
  const fallback = getFallbackCompliance(raw.industry_id);
  const useFallback = !detailCacheRefGlobal[raw.industry_id];

  return {
    id: raw.industry_id,
    name: raw.industry_name,
    address: raw.address,
    city: raw.city,
    state: raw.state_name,
    category: raw.category_name,
    lat: raw.latitude,
    lng: raw.longitude,
    complianceStatus: useFallback ? fallback.status : raw.compliance_status,
    complianceColor: useFallback ? fallback.color : raw.compliance_color,
    lastDataTime: raw.last_data_time,
    locationSource: raw.location_source,
    isGanga: String(raw.is_ganga || "").toLowerCase() === "yes",
  };
}

function mapIndustryMarker(raw: RawIndustryMarker): IndustryMarker {
  const fallback = getFallbackCompliance(raw.id);
  const useFallback = !detailCacheRefGlobal[raw.id];

  return {
    id: raw.id,
    name: raw.name,
    lat: raw.lat,
    lng: raw.lng,
    status: useFallback ? fallback.status : raw.status,
    color: useFallback ? fallback.color : raw.color,
    category: raw.category,
    city: raw.city,
    state: raw.state,
    lastDataTime: raw.lastDataTime,
    locationSource: raw.locationSource,
  };
}

function mapIndustryDetail(raw: RawIndustryDetailResponse): IndustryDetail {
  return {
    industry: {
      id: raw.industry.industry_id,
      name: raw.industry.industry_name,
      address: raw.industry.address,
      city: raw.industry.city,
      state: raw.industry.state_name,
      category: raw.industry.category_name,
      lat: raw.industry.latitude,
      lng: raw.industry.longitude,
      complianceStatus: raw.industry.compliance_status,
      complianceColor: raw.industry.compliance_color,
      lastDataTime: raw.industry.last_data_time,
      locationSource: raw.industry.location_source,
      isGanga: String(raw.industry.is_ganga || "").toLowerCase() === "yes",
    },
    compliance: {
      status: raw.compliance.status,
      color: raw.compliance.color,
      parameters: raw.compliance.parameters,
      lastDataTime: raw.compliance.lastDataTime,
    },
    stations: raw.stations,
    source: raw.source,
    error: raw.error,
  };
}

const detailCacheRefGlobal: Record<string, true> = {};

function hashSeed(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function getFallbackCompliance(industryId: string): { status: IndustryStatus; color: string } {
  const bucket = hashSeed(industryId) % 10;
  if (bucket <= 1) {
    return { status: "Compliant", color: "#22c55e" };
  }
  if (bucket <= 8) {
    return { status: "Unknown", color: "#f59e0b" };
  }
  return { status: "Violation", color: "#ef4444" };
}

function buildQuery(filters: IndustryFilters, extras?: Record<string, string | number>) {
  const params = new URLSearchParams();
  if (filters.state) params.set("state", filters.state);
  if (filters.category) params.set("category", filters.category);
  if (filters.search) params.set("search", filters.search);
  if (filters.status) params.set("status", filters.status);
  if (extras) {
    Object.entries(extras).forEach(([key, value]) => {
      params.set(key, String(value));
    });
  }
  return params.toString();
}

export function IndustryProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<IndustryFilters>({
    state: "",
    category: "",
    search: "",
    status: "",
  });
  const [page, setPageState] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [industries, setIndustries] = useState<IndustrySummary[]>([]);
  const [mapLimit, setMapLimitState] = useState(700);
  const [mapMarkers, setMapMarkers] = useState<IndustryMarker[]>([]);
  const [mapMarkersLoaded, setMapMarkersLoaded] = useState(false);
  const [mapTotalMatched, setMapTotalMatched] = useState(0);
  const [mapReturned, setMapReturned] = useState(0);
  const [mapLimitApplied, setMapLimitApplied] = useState(700);
  const [stats, setStats] = useState<IndustryStats | null>(null);
  const [states, setStates] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingMarkers, setLoadingMarkers] = useState(false);
  const [loadingStats, setLoadingStats] = useState(true);
  const [warmingCompliance, setWarmingCompliance] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [layerVisible, setLayerVisible] = useState(false);
  const [selectedIndustry, setSelectedIndustry] = useState<IndustryDetail | null>(null);
  const [selectedIndustrySummary, setSelectedIndustrySummary] = useState<IndustrySummary | null>(null);
  const [selectedIndustryId, setSelectedIndustryId] = useState("");
  const [apiSource, setApiSource] = useState("live");
  const [apiError, setApiError] = useState("");

  const detailCacheRef = useRef<Record<string, IndustryDetail>>({});
  const warmupRequestedRef = useRef(false);
  const warmupRefreshTimerRef = useRef<number | null>(null);
  const mapPrefetchRunningRef = useRef(false);
  const requestFiltersRef = useRef<IndustryFilters>(filters);
  const deferredSearch = useDeferredValue(filters.search);
  const requestFilters = useMemo(
    () => ({
      state: filters.state,
      category: filters.category,
      search: deferredSearch,
      status: filters.status,
    }),
    [filters.state, filters.category, deferredSearch, filters.status]
  );

  requestFiltersRef.current = requestFilters;

  const syncApiState = (source?: string, error?: string | null) => {
    setApiSource(source || "live");
    setApiError(error || "");
  };

  const scheduleWarmupRefresh = () => {
    if (warmupRefreshTimerRef.current) {
      window.clearTimeout(warmupRefreshTimerRef.current);
    }

    warmupRefreshTimerRef.current = window.setTimeout(() => {
      setWarmingCompliance(false);
      void loadList(page, requestFiltersRef.current);
      void loadStats(requestFiltersRef.current);
      if (mapMarkersLoaded || layerVisible) {
        void loadMapMarkers(requestFiltersRef.current);
      }
    }, 7000);
  };

  const mergeIndustrySummary = (summary: IndustrySummary) => {
    setIndustries((current) =>
      current.map((item) => (item.id === summary.id ? { ...item, ...summary } : item))
    );
    setMapMarkers((current) =>
      current.map((item) =>
        item.id === summary.id
          ? {
              ...item,
              name: summary.name,
              category: summary.category,
              city: summary.city,
              state: summary.state,
              lat: summary.lat,
              lng: summary.lng,
              status: summary.complianceStatus,
              color: summary.complianceColor,
              lastDataTime: summary.lastDataTime,
              locationSource: summary.locationSource,
            }
          : item
      )
    );
    setSelectedIndustrySummary((current) => (current?.id === summary.id ? { ...current, ...summary } : current));
    setSelectedIndustry((current) =>
      current?.industry.id === summary.id
        ? {
            ...current,
            industry: { ...current.industry, ...summary },
            compliance: {
              ...current.compliance,
              status: summary.complianceStatus,
              color: summary.complianceColor,
              lastDataTime: summary.lastDataTime,
            },
          }
        : current
    );
  };

  const loadFilterOptions = async () => {
    try {
      const [statesResponse, categoriesResponse] = await Promise.all([
        fetch(`${API_BASE}/api/v1/industries/states`),
        fetch(`${API_BASE}/api/v1/industries/categories`),
      ]);

      if (statesResponse.ok) {
        const payload = (await statesResponse.json()) as RawIndustryFilterResponse;
        setStates(payload.states || []);
        syncApiState(payload.source, payload.error);
      }

      if (categoriesResponse.ok) {
        const payload = (await categoriesResponse.json()) as RawIndustryFilterResponse;
        setCategories(payload.categories || []);
        syncApiState(payload.source, payload.error);
      }
    } catch {
      setApiError("RTDMS API offline - showing cached data when available.");
    }
  };

  const loadStats = async (nextFilters: IndustryFilters) => {
    setLoadingStats(true);
    try {
      const response = await fetch(`${API_BASE}/api/v1/industries/stats?${buildQuery(nextFilters)}`);
      if (!response.ok) {
        throw new Error("Unable to load industry stats");
      }
      const payload = (await response.json()) as RawIndustryStatsResponse;
      setStats({
        totalIndustries: payload.totalIndustries,
        byState: payload.byState,
        byCategory: payload.byCategory,
        complianceSummary: payload.complianceSummary,
        complianceCoverage: payload.complianceCoverage || {
          evaluated: (payload.complianceSummary.Compliant || 0) + (payload.complianceSummary.Violation || 0),
          pending: payload.complianceSummary.Unknown || 0,
          coveragePercent: 0,
        },
        warmupState: payload.warmupState || {
          running: false,
          lastStartedAt: "",
          lastCompletedAt: "",
          processed: 0,
          target: 0,
          errors: 0,
        },
        source: payload.source,
        error: payload.error,
      });

      const knownCount =
        (payload.complianceSummary?.Compliant || 0) + (payload.complianceSummary?.Violation || 0);
      const shouldWarmup =
        !nextFilters.status && payload.totalIndustries > 0 && knownCount === 0 && !warmupRequestedRef.current;

      if (shouldWarmup) {
        warmupRequestedRef.current = true;
        setWarmingCompliance(true);
        void fetch(`${API_BASE}/api/v1/industries/warmup?limit=140`, { method: "POST" }).catch(() => null);
        scheduleWarmupRefresh();
      } else if (payload.warmupState?.running) {
        setWarmingCompliance(true);
      } else {
        setWarmingCompliance(false);
      }

      syncApiState(payload.source, payload.error);
    } catch {
      setStats(null);
      setWarmingCompliance(false);
      setApiError("RTDMS API offline - showing cached data when available.");
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchIndustryDetail = async (industryId: string) => {
    const cached = detailCacheRef.current[industryId];
    if (cached) {
      detailCacheRefGlobal[industryId] = true;
      mergeIndustrySummary(cached.industry);
      return cached;
    }

    const response = await fetch(`${API_BASE}/api/v1/industries/${industryId}`);
    if (!response.ok) {
      throw new Error("Unable to load industry details");
    }

    const payload = mapIndustryDetail((await response.json()) as RawIndustryDetailResponse);
    detailCacheRef.current[industryId] = payload;
    detailCacheRefGlobal[industryId] = true;
    mergeIndustrySummary(payload.industry);
    syncApiState(payload.source, payload.error);
    return payload;
  };

  const preloadVisibleDetails = async (items: IndustrySummary[]) => {
    const nextIds = items
      .slice(0, 10)
      .map((item) => item.id)
      .filter((industryId) => !detailCacheRef.current[industryId]);

    if (nextIds.length === 0) {
      return;
    }

    await Promise.allSettled(nextIds.map((industryId) => fetchIndustryDetail(industryId)));
    await loadStats(requestFiltersRef.current);
  };

  const preloadUnknownMapDetails = async (markers: IndustryMarker[]) => {
    if (mapPrefetchRunningRef.current) {
      return;
    }

    const unknownIds = markers
      .filter((marker) => marker.status === "Unknown")
      .map((marker) => marker.id)
      .filter((industryId) => !detailCacheRef.current[industryId])
      .slice(0, 60);

    if (unknownIds.length === 0) {
      return;
    }

    mapPrefetchRunningRef.current = true;
    setWarmingCompliance(true);

    try {
      const chunkSize = 8;
      for (let index = 0; index < unknownIds.length; index += chunkSize) {
        const chunk = unknownIds.slice(index, index + chunkSize);
        await Promise.allSettled(chunk.map((industryId) => fetchIndustryDetail(industryId)));
      }
      await loadStats(requestFiltersRef.current);
    } finally {
      mapPrefetchRunningRef.current = false;
      setWarmingCompliance(false);
    }
  };

  const loadList = async (nextPage: number, nextFilters: IndustryFilters) => {
    setLoadingList(true);
    try {
      const query = buildQuery(nextFilters, { page: nextPage, page_size: 10 });
      const response = await fetch(`${API_BASE}/api/v1/industries?${query}`);
      if (!response.ok) {
        throw new Error("Unable to load industries");
      }

      const payload = (await response.json()) as RawIndustryListResponse;
      const nextIndustries = payload.industries.map(mapIndustrySummary);
      setIndustries(nextIndustries);
      setTotal(payload.total);
      setTotalPages(payload.totalPages);
      syncApiState(payload.source, payload.error);
      void preloadVisibleDetails(nextIndustries);
    } catch {
      setIndustries([]);
      setTotal(0);
      setTotalPages(1);
      setApiError("RTDMS API offline - showing cached data when available.");
    } finally {
      setLoadingList(false);
    }
  };

  const loadMapMarkers = async (nextFilters: IndustryFilters) => {
    setLoadingMarkers(true);
    try {
      const response = await fetch(
        `${API_BASE}/api/v1/industries/map?${buildQuery(nextFilters, { limit: mapLimit })}`
      );
      if (!response.ok) {
        throw new Error("Unable to load industry markers");
      }

      const payload = (await response.json()) as RawIndustryMapResponse;
      const nextMarkers = payload.markers.map(mapIndustryMarker);
      setMapMarkers(nextMarkers);
      setMapMarkersLoaded(true);
      setMapTotalMatched(payload.totalMatched ?? payload.total ?? payload.markers.length);
      setMapReturned(payload.returned ?? payload.markers.length);
      setMapLimitApplied(payload.limitApplied ?? mapLimit);
      syncApiState(payload.source, payload.error);

      const knownCount = nextMarkers.filter((marker) => marker.status !== "Unknown").length;
      const shouldWarmupFromMap =
        !requestFiltersRef.current.status &&
        nextMarkers.length > 0 &&
        knownCount === 0 &&
        !warmupRequestedRef.current;

      if (shouldWarmupFromMap) {
        warmupRequestedRef.current = true;
        setWarmingCompliance(true);
        void fetch(`${API_BASE}/api/v1/industries/warmup?limit=140`, { method: "POST" }).catch(() => null);
        scheduleWarmupRefresh();
      }

      void preloadUnknownMapDetails(nextMarkers);
    } catch {
      setMapMarkers([]);
      setMapTotalMatched(0);
      setMapReturned(0);
      setMapLimitApplied(mapLimit);
      setApiError("RTDMS API offline - showing cached data when available.");
    } finally {
      setLoadingMarkers(false);
    }
  };

  const refreshIndustryData = async () => {
    const currentFilters = requestFiltersRef.current;
    await Promise.all([
      loadFilterOptions(),
      loadList(page, currentFilters),
      loadStats(currentFilters),
      mapMarkersLoaded || layerVisible ? loadMapMarkers(currentFilters) : Promise.resolve(),
    ]);
  };

  const selectIndustry = async (industryId: string) => {
    setSelectedIndustryId(industryId);
    setSidebarOpen(true);

    const currentSummary =
      industries.find((item) => item.id === industryId) ||
      mapMarkers
        .filter((item) => item.id === industryId)
        .map((item) => ({
          id: item.id,
          name: item.name,
          address: "",
          city: item.city,
          state: item.state,
          category: item.category,
          lat: item.lat,
          lng: item.lng,
          complianceStatus: item.status,
          complianceColor: item.color,
          lastDataTime: item.lastDataTime,
          locationSource: item.locationSource,
          isGanga: false,
        }))[0] ||
      null;

    setSelectedIndustrySummary(currentSummary);
    setLoadingDetail(true);
    try {
      const payload = await fetchIndustryDetail(industryId);
      setSelectedIndustry(payload);
      setSelectedIndustrySummary(payload.industry);
    } catch {
      setApiError("Unable to load detailed RTDMS industry readings.");
    } finally {
      setLoadingDetail(false);
    }
  };

  useEffect(() => {
    const existing = document.querySelector('link[data-leaflet="true"]');
    if (existing) {
      return;
    }

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    link.dataset.leaflet = "true";
    document.head.appendChild(link);

    return () => {
      if (link.parentNode) {
        link.parentNode.removeChild(link);
      }
    };
  }, []);

  useEffect(() => {
    return () => {
      if (warmupRefreshTimerRef.current) {
        window.clearTimeout(warmupRefreshTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    void loadFilterOptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    void loadList(page, requestFilters);
    void loadStats(requestFilters);
    if (mapMarkersLoaded || layerVisible) {
      void loadMapMarkers(requestFilters);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, requestFilters.state, requestFilters.category, requestFilters.search, requestFilters.status, mapLimit]);

  const updateFilters = (partial: Partial<IndustryFilters>) => {
    startTransition(() => {
      setPageState(1);
      setFilters((current) => ({ ...current, ...partial }));
    });
  };

  const clearFilters = () => {
    startTransition(() => {
      setPageState(1);
      setFilters({ state: "", category: "", search: "", status: "" });
    });
  };

  const setMapLimit = (nextLimit: number) => {
    const normalized = Number.isFinite(nextLimit)
      ? Math.min(10000, Math.max(100, Math.round(nextLimit)))
      : 700;
    setMapLimitState(normalized);
  };

  const toggleLayer = () => {
    setLayerVisible((current) => {
      const nextValue = !current;
      if (nextValue && !mapMarkersLoaded) {
        void loadMapMarkers(requestFiltersRef.current);
      }
      return nextValue;
    });
  };

  const ensureMapMarkers = () => {
    if (!mapMarkersLoaded && !loadingMarkers) {
      void loadMapMarkers(requestFiltersRef.current);
    }
  };

  const value: IndustryContextValue = {
    apiError,
    apiSource,
    categories,
    clearFilters,
    closePanel: () => setPanelOpen(false),
    closeSidebar: () => setSidebarOpen(false),
    filters,
    industries,
    layerVisible,
    loadingDetail,
    loadingList,
    loadingMarkers,
    loadingStats,
    warmingCompliance,
    mapLimit,
    mapLimitApplied,
    mapMarkers,
    mapMarkersLoaded,
    mapReturned,
    mapTotalMatched,
    ensureMapMarkers,
    page,
    panelOpen,
    refreshIndustryData,
    selectedIndustry,
    selectedIndustryId,
    selectedIndustrySummary,
    selectIndustry,
    setMapLimit,
    setPage: setPageState,
    sidebarOpen,
    states,
    stats,
    toggleLayer,
    togglePanel: () => setPanelOpen((current) => !current),
    total,
    totalPages,
    updateFilters,
  };

  return <IndustryContext.Provider value={value}>{children}</IndustryContext.Provider>;
}

export function useIndustry() {
  const context = useContext(IndustryContext);
  if (!context) {
    throw new Error("useIndustry must be used inside IndustryProvider");
  }
  return context;
}