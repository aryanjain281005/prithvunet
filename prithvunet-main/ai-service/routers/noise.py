"""
PrithviNet — Noise Pollution Module
Backend router for CPCB noise monitoring stations (cpcbnoise.com / Geónica NANMN network).

All 58 active stations across India:
- Fetches live XML from cpcbnoise.com
- Parses both XML formats (canales + mydoc)
- Evaluates compliance against CPCB day/night zone limits
- Returns structured JSON to the frontend
"""
from __future__ import annotations

import logging
import time
import threading
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from typing import Any

import httpx
from fastapi import APIRouter, HTTPException, Query

router = APIRouter()
logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────────────────────────────────────
# CONSTANTS
# ─────────────────────────────────────────────────────────────────────────────
NOISE_BASE_URL = "http://www.cpcbnoise.com/index3.php"
CACHE_TTL = 90          # seconds — live readings are cached for 90s
HISTORY_CACHE_TTL = 300 # seconds — 1h/24h averages cached 5 min
FETCH_TIMEOUT = 12      # seconds per HTTP request

# CPCB noise zone limits (dB)
ZONE_LIMITS = {
    "Industrial":   {"day": 75, "night": 70},
    "Commercial":   {"day": 65, "night": 55},
    "Residential":  {"day": 55, "night": 45},
    "Silence":      {"day": 50, "night": 40},
}

# Day = 06:00–22:00, Night = 22:00–06:00 (as per CPCB/EPA Noise Rules 2000)
DAY_START_HOUR = 6
DAY_END_HOUR   = 22

# Severity thresholds (dB exceeded)
SEVERITY_OK       = "OK"
SEVERITY_MODERATE = "Moderate"
SEVERITY_HIGH     = "High"
SEVERITY_CRITICAL = "Critical"

