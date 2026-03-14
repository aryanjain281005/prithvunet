from __future__ import annotations

import base64
from collections import Counter
from datetime import datetime
import hashlib
import hmac
import json
import logging
import os
import threading
import time
from typing import Any

import httpx
from fastapi import APIRouter, HTTPException, Query

router = APIRouter()
logger = logging.getLogger(__name__)

RTDMS_BASE_URL = "https://rtdms.cpcb.gov.in/OCEMS/public/v1"
RTDMS_SIGNING_KEY = b"KL_RTDMS$$$$$$$$"
CACHE_TTL_SECONDS = 600
WARMUP_DEFAULT_LIMIT = 120

RTDMS_HEADERS = {
    "Accept": "application/json, text/plain, */*",
    "Content-Type": "application/json",
    "Origin": "https://rtdms.cpcb.gov.in",
    "Referer": "https://rtdms.cpcb.gov.in/publicdata/",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "same-origin",
    "User-Agent": (
        "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) "
        "AppleWebKit/537.36"
    ),
}

COMPLIANCE_LIMITS = {
    "so2": {"label": "SO2", "limit": 80.0, "unit": "ug/m3"},
    "nox": {"label": "NOx", "limit": 80.0, "unit": "ug/m3"},
    "pm25": {"label": "PM2.5", "limit": 60.0, "unit": "ug/m3"},
    "pm10": {"label": "PM10", "limit": 100.0, "unit": "ug/m3"},
    "co": {"label": "CO", "limit": 2.0, "unit": "mg/m3"},
}

COMPLIANCE_COLORS = {
    "Compliant": "#22c55e",
    "Violation": "#ef4444",
    "Unknown": "#f59e0b",
}

INDIA_CENTER = (22.9734, 78.6569)
STATE_CENTROIDS = {
    "andhra pradesh": (15.9129, 79.74),
    "arunachal pradesh": (28.218, 94.7278),
    "assam": (26.2006, 92.9376),
    "bihar": (25.0961, 85.3131),
    "chandigarh": (30.7333, 76.7794),
    "chhattisgarh": (21.2787, 81.8661),
    "dadra and nagar haveli and daman and diu": (20.1809, 73.0169),
    "dadra & nagar haveli and daman & diu": (20.1809, 73.0169),
    "delhi": (28.7041, 77.1025),
    "goa": (15.2993, 74.124),
    "gujarat": (22.2587, 71.1924),
    "haryana": (29.0588, 76.0856),
    "himachal pradesh": (31.1048, 77.1734),
    "jharkhand": (23.6102, 85.2799),
    "karnataka": (15.3173, 75.7139),
    "kerala": (10.8505, 76.2711),
    "ladakh": (34.1526, 77.5771),
    "lakshadweep": (10.5667, 72.6417),
    "madhya pradesh": (22.9734, 78.6569),
    "maharashtra": (19.7515, 75.7139),
    "manipur": (24.6637, 93.9063),
    "meghalaya": (25.467, 91.3662),
    "mizoram": (23.1645, 92.9376),
    "nagaland": (26.1584, 94.5624),
    "odisha": (20.9517, 85.0985),
    "orissa": (20.9517, 85.0985),
    "puducherry": (11.9416, 79.8083),
    "punjab": (31.1471, 75.3412),
    "rajasthan": (27.0238, 74.2179),
    "sikkim": (27.533, 88.5122),
    "tamil nadu": (11.1271, 78.6569),
    "telangana": (18.1124, 79.0193),
    "tripura": (23.9408, 91.9882),
    "uttar pradesh": (26.8467, 80.9462),
    "uttarakhand": (30.0668, 79.0193),
    "west bengal": (22.9868, 87.855),
    "andaman and nicobar islands": (11.7401, 92.6586),
    "jammu and kashmir": (33.7782, 76.5762),
}

INDUSTRY_CACHE: dict[str, Any] = {
    "timestamp": 0.0,
    "industries": [],
    "source": "offline",
    "error": None,
}

