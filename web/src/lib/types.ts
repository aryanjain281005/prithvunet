// ============================================
// PrithviNet Type Definitions
// ============================================

// --- AQI Types ---
export type AQICategory =
  | "Good"
  | "Satisfactory"
  | "Moderate"
  | "Poor"
  | "Very Poor"
  | "Severe";

export interface AQIReading {
  stationId: string;
  stationName: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
  aqi: number;
  category: AQICategory;
  dominantPollutant: string;
  pollutants: {
    pm25?: number;
    pm10?: number;
    so2?: number;
    no2?: number;
    co?: number;
    o3?: number;
    nh3?: number;
  };
  weather?: {
    temp?: number;
    humidity?: number;
    windSpeed?: number;
    pressure?: number;
  };
  timestamp: string;
}

// --- Water Quality Types ---
export interface WaterReading {
  stationId: string;
  stationName: string;
  riverName: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
  parameters: {
    bod?: number;
    dissolvedOxygen?: number;
    ph?: number;
    temperature?: number;
    nitrate?: number;
    chloride?: number;
    cod?: number;
    toc?: number;
    turbidity?: number;
    conductivity?: number;
  };
  status: "Safe" | "Caution" | "Polluted" | "Critical";
  timestamp: string;
}

// --- Noise Types ---
export interface NoiseReading {
  stationId: string;
  stationName: string;
  city: string;
  zone: "Industrial" | "Commercial" | "Residential" | "Silence";
  lat: number;
  lng: number;
  leq: number; // Equivalent continuous sound level
  lmax: number;
  lmin: number;
  limit: number; // Prescribed limit for this zone
  exceedance: boolean;
  dayNight: "Day" | "Night";
  timestamp: string;
}

// --- Industry Types ---
export interface Industry {
  id: string;
  name: string;
  type: string;
  category: string;
  state: string;
  city: string;
  lat: number;
  lng: number;
  status: "Compliant" | "Non-Compliant" | "Under Review" | "Closed";
  lastInspection?: string;
  emissions?: {
    pm?: number;
    so2?: number;
    nox?: number;
    co?: number;
  };
  effluents?: {
    ph?: number;
    bod?: number;
    cod?: number;
    tss?: number;
  };
}

// --- Alert Types ---
export type AlertSeverity = "Critical" | "Warning" | "Info";
export type AlertStatus = "Active" | "Acknowledged" | "Resolved";
export type AlertType = "air" | "water" | "noise" | "industry";

export interface Alert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  status: AlertStatus;
  title: string;
  description: string;
  stationName: string;
  parameter: string;
  value: number;
  limit: number;
  region: string;
  timestamp: string;
  assignedTo?: string;
}

// --- Monitoring Station ---
export interface MonitoringStation {
  id: string;
  name: string;
  type: "air" | "water" | "noise";
  lat: number;
  lng: number;
  city: string;
  state: string;
  status: "Live" | "Delay" | "Offline";
  lastUpdate: string;
}

// --- Forecast ---
export interface ForecastPoint {
  timestamp: string;
  value: number;
  lower: number; // Lower confidence bound
  upper: number; // Upper confidence bound
}

// --- User Roles ---
export type UserRole =
  | "super_admin"
  | "regional_officer"
  | "monitoring_team"
  | "industry_user"
  | "citizen";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  region?: string;
}

// --- Dashboard Stats ---
export interface DashboardStats {
  totalStations: number;
  liveStations: number;
  activeAlerts: number;
  criticalAlerts: number;
  avgAQI: number;
  industriesMonitored: number;
  complianceRate: number;
}

// --- Chart Data ---
export interface TimeSeriesData {
  timestamp: string;
  value: number;
  label?: string;
}

// --- WAQI API Response ---
export interface WAQIResponse {
  status: string;
  data: {
    aqi: number;
    idx: number;
    city: {
      name: string;
      geo: [number, number];
      url: string;
    };
    iaqi: Record<string, { v: number }>;
    time: {
      s: string;
      tz: string;
      v: number;
      iso: string;
    };
    forecast?: {
      daily?: Record<string, Array<{ avg: number; day: string; max: number; min: number }>>;
    };
    dominentpol?: string;
    attributions?: Array<{ name: string; url: string }>;
  };
}

// --- Search Result ---
export interface WAQISearchResult {
  uid: number;
  aqi: string;
  station: { name: string };
  time: { stime: string };
}

// --- Map Bounds API Response ---
export interface MapBoundsStation {
  lat: number;
  lon: number;
  uid: number;
  aqi: string; // Can be "-" if no data
  station: { name: string; time: string };
}

// --- CPCB RTWQMS (Real-Time Water Quality) ---
export interface CPCBStation {
  station_id: string;
  station_no: string;
  station_name: string;
  station_latitude: string;
  station_longitude: string;
  territory_name: string;
  station_status_remark?: string;
}

export interface CPCBReading {
  ts_id: number;
  timestamp: string;
  ts_value: number;
  station_latitude: number;
  station_longitude: number;
  stationparameter_longname: string;
  stationparameter_no: string;
  station_id: string;
  station_no: string;
  station_name: string;
  ts_unitsymbol: string;
  territory_name: string;
  MAX_RANGE: string;
}

// --- data.gov.in Air Quality (CAAQMS) ---
export interface DataGovAirRecord {
  id: number;
  country: string;
  state: string;
  city: string;
  station: string;
  last_update: string;
  latitude: string;
  longitude: string;
  pollutant_id: string;
  pollutant_min: string;
  pollutant_max: string;
  pollutant_avg: string;
}

export interface DataGovAirResponse {
  records: DataGovAirRecord[];
  total: number;
  count: number;
  offset: number;
}