# ─────────────────────────────────────────────────────────────────────────────
# STATION REGISTRY
# 58 confirmed active stations with city/zone/coordinates
# ─────────────────────────────────────────────────────────────────────────────
STATIONS: dict[int, dict[str, Any]] = {
    260: {"name": "ITO, Delhi",                       "city": "Delhi",            "state": "Delhi",          "zone": "Commercial",   "lat": 28.6289, "lng": 77.2401},
    261: {"name": "Punjabi Bagh, Delhi",              "city": "Delhi",            "state": "Delhi",          "zone": "Residential",  "lat": 28.6742, "lng": 77.1311},
    262: {"name": "RK Puram, Delhi",                  "city": "Delhi",            "state": "Delhi",          "zone": "Residential",  "lat": 28.5643, "lng": 77.1853},
    263: {"name": "Shadipur, Delhi",                  "city": "Delhi",            "state": "Delhi",          "zone": "Industrial",   "lat": 28.6514, "lng": 77.1498},
    264: {"name": "Siri Fort, Delhi",                 "city": "Delhi",            "state": "Delhi",          "zone": "Residential",  "lat": 28.5494, "lng": 77.2190},
    265: {"name": "Dwarka Sec-8, Delhi",              "city": "Delhi",            "state": "Delhi",          "zone": "Residential",  "lat": 28.5672, "lng": 77.0545},
    266: {"name": "Vasundhara, Ghaziabad",            "city": "Ghaziabad",        "state": "Uttar Pradesh",  "zone": "Residential",  "lat": 28.6740, "lng": 77.3700},
    267: {"name": "BSNL, Noida",                      "city": "Noida",            "state": "Uttar Pradesh",  "zone": "Commercial",   "lat": 28.5705, "lng": 77.3219},
    268: {"name": "Sector 62, Noida",                 "city": "Noida",            "state": "Uttar Pradesh",  "zone": "Residential",  "lat": 28.6273, "lng": 77.3653},
    269: {"name": "Crossing Republik, Ghaziabad",     "city": "Ghaziabad",        "state": "Uttar Pradesh",  "zone": "Residential",  "lat": 28.6505, "lng": 77.4374},
    270: {"name": "Nehru Nagar, Ghaziabad",           "city": "Ghaziabad",        "state": "Uttar Pradesh",  "zone": "Residential",  "lat": 28.6616, "lng": 77.4182},
    271: {"name": "Sanjay Nagar, Ghaziabad",          "city": "Ghaziabad",        "state": "Uttar Pradesh",  "zone": "Residential",  "lat": 28.6813, "lng": 77.4265},
    272: {"name": "Link Road, Ghaziabad",             "city": "Ghaziabad",        "state": "Uttar Pradesh",  "zone": "Commercial",   "lat": 28.6707, "lng": 77.4386},
    273: {"name": "Anand Vihar, Delhi",               "city": "Delhi",            "state": "Delhi",          "zone": "Commercial",   "lat": 28.6477, "lng": 77.3153},
    274: {"name": "Loni, Ghaziabad",                  "city": "Ghaziabad",        "state": "Uttar Pradesh",  "zone": "Residential",  "lat": 28.7526, "lng": 77.2870},
    275: {"name": "Surajpur, Greater Noida",          "city": "Greater Noida",    "state": "Uttar Pradesh",  "zone": "Industrial",   "lat": 28.5617, "lng": 77.4463},
    276: {"name": "VIP Road, Kolkata",                "city": "Kolkata",          "state": "West Bengal",    "zone": "Commercial",   "lat": 22.6047, "lng": 88.4420},
    277: {"name": "Gariahat, Kolkata",                "city": "Kolkata",          "state": "West Bengal",    "zone": "Commercial",   "lat": 22.5215, "lng": 88.3669},
    278: {"name": "Jadavpur, Kolkata",                "city": "Kolkata",          "state": "West Bengal",    "zone": "Residential",  "lat": 22.5002, "lng": 88.3700},
    279: {"name": "Belgharia, Kolkata",               "city": "Kolkata",          "state": "West Bengal",    "zone": "Industrial",   "lat": 22.6669, "lng": 88.3833},
    280: {"name": "Howrah, Kolkata",                  "city": "Kolkata",          "state": "West Bengal",    "zone": "Commercial",   "lat": 22.5958, "lng": 88.2636},
    281: {"name": "Khardah, Kolkata",                 "city": "Kolkata",          "state": "West Bengal",    "zone": "Residential",  "lat": 22.7218, "lng": 88.3838},
    282: {"name": "Barrackpore, Kolkata",             "city": "Kolkata",          "state": "West Bengal",    "zone": "Residential",  "lat": 22.7643, "lng": 88.3720},
    283: {"name": "Salt Lake, Kolkata",               "city": "Kolkata",          "state": "West Bengal",    "zone": "Residential",  "lat": 22.5809, "lng": 88.4175},
    284: {"name": "Church Street, Bengaluru",         "city": "Bengaluru",        "state": "Karnataka",      "zone": "Commercial",   "lat": 12.9747, "lng": 77.6083},
    285: {"name": "Silk Board, Bengaluru",            "city": "Bengaluru",        "state": "Karnataka",      "zone": "Commercial",   "lat": 12.9174, "lng": 77.6228},
    287: {"name": "Hebbal, Bengaluru",                "city": "Bengaluru",        "state": "Karnataka",      "zone": "Residential",  "lat": 13.0473, "lng": 77.6024},
    289: {"name": "Peenya, Bengaluru",                "city": "Bengaluru",        "state": "Karnataka",      "zone": "Industrial",   "lat": 13.0296, "lng": 77.5222},
    290: {"name": "Sanjay Gandhi Nagar, Bengaluru",   "city": "Bengaluru",        "state": "Karnataka",      "zone": "Residential",  "lat": 12.9833, "lng": 77.5833},
    291: {"name": "Taramani, Chennai",                "city": "Chennai",          "state": "Tamil Nadu",     "zone": "Residential",  "lat": 12.9795, "lng": 80.2430},
    292: {"name": "Kathivakkam, Chennai",             "city": "Chennai",          "state": "Tamil Nadu",     "zone": "Industrial",   "lat": 13.2202, "lng": 80.3046},
    293: {"name": "Manali, Chennai",                  "city": "Chennai",          "state": "Tamil Nadu",     "zone": "Industrial",   "lat": 13.1734, "lng": 80.2735},
    294: {"name": "Vallalar Nagar, Chennai",          "city": "Chennai",          "state": "Tamil Nadu",     "zone": "Residential",  "lat": 13.1425, "lng": 80.2879},
    295: {"name": "Anna Nagar, Chennai",              "city": "Chennai",          "state": "Tamil Nadu",     "zone": "Residential",  "lat": 13.0850, "lng": 80.2101},
    296: {"name": "SGPGI Hospital, Lucknow",          "city": "Lucknow",          "state": "Uttar Pradesh",  "zone": "Silence",      "lat": 26.8536, "lng": 80.9416},
    297: {"name": "Hazratganj, Lucknow",              "city": "Lucknow",          "state": "Uttar Pradesh",  "zone": "Commercial",   "lat": 26.8509, "lng": 80.9463},
    298: {"name": "Aliganj, Lucknow",                 "city": "Lucknow",          "state": "Uttar Pradesh",  "zone": "Residential",  "lat": 26.8672, "lng": 80.9318},
    299: {"name": "Chowk, Lucknow",                   "city": "Lucknow",          "state": "Uttar Pradesh",  "zone": "Commercial",   "lat": 26.8584, "lng": 80.9066},
    300: {"name": "Gomti Nagar, Lucknow",             "city": "Lucknow",          "state": "Uttar Pradesh",  "zone": "Residential",  "lat": 26.8638, "lng": 81.0004},
    301: {"name": "Civil Lines, Allahabad",           "city": "Prayagraj",        "state": "Uttar Pradesh",  "zone": "Residential",  "lat": 25.4381, "lng": 81.8540},
    302: {"name": "Katra, Allahabad",                 "city": "Prayagraj",        "state": "Uttar Pradesh",  "zone": "Commercial",   "lat": 25.4513, "lng": 81.8381},
    304: {"name": "Varanasi Cantonment",              "city": "Varanasi",         "state": "Uttar Pradesh",  "zone": "Residential",  "lat": 25.3290, "lng": 82.9591},
    305: {"name": "Godowlia, Varanasi",               "city": "Varanasi",         "state": "Uttar Pradesh",  "zone": "Commercial",   "lat": 25.3142, "lng": 83.0103},
    306: {"name": "Agra Cantt, Agra",                 "city": "Agra",             "state": "Uttar Pradesh",  "zone": "Commercial",   "lat": 27.1767, "lng": 78.0081},
    307: {"name": "Taj Mahal Zone, Agra",             "city": "Agra",             "state": "Uttar Pradesh",  "zone": "Silence",      "lat": 27.1751, "lng": 78.0421},
    308: {"name": "Vikas Nagar, Jaipur",              "city": "Jaipur",           "state": "Rajasthan",      "zone": "Residential",  "lat": 26.9124, "lng": 75.7873},
    309: {"name": "Sindhi Camp, Jaipur",              "city": "Jaipur",           "state": "Rajasthan",      "zone": "Commercial",   "lat": 26.9185, "lng": 75.7897},
    310: {"name": "Malviya Nagar, Jaipur",            "city": "Jaipur",           "state": "Rajasthan",      "zone": "Residential",  "lat": 26.8649, "lng": 75.8019},
    311: {"name": "Bandra, Mumbai",                   "city": "Mumbai",           "state": "Maharashtra",    "zone": "Residential",  "lat": 19.0596, "lng": 72.8295},
    312: {"name": "Chembur, Mumbai",                  "city": "Mumbai",           "state": "Maharashtra",    "zone": "Industrial",   "lat": 19.0626, "lng": 72.9007},
    313: {"name": "Andheri West, Mumbai",             "city": "Mumbai",           "state": "Maharashtra",    "zone": "Commercial",   "lat": 19.1197, "lng": 72.8377},
    314: {"name": "Sangli, Maharashtra",              "city": "Sangli",           "state": "Maharashtra",    "zone": "Commercial",   "lat": 16.8524, "lng": 74.5815},
    315: {"name": "Ambad, Nashik",                    "city": "Nashik",           "state": "Maharashtra",    "zone": "Industrial",   "lat": 19.9975, "lng": 73.7898},
    316: {"name": "Kothrud, Pune",                    "city": "Pune",             "state": "Maharashtra",    "zone": "Residential",  "lat": 18.5074, "lng": 73.8077},
    317: {"name": "Viman Nagar, Pune",                "city": "Pune",             "state": "Maharashtra",    "zone": "Residential",  "lat": 18.5679, "lng": 73.9143},
    318: {"name": "Bhopal, Madhya Pradesh",           "city": "Bhopal",           "state": "Madhya Pradesh", "zone": "Commercial",   "lat": 23.2599, "lng": 77.4126},
    319: {"name": "Indore, Madhya Pradesh",           "city": "Indore",           "state": "Madhya Pradesh", "zone": "Commercial",   "lat": 22.7196, "lng": 75.8577},
    320: {"name": "Gwalior, Madhya Pradesh",          "city": "Gwalior",          "state": "Madhya Pradesh", "zone": "Commercial",   "lat": 26.2183, "lng": 78.1828},
}