DETAIL_CACHE: dict[str, dict[str, Any]] = {}
COMPLIANCE_CACHE: dict[str, dict[str, Any]] = {}
INDUSTRY_CACHE_LOCK = threading.Lock()

# ---------------------------------------------------------------------------
# Nominatim geocoding cache – persisted to disk so coordinates survive restarts.
# Key: "city|state" (lowercased). Value: [lat, lng].
# ---------------------------------------------------------------------------
_GEOCODE_CACHE_PATH = os.path.join(os.path.dirname(__file__), ".geocode_cache.json")
_GEOCODE_CACHE: dict[str, tuple[float, float]] = {}
_GEOCODE_QUEUE: set[str] = set()
_GEOCODE_LOCK = threading.Lock()
_GEOCODE_RATE_LOCK = threading.Lock()  # ensures one Nominatim req at a time


def _load_geocode_cache() -> None:
    try:
        if os.path.exists(_GEOCODE_CACHE_PATH):
            with open(_GEOCODE_CACHE_PATH, encoding="utf-8") as fh:
                data = json.load(fh)
            with _GEOCODE_LOCK:
                for k, v in data.items():
                    if isinstance(v, list) and len(v) == 2:
                        _GEOCODE_CACHE[k] = (float(v[0]), float(v[1]))
    except Exception:
        pass


def _save_geocode_cache() -> None:
    try:
        with _GEOCODE_LOCK:
            snapshot = dict(_GEOCODE_CACHE)
        with open(_GEOCODE_CACHE_PATH, "w", encoding="utf-8") as fh:
            json.dump({k: list(v) for k, v in snapshot.items()}, fh)
    except Exception:
        pass


def _geocode_key(city: str | None, state: str | None) -> str:
    return f"{(city or '').strip().lower()}|{(state or '').strip().lower()}"


def _geocode_worker(city: str, state: str, key: str) -> None:
    """Background thread: geocode city+state via Nominatim, update cache."""
    query = f"{city}, {state}, India"
    try:
        with _GEOCODE_RATE_LOCK:  # one request at a time, keeps 1-req/sec TOS
            with httpx.Client(timeout=10, follow_redirects=True) as client:
                response = client.get(
                    "https://nominatim.openstreetmap.org/search",
                    params={"q": query, "format": "json", "limit": 1, "countrycodes": "in"},
                    headers={"User-Agent": "PrithviNet-EnvMonitor/1.0 contact=research"},
                )
                results = response.json()
            time.sleep(1.1)  # Nominatim TOS: max 1 request/second

        if results:
            lat = float(results[0]["lat"])
            lng = float(results[0]["lon"])
            with _GEOCODE_LOCK:
                _GEOCODE_CACHE[key] = (lat, lng)
            _save_geocode_cache()
            logger.info("Geocoded %r -> (%.5f, %.5f)", key, lat, lng)
    except Exception:
        pass
    finally:
        with _GEOCODE_LOCK:
            _GEOCODE_QUEUE.discard(key)


def _get_coordinates(state_name: str | None, city: str | None, industry_id: str) -> tuple[float, float, str]:
    """Return (lat, lng, source) for an industry.

    Priority:
    1. Nominatim-geocoded city centre (real GPS from real address data) with a
       tiny deterministic per-industry jitter so co-located industries don't
       overlap perfectly.
    2. State-centroid estimate while geocoding is pending (fallback).
    """
    key = _geocode_key(city, state_name)

    with _GEOCODE_LOCK:
        cached = _GEOCODE_CACHE.get(key)
        queued = key in _GEOCODE_QUEUE

    if cached:
        # Small deterministic per-industry spread (±0.04°) so stacked industries
        # are individually clickable on the map.
        jlat = _stable_offset(industry_id + "|jlat", 0.08)
        jlng = _stable_offset(industry_id + "|jlng", 0.08)
        return round(cached[0] + jlat, 6), round(cached[1] + jlng, 6), "geocoded-city"

    # Queue background geocoding if not already in-flight.
    if not queued and (city or state_name):
        with _GEOCODE_LOCK:
            if key not in _GEOCODE_QUEUE:
                _GEOCODE_QUEUE.add(key)
                thread = threading.Thread(
                    target=_geocode_worker,
                    args=(city or state_name or "India", state_name or "India", key),
                    daemon=True,
                )
                thread.start()

    # Fall back to state-centroid estimate while geocoding is pending.
    return _estimate_coordinates(state_name, city, industry_id)


# Kick off geocode cache load on module import.
_load_geocode_cache()

WARMUP_STATE = {
    "running": False,
    "lastStartedAt": "",
    "lastCompletedAt": "",
    "processed": 0,
    "target": 0,
    "errors": 0,
}
WARMUP_LOCK = threading.Lock()


def _now_iso() -> str:
    return datetime.utcnow().isoformat() + "Z"


def _cache_fresh(timestamp: float) -> bool:
    return (time.time() - timestamp) < CACHE_TTL_SECONDS


def _base64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode("utf-8").rstrip("=")


def _base64url_decode(data: str) -> bytes:
    return base64.urlsafe_b64decode(data + "=" * (-len(data) % 4))


def _sign_payload(payload: dict[str, Any]) -> str:
    header = _base64url_encode(json.dumps({"alg": "HS256", "typ": "JWT"}, separators=(",", ":")).encode("utf-8"))
    body = _base64url_encode(json.dumps(payload, separators=(",", ":")).encode("utf-8"))
    unsigned = f"{header}.{body}"
    signature = _base64url_encode(hmac.new(RTDMS_SIGNING_KEY, unsigned.encode("utf-8"), hashlib.sha256).digest())
    return base64.b64encode(json.dumps({"data": f"{unsigned}.{signature}"}).encode("utf-8")).decode("utf-8")


def _decode_rtdms_payload(raw_text: str) -> dict[str, Any]:
    outer = json.loads(base64.b64decode(raw_text).decode("utf-8"))
    token = outer["data"]
    payload_segment = token.split(".")[1]
    return json.loads(_base64url_decode(payload_segment).decode("utf-8"))


def _post_rtdms(
    endpoint: str,
    payload: dict[str, Any],
    *,
    timeout_seconds: float = 30.0,
    max_retries: int = 3,
) -> dict[str, Any]:
    body = json.dumps(_sign_payload(payload))
    url = f"{RTDMS_BASE_URL}/{endpoint}"
    last_error: Exception | None = None

    for attempt in range(max_retries):
        try:
            with httpx.Client(timeout=timeout_seconds, verify=False, follow_redirects=True) as client:
                response = client.post(url, headers=RTDMS_HEADERS, content=body)
                response.raise_for_status()
                return _decode_rtdms_payload(response.text)
        except Exception as exc:  # pragma: no cover - network defensive path
            last_error = exc
            if attempt < (max_retries - 1):
                time.sleep(1.0 + attempt)

    if last_error:
        raise last_error
    raise RuntimeError("RTDMS request failed without an exception")


def _normalize_text(value: str | None) -> str:
    return " ".join((value or "").replace("&", "and").lower().split())


def _stable_offset(seed: str, scale: float) -> float:
    digest = hashlib.sha256(seed.encode("utf-8")).hexdigest()
    fraction = int(digest[:8], 16) / 0xFFFFFFFF
    return (fraction - 0.5) * scale


def _estimate_coordinates(state_name: str | None, city: str | None, industry_id: str) -> tuple[float, float, str]:
    normalized_state = _normalize_text(state_name)
    base_lat, base_lng = STATE_CENTROIDS.get(normalized_state, INDIA_CENTER)

    city_seed = f"{normalized_state}|{_normalize_text(city)}"
    city_lat = base_lat + _stable_offset(city_seed + "|lat", 2.8)
    city_lng = base_lng + _stable_offset(city_seed + "|lng", 3.4)

    final_lat = city_lat + _stable_offset(industry_id + "|lat", 0.18)
    final_lng = city_lng + _stable_offset(industry_id + "|lng", 0.22)
    return round(final_lat, 6), round(final_lng, 6), "state-city-estimate"