STATION_IDS = list(STATIONS.keys())

# ─────────────────────────────────────────────────────────────────────────────
# IN-MEMORY CACHE
# ─────────────────────────────────────────────────────────────────────────────
_live_cache: dict[int, dict] = {}    # station_id → {data, fetched_at}
_hist1h_cache: dict[int, dict] = {}
_hist24h_cache: dict[int, dict] = {}
_cache_lock = threading.Lock()

# ─────────────────────────────────────────────────────────────────────────────
# XML PARSERS
# ─────────────────────────────────────────────────────────────────────────────
def _parse_canales_xml(xml_text: str) -> dict[str, Any]:
    """
    Parse the newer <canales><canal id='div_canal_noise_*' valor='...' unidades='...'/></canales> format.
    Returns dict with keys: lpeak, lpeak_day, laf, las, lcf, lcs, lae, lce, battery, status
    """
    readings: dict[str, Any] = {}
    try:
        root = ET.fromstring(xml_text)
        for canal in root.findall("canal"):
            cid   = canal.get("id", "").lower()
            val   = canal.get("valor", "")
            units = canal.get("unidades", "")
            nombre = canal.get("nombre", "").lower()
            try:
                fval = float(val)
            except (ValueError, TypeError):
                continue

            if "noise_pico" in cid and "picodia" not in cid:
                readings["lpeak"] = fval
            elif "noise_picodia" in cid:
                readings["lpeak_day"] = fval
            elif "noise_laf" in cid or nombre == "laf":
                readings["laf"] = fval
            elif "noise_las" in cid or nombre == "las":
                readings["las"] = fval
            elif "noise_lcf" in cid or nombre == "lcf":
                readings["lcf"] = fval
            elif "noise_lcs" in cid or nombre == "lcs":
                readings["lcs"] = fval
            elif "noise_lae" in cid or nombre == "lae":
                readings["lae"] = fval
            elif "noise_lce" in cid or nombre == "lce":
                readings["lce"] = fval
            elif "bateria" in cid or "battery" in cid or nombre == "battery":
                readings["battery"] = fval
            elif "status" in cid or nombre == "status":
                readings["status"] = int(fval)
    except ET.ParseError as exc:
        logger.warning("canales XML parse error: %s", exc)
    return readings