def _to_float(value: Any) -> float | None:
    if value is None:
        return None
    text = str(value).strip().replace(",", "")
    if not text or text.upper() == "NA":
        return None
    try:
        return float(text)
    except ValueError:
        return None


def _to_timestamp(value: str | None) -> float:
    if not value:
        return 0.0
    for pattern in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%d %H:%M"):
        try:
            return datetime.strptime(value, pattern).timestamp()
        except ValueError:
            continue
    return 0.0


def _tracked_parameter_key(name: str | None) -> str | None:
    normalized = "".join(ch for ch in (name or "").upper() if ch.isalnum())
    if not normalized:
        return None
    if "PM25" in normalized:
        return "pm25"
    if "PM10" in normalized or normalized in {"PM", "SPM", "TPM", "PARTICULATEMATTER"}:
        return "pm10"
    if normalized in {"SO2", "SOX"} or "SULPHURDIOXIDE" in normalized or "SULFURDIOXIDE" in normalized:
        return "so2"
    if normalized == "CO" or "CARBONMONOXIDE" in normalized:
        return "co"
    if (
        "NOX" in normalized
        or normalized in {"NO", "NO2"}
        or "NITROGENOXIDES" in normalized
        or "OXIDESOFNITROGEN" in normalized
    ):
        return "nox"
    return None


def _summarize_compliance(station_param_data: dict[str, list[dict[str, Any]]]) -> dict[str, Any]:
    tracked: dict[str, dict[str, Any]] = {}
    last_data_time = ""
    last_data_timestamp = 0.0

    stations: list[dict[str, Any]] = []
    for station_name, readings in station_param_data.items():
        station_params: list[dict[str, Any]] = []
        for reading in readings:
            value = _to_float(reading.get("parameter_value"))
            updated_at = str(reading.get("last_updated") or "")
            updated_timestamp = _to_timestamp(updated_at)
            if updated_timestamp > last_data_timestamp:
                last_data_timestamp = updated_timestamp
                last_data_time = updated_at

            station_params.append(
                {
                    "name": reading.get("parameterName"),
                    "value": value,
                    "rawValue": reading.get("parameter_value"),
                    "unit": reading.get("parameter"),
                    "lastUpdated": updated_at,
                    "measurement": reading.get("measurement"),
                }
            )

            tracked_key = _tracked_parameter_key(reading.get("parameterName"))
            if not tracked_key or value is None:
                continue

            existing = tracked.get(tracked_key)
            if not existing or value > existing["currentValue"]:
                limit_config = COMPLIANCE_LIMITS[tracked_key]
                tracked[tracked_key] = {
                    "key": tracked_key,
                    "label": limit_config["label"],
                    "currentValue": value,
                    "unit": reading.get("parameter") or limit_config["unit"],
                    "limit": limit_config["limit"],
                    "isViolation": value > limit_config["limit"],
                    "lastUpdated": updated_at,
                    "stationName": station_name,
                }

        stations.append({"stationName": station_name, "parameters": station_params})

    tracked_list = [tracked[key] for key in ("so2", "nox", "pm25", "pm10", "co") if key in tracked]
    if any(item["isViolation"] for item in tracked_list):
        status = "Violation"
    elif tracked_list:
        status = "Compliant"
    else:
        status = "Unknown"

    return {
        "status": status,
        "color": COMPLIANCE_COLORS[status],
        "parameters": tracked_list,
        "stations": stations,
        "lastDataTime": last_data_time,
    }


def _base_industry_record(row: dict[str, Any]) -> dict[str, Any]:
    industry_id = str(row.get("industry_id") or "")
    latitude, longitude, location_source = _get_coordinates(row.get("state_name"), row.get("city"), industry_id)

    compliance_snapshot = COMPLIANCE_CACHE.get(industry_id)
    if compliance_snapshot and not _cache_fresh(compliance_snapshot["timestamp"]):
        COMPLIANCE_CACHE.pop(industry_id, None)
        compliance_snapshot = None

    compliance_status = compliance_snapshot["status"] if compliance_snapshot else "Unknown"
    compliance_color = COMPLIANCE_COLORS[compliance_status]
    last_data_time = compliance_snapshot.get("lastDataTime", "") if compliance_snapshot else ""

    return {
        "industry_id": industry_id,
        "industry_name": row.get("industry_name") or "Unknown Industry",
        "address": row.get("address") or "",
        "city": row.get("city") or "",
        "state_name": row.get("state_name") or "Unknown",
        "category_name": row.get("category_name") or "Unknown",
        "category_id": row.get("category_id") or "",
        "state_id": row.get("state_id") or "",
        "is_ganga": row.get("is_ganga") or "no",
        "latitude": latitude,
        "longitude": longitude,
        "location_source": location_source,
        "compliance_status": compliance_status,
        "compliance_color": compliance_color,
        "last_data_time": last_data_time,
    }


def _fetch_and_cache_industries() -> dict[str, Any]:
    try:
        payload = _post_rtdms("industry_dashboard_data", {"page": 1, "limit": 10000})
        if payload.get("status") != "success":
            raise RuntimeError(payload.get("message") or "RTDMS returned a failed response")

        rows = payload.get("data", {}).get("bodyContent", [])
        industries = [_base_industry_record(row) for row in rows]

        INDUSTRY_CACHE.update(
            {
                "timestamp": time.time(),
                "industries": industries,
                "source": "live",
                "error": None,
            }
        )
        return INDUSTRY_CACHE.copy()
    except Exception as exc:  # pragma: no cover - network defensive path
        logger.exception("Failed to fetch CPCB RTDMS industries")
        message = "RTDMS API unavailable"
        if INDUSTRY_CACHE["industries"]:
            return {
                "timestamp": INDUSTRY_CACHE["timestamp"],
                "industries": INDUSTRY_CACHE["industries"],
                "source": "cache/offline",
                "error": message,
            }
        return {
            "timestamp": time.time(),
            "industries": [],
            "source": "offline",
            "error": message,
        }


def _get_industry_snapshot() -> dict[str, Any]:
    if INDUSTRY_CACHE["industries"] and _cache_fresh(INDUSTRY_CACHE["timestamp"]):
        source = INDUSTRY_CACHE.get("source") or "cache"
        return {
            "timestamp": INDUSTRY_CACHE["timestamp"],
            "industries": [_base_industry_record(item) for item in INDUSTRY_CACHE["industries"]],
            "source": source if source != "live" else "cache",
            "error": INDUSTRY_CACHE.get("error"),
        }

    with INDUSTRY_CACHE_LOCK:
        if INDUSTRY_CACHE["industries"] and _cache_fresh(INDUSTRY_CACHE["timestamp"]):
            source = INDUSTRY_CACHE.get("source") or "cache"
            return {
                "timestamp": INDUSTRY_CACHE["timestamp"],
                "industries": [_base_industry_record(item) for item in INDUSTRY_CACHE["industries"]],
                "source": source if source != "live" else "cache",
                "error": INDUSTRY_CACHE.get("error"),
            }
        return _fetch_and_cache_industries()


def _filter_industries(
    industries: list[dict[str, Any]],
    state: str | None,
    category: str | None,
    search: str | None,
    status: str | None,
) -> list[dict[str, Any]]:
    normalized_state = _normalize_text(state)
    normalized_category = _normalize_text(category)
    normalized_search = _normalize_text(search)
    normalized_status = _normalize_text(status)

    filtered = industries
    if normalized_state:
        filtered = [item for item in filtered if _normalize_text(item["state_name"]) == normalized_state]
    if normalized_category:
        filtered = [item for item in filtered if _normalize_text(item["category_name"]) == normalized_category]
    if normalized_search:
        filtered = [
            item
            for item in filtered
            if normalized_search in _normalize_text(item["industry_name"])
            or normalized_search in _normalize_text(item["city"])
            or normalized_search in _normalize_text(item["address"])
        ]
    if normalized_status:
        filtered = [item for item in filtered if _normalize_text(item["compliance_status"]) == normalized_status]
    return filtered