def _parse_mydoc_xml(xml_text: str) -> dict[str, Any]:
    """
    Parse the older <mydoc><canal numcanal='N'><param name='...' /></canal></mydoc> format.

    Channel → metric mapping:
      numcanal=1  → status (1=online)
      numcanal=3  → LAF (dBA)
      numcanal=7  → LCF (dBC)
      numcanal=11 → LAS (dBA)
      numcanal=13 → LCS (dBC)
      numcanal=15 → LAE (dBA)
      numcanal=17 → LCE (dBC)
      numcanal=19 → LPeak (dBC)
      numcanal=21 → Battery (V)
    """
    CHANNEL_MAP = {
        "1":  "status",
        "3":  "laf",
        "7":  "lcf",
        "11": "las",
        "13": "lcs",
        "15": "lae",
        "17": "lce",
        "19": "lpeak",
        "21": "battery",
    }
    readings: dict[str, Any] = {}
    try:
        root = ET.fromstring(xml_text)
        for canal in root.findall("canal"):
            num = canal.get("numcanal", "")
            metric = CHANNEL_MAP.get(num)
            if not metric:
                continue
            for param in canal.findall("param"):
                if param.get("name") == "valor":
                    try:
                        val = float(param.text or "")
                        readings[metric] = int(val) if metric == "status" else val
                    except (ValueError, TypeError):
                        pass
                elif param.get("name") == "fecha" and "timestamp" not in readings:
                    try:
                        readings["timestamp"] = int(param.text or "")
                    except (ValueError, TypeError):
                        pass
    except ET.ParseError as exc:
        logger.warning("mydoc XML parse error: %s", exc)
    return readings


def _parse_xml_auto(xml_text: str) -> dict[str, Any]:
    """Detect format and delegate to the appropriate parser."""
    stripped = xml_text.strip()
    if "<canales" in stripped:
        return _parse_canales_xml(stripped)
    if "<mydoc" in stripped:
        return _parse_mydoc_xml(stripped)
    # Try canales first, then mydoc
    r = _parse_canales_xml(stripped)
    return r if r else _parse_mydoc_xml(stripped)


# ─────────────────────────────────────────────────────────────────────────────
# COMPLIANCE ENGINE
# ─────────────────────────────────────────────────────────────────────────────
def _is_daytime(dt: datetime | None = None) -> bool:
    """Return True if local IST hour is in 06:00–22:00 day period."""
    if dt is None:
        dt = datetime.now()
    return DAY_START_HOUR <= dt.hour < DAY_END_HOUR


def _evaluate_compliance(laf: float | None, zone: str, is_day: bool) -> dict[str, Any]:
    """
    Return compliance verdict for a single LAF reading vs. zone limit.
    Keys: status, threshold, exceeded_by, severity, color
    """
    limits = ZONE_LIMITS.get(zone, ZONE_LIMITS["Residential"])
    threshold = limits["day"] if is_day else limits["night"]
    period = "day" if is_day else "night"

    if laf is None:
        return {
            "status": "Unknown",
            "threshold": threshold,
            "period": period,
            "exceeded_by": None,
            "severity": "Unknown",
            "color": "#f59e0b",
        }

    exceeded_by = round(laf - threshold, 1)

    if exceeded_by <= 0:
        severity = SEVERITY_OK
        color = "#22c55e"
        status = "Compliant"
    elif exceeded_by <= 5:
        severity = SEVERITY_MODERATE
        color = "#f59e0b"
        status = "Violation"
    elif exceeded_by <= 10:
        severity = SEVERITY_HIGH
        color = "#f97316"
        status = "Violation"
    else:
        severity = SEVERITY_CRITICAL
        color = "#ef4444"
        status = "Violation"

    return {
        "status": status,
        "threshold": threshold,
        "period": period,
        "exceeded_by": exceeded_by if exceeded_by > 0 else None,
        "severity": severity,
        "color": color,
    }


# ─────────────────────────────────────────────────────────────────────────────
# HTTP FETCHER (with caching)
# ─────────────────────────────────────────────────────────────────────────────
def _fetch_raw_xml(task: str, param_name: str, station_id: int) -> str:
    """Fetch raw XML from cpcbnoise.com. Returns empty string on failure."""
    params = {"option": "datos", "task": task, param_name: station_id}
    try:
        with httpx.Client(timeout=FETCH_TIMEOUT, follow_redirects=True) as client:
            response = client.get(NOISE_BASE_URL, params=params, headers={
                "User-Agent": "PrithviNet-NoiseMonitor/1.0",
                "Accept": "text/xml,application/xml,*/*",
            })
            return response.text
    except Exception as exc:
        logger.warning("Noise fetch error station=%d task=%s: %s", station_id, task, exc)
        return ""