def _status_rank(value: str) -> int:
    if value == "Violation":
        return 0
    if value == "Compliant":
        return 1
    if value == "Unknown":
        return 2
    return 3


def _warmup_state_snapshot() -> dict[str, Any]:
    with WARMUP_LOCK:
        return {
            "running": bool(WARMUP_STATE["running"]),
            "lastStartedAt": WARMUP_STATE["lastStartedAt"],
            "lastCompletedAt": WARMUP_STATE["lastCompletedAt"],
            "processed": int(WARMUP_STATE["processed"]),
            "target": int(WARMUP_STATE["target"]),
            "errors": int(WARMUP_STATE["errors"]),
        }


def _set_warmup_state(**kwargs: Any) -> None:
    with WARMUP_LOCK:
        WARMUP_STATE.update(kwargs)


def _increment_warmup_errors() -> None:
    with WARMUP_LOCK:
        WARMUP_STATE["errors"] = int(WARMUP_STATE["errors"]) + 1


def _build_warmup_candidates(industries: list[dict[str, Any]], limit: int) -> list[str]:
    seen_ids: set[str] = set()
    candidates: list[str] = []

    # Prioritize one record per category so warmup is not biased toward STPs only.
    seen_categories: set[str] = set()
    for item in industries:
        industry_id = str(item.get("industry_id") or "")
        category = str(item.get("category_name") or "")
        if not industry_id or industry_id in seen_ids or category in seen_categories:
            continue
        seen_categories.add(category)
        seen_ids.add(industry_id)
        candidates.append(industry_id)
        if len(candidates) >= limit:
            return candidates

    # Fill remaining slots using list order.
    for item in industries:
        industry_id = str(item.get("industry_id") or "")
        if not industry_id or industry_id in seen_ids:
            continue
        seen_ids.add(industry_id)
        candidates.append(industry_id)
        if len(candidates) >= limit:
            break

    return candidates


def _compliance_cached(industry_id: str) -> bool:
    snapshot = COMPLIANCE_CACHE.get(industry_id)
    if not snapshot:
        return False
    return _cache_fresh(snapshot.get("timestamp", 0.0))


def _compliance_warmup_worker(limit: int) -> None:
    try:
        _set_warmup_state(
            running=True,
            lastStartedAt=_now_iso(),
            processed=0,
            target=0,
            errors=0,
        )

        snapshot = _get_industry_snapshot()
        candidates = [
            industry_id
            for industry_id in _build_warmup_candidates(snapshot["industries"], limit)
            if not _compliance_cached(industry_id)
        ]
        _set_warmup_state(target=len(candidates))

        for index, industry_id in enumerate(candidates, start=1):
            try:
                _fetch_industry_detail(industry_id, timeout_seconds=12.0, max_retries=1)
            except Exception:  # pragma: no cover - best effort warmup
                logger.exception("Warmup failed for industry %s", industry_id)
                _increment_warmup_errors()
            finally:
                _set_warmup_state(processed=index)
    finally:
        _set_warmup_state(running=False, lastCompletedAt=_now_iso())


def _trigger_compliance_warmup(limit: int = WARMUP_DEFAULT_LIMIT) -> tuple[bool, dict[str, Any]]:
    running = False
    with WARMUP_LOCK:
        if WARMUP_STATE["running"]:
            running = True
        else:
            WARMUP_STATE.update(
                {
                    "running": True,
                    "lastStartedAt": _now_iso(),
                    "processed": 0,
                    "target": 0,
                    "errors": 0,
                }
            )

    if running:
        return False, _warmup_state_snapshot()

    thread = threading.Thread(target=_compliance_warmup_worker, args=(limit,), daemon=True)
    thread.start()
    return True, _warmup_state_snapshot()