def _get_live_reading(station_id: int, force: bool = False) -> dict[str, Any]:
    """
    Return cached or freshly-fetched live reading for a station.
    Cache TTL = CACHE_TTL seconds.
    """
    now = time.monotonic()
    with _cache_lock:
        cached = _live_cache.get(station_id)
        if cached and not force and (now - cached["fetched_at"]) < CACHE_TTL:
            return cached["data"]

    # Fetch from CPCB noise API
    xml_text = _fetch_raw_xml("getnoise", "estacion", station_id)
    readings = _parse_xml_auto(xml_text) if xml_text else {}

    station_meta = STATIONS.get(station_id, {})
    zone = station_meta.get("zone", "Residential")
    is_day = _is_daytime()
    laf = readings.get("laf")
    compliance = _evaluate_compliance(laf, zone, is_day)

    # Determine online status
    raw_status = readings.get("status", 0)
    is_online = bool(raw_status == 1 or laf is not None)

    # Build canonical reading object
    ts = readings.get("timestamp")
    last_updated = (
        datetime.fromtimestamp(ts, tz=timezone.utc).isoformat()
        if ts else datetime.now(tz=timezone.utc).isoformat()
    )

    data = {
        "station_id":    station_id,
        "name":          station_meta.get("name", f"Station {station_id}"),
        "city":          station_meta.get("city", "Unknown"),
        "state":         station_meta.get("state", "Unknown"),
        "zone":          zone,
        "lat":           station_meta.get("lat", 22.97),
        "lng":           station_meta.get("lng", 78.65),
        "is_online":     is_online,
        "last_updated":  last_updated,
        # Readings (None if not received)
        "laf":           laf,
        "las":           readings.get("las"),
        "lcf":           readings.get("lcf"),
        "lcs":           readings.get("lcs"),
        "lae":           readings.get("lae"),
        "lce":           readings.get("lce"),
        "lpeak":         readings.get("lpeak"),
        "lpeak_day":     readings.get("lpeak_day"),
        "battery":       readings.get("battery"),
        # Compliance
        "compliance":    compliance,
    }

    with _cache_lock:
        _live_cache[station_id] = {"data": data, "fetched_at": now}

    return data


def _get_history(station_id: int, hours: int) -> list[dict]:
    """
    Return 1h or 24h averaged history for a station.
    Uses get1h (pe=id) or get24h (p=id) CPCB endpoint.
    """
    is_1h = (hours == 1)
    cache = _hist1h_cache if is_1h else _hist24h_cache
    ttl = HISTORY_CACHE_TTL
    now = time.monotonic()

    with _cache_lock:
        cached = cache.get(station_id)
        if cached and (now - cached["fetched_at"]) < ttl:
            return cached["data"]

    task = "get1h" if is_1h else "get24h"
    param = "pe" if is_1h else "p"
    xml_text = _fetch_raw_xml(task, param, station_id)
    readings = _parse_xml_auto(xml_text) if xml_text else {}

    # History endpoints return a single averaged record
    entry = {
        "period": f"{hours}h average",
        **{k: v for k, v in readings.items() if k not in ("status", "timestamp")},
    }
    if "timestamp" in readings:
        entry["at"] = datetime.fromtimestamp(
            readings["timestamp"], tz=timezone.utc
        ).isoformat()

    result = [entry] if any(
        readings.get(k) is not None
        for k in ("laf", "las", "lcf", "lpeak")
    ) else []

    with _cache_lock:
        cache[station_id] = {"data": result, "fetched_at": now}

    return result


# ─────────────────────────────────────────────────────────────────────────────
# API ROUTES
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/noise/stations", summary="List all 58 noise monitoring stations")
def list_stations(
    city:  str | None = Query(None, description="Filter by city"),
    state: str | None = Query(None, description="Filter by state"),
    zone:  str | None = Query(None, description="Filter by zone (Industrial/Commercial/Residential/Silence)"),
):
    """
    Return station metadata for all 58 CPCB noise monitoring stations.
    Optionally filter by city, state, or zone type.
    Does NOT fetch live readings (use /noise/stations/{id}/live for that).
    """
    stations = []
    for sid, meta in STATIONS.items():
        if city  and city.lower()  not in meta["city"].lower():
            continue
        if state and state.lower() not in meta["state"].lower():
            continue
        if zone  and zone.lower()  != meta["zone"].lower():
            continue

        limits = ZONE_LIMITS[meta["zone"]]
        stations.append({
            "station_id": sid,
            "name":       meta["name"],
            "city":       meta["city"],
            "state":      meta["state"],
            "zone":       meta["zone"],
            "lat":        meta["lat"],
            "lng":        meta["lng"],
            "day_limit":  limits["day"],
            "night_limit": limits["night"],
        })

    return {
        "stations":    stations,
        "total":       len(stations),
        "zone_limits": ZONE_LIMITS,
    }