def _get_industry_by_id(industry_id: str) -> tuple[dict[str, Any], dict[str, Any]]:
    snapshot = _get_industry_snapshot()
    industries = snapshot["industries"]
    industry = next((item for item in industries if item["industry_id"] == industry_id), None)
    if not industry:
        raise HTTPException(status_code=404, detail="Industry not found")
    return industry, snapshot


def _fetch_industry_detail(
    industry_id: str,
    *,
    timeout_seconds: float = 30.0,
    max_retries: int = 3,
) -> dict[str, Any]:
    cached = DETAIL_CACHE.get(industry_id)
    if cached and _cache_fresh(cached["timestamp"]):
        return cached["data"]

    payload = _post_rtdms(
        "public_industry_details",
        {"industry_id": industry_id},
        timeout_seconds=timeout_seconds,
        max_retries=max_retries,
    )
    if payload.get("status") != "success":
        raise RuntimeError(payload.get("message") or "Failed to fetch industry details")

    station_param_data = payload.get("data", {}).get("stationParamData", {})
    compliance = _summarize_compliance(station_param_data)
    DETAIL_CACHE[industry_id] = {"timestamp": time.time(), "data": compliance}
    COMPLIANCE_CACHE[industry_id] = {
        "timestamp": time.time(),
        "status": compliance["status"],
        "lastDataTime": compliance["lastDataTime"],
    }
    return compliance


@router.get("/industries")
def get_industries(
    state: str | None = None,
    category: str | None = None,
    search: str | None = None,
    status: str | None = Query(default=None, pattern="^(Violation|Compliant|Unknown)$"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=100),
):
    snapshot = _get_industry_snapshot()
    filtered = _filter_industries(snapshot["industries"], state, category, search, status)
    ordered = sorted(
        filtered,
        key=lambda item: (
            _status_rank(str(item.get("compliance_status") or "Unknown")),
            -_to_timestamp(str(item.get("last_data_time") or "")),
            str(item.get("industry_name") or ""),
        ),
    )

    total = len(ordered)
    total_pages = max(1, (total + page_size - 1) // page_size)
    if page > total_pages and total > 0:
        page = total_pages

    start = (page - 1) * page_size
    end = start + page_size
    page_items = ordered[start:end]

    return {
        "total": total,
        "page": page,
        "pageSize": page_size,
        "totalPages": total_pages,
        "industries": page_items,
        "source": snapshot["source"],
        "error": snapshot["error"],
        "cachedAt": datetime.utcfromtimestamp(snapshot["timestamp"]).isoformat() + "Z",
    }


@router.get("/industries/map")
def get_industry_map(
    state: str | None = None,
    category: str | None = None,
    search: str | None = None,
    status: str | None = Query(default=None, pattern="^(Violation|Compliant|Unknown)$"),
    limit: int = Query(default=700, ge=100, le=10000),
):
    snapshot = _get_industry_snapshot()
    filtered = _filter_industries(snapshot["industries"], state, category, search, status)
    prioritized = sorted(
        filtered,
        key=lambda item: (
            _status_rank(str(item.get("compliance_status") or "Unknown")),
            -_to_timestamp(str(item.get("last_data_time") or "")),
            str(item.get("industry_name") or ""),
        ),
    )
    visible = prioritized[:limit]

    markers = [
        {
            "id": item["industry_id"],
            "name": item["industry_name"],
            "lat": item["latitude"],
            "lng": item["longitude"],
            "status": item["compliance_status"],
            "color": item["compliance_color"],
            "category": item["category_name"],
            "city": item["city"],
            "state": item["state_name"],
            "lastDataTime": item["last_data_time"],
            "locationSource": item["location_source"],
        }
        for item in visible
    ]

    return {
        "total": len(filtered),
        "totalMatched": len(filtered),
        "returned": len(markers),
        "limitApplied": limit,
        "markers": markers,
        "source": snapshot["source"],
        "error": snapshot["error"],
    }


@router.get("/industries/stats")
def get_industry_stats(
    state: str | None = None,
    category: str | None = None,
    search: str | None = None,
    status: str | None = Query(default=None, pattern="^(Violation|Compliant|Unknown)$"),
):
    snapshot = _get_industry_snapshot()
    filtered = _filter_industries(snapshot["industries"], state, category, search, status)

    known_count = sum(1 for item in filtered if item.get("compliance_status") in {"Compliant", "Violation"})
    warmup_started = False
    if not status and filtered and known_count == 0:
        warmup_started, _ = _trigger_compliance_warmup()

    by_state = Counter(item["state_name"] for item in filtered)
    by_category = Counter(item["category_name"] for item in filtered)
    compliance_summary = Counter(item["compliance_status"] for item in filtered)

    evaluated = compliance_summary.get("Compliant", 0) + compliance_summary.get("Violation", 0)
    total_count = len(filtered)

    return {
        "totalIndustries": total_count,
        "byState": [{"state": key, "count": count} for key, count in by_state.most_common()],
        "byCategory": [{"category": key, "count": count} for key, count in by_category.most_common()],
        "complianceSummary": {
            "Compliant": compliance_summary.get("Compliant", 0),
            "Violation": compliance_summary.get("Violation", 0),
            "Unknown": compliance_summary.get("Unknown", 0),
        },
        "complianceCoverage": {
            "evaluated": evaluated,
            "pending": compliance_summary.get("Unknown", 0),
            "coveragePercent": round((evaluated / total_count) * 100.0, 2) if total_count else 0.0,
        },
        "warmupStarted": warmup_started,
        "warmupState": _warmup_state_snapshot(),
        "source": snapshot["source"],
        "error": snapshot["error"],
    }


@router.post("/industries/warmup")
def warmup_industry_compliance(limit: int = Query(default=WARMUP_DEFAULT_LIMIT, ge=10, le=600)):
    started, state = _trigger_compliance_warmup(limit)
    return {
        "started": started,
        "warmupState": state,
    }


@router.get("/industries/categories")
def get_industry_categories():
    snapshot = _get_industry_snapshot()
    categories = sorted({item["category_name"] for item in snapshot["industries"] if item["category_name"]})
    return {
        "categories": categories,
        "source": snapshot["source"],
        "error": snapshot["error"],
    }


@router.get("/industries/states")
def get_industry_states():
    snapshot = _get_industry_snapshot()
    states = sorted({item["state_name"] for item in snapshot["industries"] if item["state_name"]})
    return {
        "states": states,
        "source": snapshot["source"],
        "error": snapshot["error"],
    }


@router.get("/industries/{industry_id}")
def get_industry_detail(industry_id: str):
    industry, snapshot = _get_industry_by_id(industry_id)

    try:
        detail = _fetch_industry_detail(industry_id)
        industry = {
            **industry,
            "compliance_status": detail["status"],
            "compliance_color": detail["color"],
            "last_data_time": detail["lastDataTime"],
        }
        return {
            "industry": industry,
            "compliance": {
                "status": detail["status"],
                "color": detail["color"],
                "parameters": detail["parameters"],
                "lastDataTime": detail["lastDataTime"],
            },
            "stations": detail["stations"],
            "source": snapshot["source"],
            "error": snapshot["error"],
        }
    except Exception as exc:  # pragma: no cover - network defensive path
        logger.exception("Failed to fetch industry detail for %s", industry_id)
        return {
            "industry": industry,
            "compliance": {
                "status": "Unknown",
                "color": COMPLIANCE_COLORS["Unknown"],
                "parameters": [],
                "lastDataTime": industry.get("last_data_time") or "",
            },
            "stations": [],
            "source": snapshot["source"],
            "error": "RTDMS API unavailable",
        }