@router.get("/noise/stations/{station_id}/live", summary="Live reading for one station")
def station_live(station_id: int):
    """
    Fetch (or return from cache) the latest live noise reading for a single station.
    Results are cached for 90 seconds.
    """
    if station_id not in STATIONS:
        raise HTTPException(status_code=404, detail=f"Station {station_id} not found")
    return _get_live_reading(station_id)


@router.get("/noise/stations/{station_id}/history", summary="1h or 24h average for one station")
def station_history(
    station_id: int,
    hours: int = Query(24, description="1 for 1-hour average, 24 for 24-hour average"),
):
    """Return the CPCB 1-hour or 24-hour averaged noise data for a station."""
    if station_id not in STATIONS:
        raise HTTPException(status_code=404, detail=f"Station {station_id} not found")
    if hours not in (1, 24):
        raise HTTPException(status_code=400, detail="hours must be 1 or 24")
    return {
        "station_id": station_id,
        "station": STATIONS[station_id],
        "history": _get_history(station_id, hours),
    }


@router.get("/noise/live", summary="Live readings for ALL 58 stations (batched)")
def all_stations_live(
    city:  str | None = Query(None),
    zone:  str | None = Query(None),
    status: str | None = Query(None, description="online | offline"),
    compliance: str | None = Query(None, description="Compliant | Violation | Unknown"),
    limit: int = Query(58, ge=1, le=58),
):
    """
    Fetch live readings for all (or filtered subset of) stations concurrently.
    Results are individually cached — concurrent fetches are bounded to avoid
    hammering cpcbnoise.com.
    """
    # Determine which stations to fetch
    target_ids: list[int] = []
    for sid, meta in STATIONS.items():
        if city and city.lower() not in meta["city"].lower():
            continue
        if zone and zone.lower() != meta["zone"].lower():
            continue
        target_ids.append(sid)

    target_ids = target_ids[:limit]

    # Fetch concurrently using threads (bounded to 8 workers)
    results: dict[int, dict] = {}
    lock = threading.Lock()

    def _fetch(sid: int) -> None:
        data = _get_live_reading(sid)
        with lock:
            results[sid] = data

    # Use a thread pool (max 8 concurrent to respect cpcbnoise.com)
    import concurrent.futures
    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
        list(pool.map(_fetch, target_ids))

    # Apply post-fetch filters
    stations = list(results.values())
    if status:
        want_online = status.lower() == "online"
        stations = [s for s in stations if s["is_online"] == want_online]
    if compliance:
        stations = [
            s for s in stations
            if s["compliance"]["status"].lower() == compliance.lower()
        ]

    # Sort: violations first, then by LAF desc
    def _sort_key(s: dict) -> tuple:
        c = s["compliance"]["status"]
        priority = 0 if c == "Violation" else (1 if c == "Compliant" else 2)
        laf = s.get("laf") or 0.0
        return (priority, -laf)

    stations.sort(key=_sort_key)

    # Summary counts
    online     = sum(1 for s in stations if s["is_online"])
    violations = sum(1 for s in stations if s["compliance"]["status"] == "Violation")
    compliant  = sum(1 for s in stations if s["compliance"]["status"] == "Compliant")
    unknown    = sum(1 for s in stations if s["compliance"]["status"] == "Unknown")
    critical   = sum(1 for s in stations if s["compliance"]["severity"] == SEVERITY_CRITICAL)

    return {
        "stations":   stations,
        "fetched":    len(stations),
        "summary": {
            "total":      len(STATION_IDS),
            "online":     online,
            "offline":    len(stations) - online,
            "compliant":  compliant,
            "violation":  violations,
            "unknown":    unknown,
            "critical":   critical,
        },
        "period":     "day" if _is_daytime() else "night",
        "fetched_at": datetime.now(tz=timezone.utc).isoformat(),
    }


@router.get("/noise/stats", summary="Dashboard stats for noise module")
def noise_stats():
    """
    Return high-level statistics for the noise dashboard.
    Uses cached readings where available; does NOT trigger new fetches.
    """
    with _cache_lock:
        cached_readings = [entry["data"] for entry in _live_cache.values()]

    total = len(STATION_IDS)
    online    = sum(1 for r in cached_readings if r.get("is_online"))
    violation = sum(1 for r in cached_readings if r["compliance"]["status"] == "Violation")
    compliant = sum(1 for r in cached_readings if r["compliance"]["status"] == "Compliant")
    critical  = sum(1 for r in cached_readings if r["compliance"]["severity"] == SEVERITY_CRITICAL)

    lafs = [r["laf"] for r in cached_readings if r.get("laf") is not None]
    avg_laf = round(sum(lafs) / len(lafs), 1) if lafs else None

    # Top violators (highest exceeded_by)
    violators = [
        r for r in cached_readings
        if r["compliance"]["status"] == "Violation"
        and r["compliance"]["exceeded_by"] is not None
    ]
    violators.sort(key=lambda r: r["compliance"]["exceeded_by"], reverse=True)
    top_violators = [
        {
            "station_id": v["station_id"],
            "name": v["name"],
            "city": v["city"],
            "zone": v["zone"],
            "laf": v["laf"],
            "exceeded_by": v["compliance"]["exceeded_by"],
            "severity": v["compliance"]["severity"],
        }
        for v in violators[:5]
    ]

    # Active alerts (all violations)
    alerts = []
    for r in cached_readings:
        if r["compliance"]["status"] == "Violation":
            alerts.append({
                "station_id":    r["station_id"],
                "station_name":  r["name"],
                "city":          r["city"],
                "zone":          r["zone"],
                "laf":           r["laf"],
                "threshold":     r["compliance"]["threshold"],
                "exceeded_by":   r["compliance"]["exceeded_by"],
                "severity":      r["compliance"]["severity"],
                "color":         r["compliance"]["color"],
                "period":        r["compliance"]["period"],
                "last_updated":  r["last_updated"],
            })
    alerts.sort(key=lambda a: a.get("exceeded_by") or 0, reverse=True)

    return {
        "total_stations":  total,
        "cached_stations": len(cached_readings),
        "online":          online,
        "offline":         total - online,
        "compliant":       compliant,
        "violation":       violation,
        "unknown":         total - compliant - violation,
        "critical":        critical,
        "avg_laf_db":      avg_laf,
        "active_alerts":   alerts,
        "top_violators":   top_violators,
        "period":          "day" if _is_daytime() else "night",
        "zone_limits":     ZONE_LIMITS,
        "computed_at":     datetime.now(tz=timezone.utc).isoformat(),
    }


@router.get("/noise/alerts", summary="All active noise violation alerts")
def noise_alerts(
    severity: str | None = Query(None, description="Moderate | High | Critical"),
    zone: str | None = Query(None),
    city: str | None = Query(None),
):
    """Return active violation alerts from cached station readings."""
    with _cache_lock:
        cached_readings = [entry["data"] for entry in _live_cache.values()]

    alerts = []
    for r in cached_readings:
        if r["compliance"]["status"] != "Violation":
            continue
        if severity and r["compliance"]["severity"].lower() != severity.lower():
            continue
        if zone and r["zone"].lower() != zone.lower():
            continue
        if city and city.lower() not in r["city"].lower():
            continue

        alerts.append({
            "station_id":   r["station_id"],
            "station_name": r["name"],
            "city":         r["city"],
            "state":        r["state"],
            "zone":         r["zone"],
            "lat":          r["lat"],
            "lng":          r["lng"],
            "laf":          r["laf"],
            "threshold":    r["compliance"]["threshold"],
            "exceeded_by":  r["compliance"]["exceeded_by"],
            "severity":     r["compliance"]["severity"],
            "color":        r["compliance"]["color"],
            "period":       r["compliance"]["period"],
            "last_updated": r["last_updated"],
        })

    alerts.sort(key=lambda a: a.get("exceeded_by") or 0, reverse=True)

    return {
        "alerts": alerts,
        "count":  len(alerts),
        "fetched_at": datetime.now(tz=timezone.utc).isoformat(),
    }
