"""
Air quality data backend helpers for PrithviNet FastAPI.

Primary source: CPCB Open Government Data API (data.gov.in)
Fallback source: WAQI city feed when CPCB is missing for requested city
Forecast source: Open-Meteo Air Quality API
"""

from __future__ import annotations

from datetime import datetime
import os
from typing import Any

import httpx

DATA_GOV_BASE = "https://api.data.gov.in/resource"
WAQI_BASE = "https://api.waqi.info"
OPEN_METEO_BASE = "https://air-quality-api.open-meteo.com/v1/air-quality"

# Defaults are user-provided keys/tokens so local runs work immediately.
DATA_GOV_API_KEY = os.getenv("DATA_GOV_API_KEY", "579b464db66ec23bdd0000016781f9c68cfe4d9d72a9ef058d10898e")
DATA_GOV_AIR_RESOURCE = os.getenv("DATA_GOV_AIR_RESOURCE", "3b01bcb8-0b14-4abf-b6f2-c1bfd384ba69")
WAQI_TOKEN = os.getenv("WAQI_API_TOKEN", "dbddb3a5f5466dcaf9a54ac5f5093702507120de")


def _to_float(value: Any) -> float | None:
    try:
        if value is None or value == "":
            return None
        return float(value)
    except (TypeError, ValueError):
        return None


def _parse_timestamp(raw: str | None) -> datetime | None:
    if not raw:
        return None

    value = raw.strip()
    if not value:
        return None

    # data.gov.in and WAQI timestamps can appear in different formats.
    patterns = [
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%d %H:%M",
        "%d-%m-%Y %H:%M:%S",
        "%d-%m-%Y %H:%M",
        "%Y/%m/%d %H:%M:%S",
        "%Y/%m/%d %H:%M",
    ]

    for pattern in patterns:
        try:
            return datetime.strptime(value, pattern)
        except ValueError:
            continue

    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None


def _pollutant_key(pollutant_id: str | None) -> str | None:
    if not pollutant_id:
        return None

    pid = pollutant_id.upper().replace(" ", "")
    mapping = {
        "PM2.5": "pm25",
        "PM25": "pm25",
        "PM10": "pm10",
        "NO2": "no2",
        "SO2": "so2",
        "CO": "co",
        "O3": "o3",
        "OZONE": "o3",
    }
    return mapping.get(pid)


def _sub_index(concentration: float, breakpoints: list[tuple[float, float, int, int]]) -> int:
    for c_low, c_high, i_low, i_high in breakpoints:
        if c_low <= concentration <= c_high:
            return round(((i_high - i_low) / (c_high - c_low)) * (concentration - c_low) + i_low)
    return 500


def _compute_aqi(pollutants: dict[str, float]) -> int:
    indices: list[int] = []

    pm25 = pollutants.get("pm25")
    pm10 = pollutants.get("pm10")

    if pm25 is not None:
        indices.append(
            _sub_index(
                pm25,
                [
                    (0.0, 12.0, 0, 50),
                    (12.1, 35.4, 51, 100),
                    (35.5, 55.4, 101, 150),
                    (55.5, 150.4, 151, 200),
                    (150.5, 250.4, 201, 300),
                    (250.5, 500.0, 301, 500),
                ],
            )
        )

    if pm10 is not None:
        indices.append(
            _sub_index(
                pm10,
                [
                    (0.0, 54.0, 0, 50),
                    (55.0, 154.0, 51, 100),
                    (155.0, 254.0, 101, 150),
                    (255.0, 354.0, 151, 200),
                    (355.0, 424.0, 201, 300),
                    (425.0, 604.0, 301, 500),
                ],
            )
        )

    if not indices:
        # Fallback heuristic when PM values are unavailable in a station payload.
        fallback = max(
            (pollutants.get("no2") or 0.0) * 1.2,
            (pollutants.get("so2") or 0.0) * 1.1,
            (pollutants.get("o3") or 0.0) * 1.0,
            (pollutants.get("co") or 0.0) * 40.0,
        )
        return int(max(0, min(500, round(fallback))))

    return max(indices)


def _aqi_band(aqi: int) -> tuple[str, str]:
    if aqi <= 50:
        return "Good", "#22c55e"
    if aqi <= 100:
        return "Moderate", "#eab308"
    if aqi <= 150:
        return "Unhealthy for sensitive groups", "#f97316"
    if aqi <= 200:
        return "Unhealthy", "#ef4444"
    return "Very unhealthy", "#a855f7"


def _matches_date_time(station_dt: datetime | None, date: str | None, time: str | None) -> bool:
    if not date and not time:
        return True
    if station_dt is None:
        return False

    if date and station_dt.date().isoformat() != date:
        return False

    if time:
        try:
            t_parts = time.split(":")
            hour = int(t_parts[0])
            minute = int(t_parts[1]) if len(t_parts) > 1 else 0
        except (TypeError, ValueError, IndexError):
            return False

        # Hour-level filter keeps UX practical for CPCB timestamps.
        if station_dt.hour != hour:
            return False
        if minute not in (0, 30) and station_dt.minute != minute:
            return False

    return True


def _fetch_cpcb_records() -> list[dict[str, Any]]:
    if not DATA_GOV_API_KEY or not DATA_GOV_AIR_RESOURCE:
        return []

    def build_url(offset: int) -> str:
        return (
            f"{DATA_GOV_BASE}/{DATA_GOV_AIR_RESOURCE}"
            f"?api-key={DATA_GOV_API_KEY}&format=json&limit=1000&offset={offset}"
        )

    try:
        with httpx.Client(timeout=45.0) as client:
            res_1 = client.get(build_url(0))
            if res_1.status_code != 200:
                return []

            data_1 = res_1.json()
            records_1 = data_1.get("records", [])

            res_2 = client.get(build_url(1000))
            records_2: list[dict[str, Any]] = []
            if res_2.status_code == 200:
                data_2 = res_2.json()
                records_2 = data_2.get("records", [])
    except (httpx.HTTPError, ValueError):
        return []

    return [*records_1, *records_2]


def _aggregate_cpcb(records: list[dict[str, Any]]) -> list[dict[str, Any]]:
    grouped: dict[str, dict[str, Any]] = {}

    for record in records:
        station_name = str(record.get("station") or "Unknown Station").strip()
        city = str(record.get("city") or "Unknown City").strip().replace("_", " ")
        state = str(record.get("state") or "Unknown State").strip().replace("_", " ")
        key = f"{state}|{city}|{station_name}"

        if key not in grouped:
            grouped[key] = {
                "stationName": station_name,
                "city": city,
                "state": state,
                "lat": _to_float(record.get("latitude")),
                "lng": _to_float(record.get("longitude")),
                "pollutants": {},
                "lastUpdated": None,
                "source": "CPCB",
            }

        pollutant_name = _pollutant_key(record.get("pollutant_id"))
        pollutant_value = _to_float(
            record.get("avg_value")
            or record.get("pollutant_avg")
            or record.get("value")
        )
        if pollutant_name and pollutant_value is not None:
            grouped[key]["pollutants"][pollutant_name] = pollutant_value

        updated_dt = _parse_timestamp(record.get("last_update"))
        existing_dt = grouped[key]["lastUpdated"]
        if updated_dt and (existing_dt is None or updated_dt > existing_dt):
            grouped[key]["lastUpdated"] = updated_dt

        if grouped[key]["lat"] is None:
            grouped[key]["lat"] = _to_float(record.get("latitude"))
        if grouped[key]["lng"] is None:
            grouped[key]["lng"] = _to_float(record.get("longitude"))

    stations: list[dict[str, Any]] = []
    for index, station in enumerate(grouped.values(), start=1):
        lat = station.get("lat")
        lng = station.get("lng")
        if lat is None or lng is None:
            continue

        pollutants: dict[str, float] = station["pollutants"]
        aqi = _compute_aqi(pollutants)
        category, color = _aqi_band(aqi)
        last_updated_dt: datetime | None = station.get("lastUpdated")

        stations.append(
            {
                "stationId": f"CPCB_{index}",
                "stationName": station["stationName"],
                "city": station["city"],
                "state": station["state"],
                "lat": lat,
                "lng": lng,
                "aqi": aqi,
                "category": category,
                "color": color,
                "pollutants": {
                    "pm25": pollutants.get("pm25"),
                    "pm10": pollutants.get("pm10"),
                    "no2": pollutants.get("no2"),
                    "so2": pollutants.get("so2"),
                    "co": pollutants.get("co"),
                    "o3": pollutants.get("o3"),
                },
                "lastUpdated": (
                    last_updated_dt.isoformat()
                    if last_updated_dt
                    else datetime.now().isoformat()
                ),
                "source": "CPCB",
            }
        )

    return stations


def _fetch_waqi_city(city: str) -> dict[str, Any] | None:
    if not city or not WAQI_TOKEN:
        return None

    endpoint = f"{WAQI_BASE}/feed/{city}/?token={WAQI_TOKEN}"
    try:
        with httpx.Client(timeout=20.0) as client:
            res = client.get(endpoint)
            if res.status_code != 200:
                return None
            payload = res.json()
    except httpx.HTTPError:
        return None

    if payload.get("status") != "ok" or "data" not in payload:
        return None

    data = payload["data"]
    raw_aqi = data.get("aqi")
    try:
        aqi = int(raw_aqi)
    except (TypeError, ValueError):
        return None

    category, color = _aqi_band(aqi)
    iaqi = data.get("iaqi", {})

    lat = None
    lng = None
    geo = data.get("city", {}).get("geo", [])
    if isinstance(geo, list) and len(geo) >= 2:
        lat = _to_float(geo[0])
        lng = _to_float(geo[1])

    if lat is None or lng is None:
        return None

    station_name = str(data.get("city", {}).get("name") or f"{city} WAQI Station")
    timestamp = (
        data.get("time", {}).get("iso")
        or datetime.now().isoformat()
    )

    return {
        "stationId": f"WAQI_{city}",
        "stationName": station_name,
        "city": city,
        "state": "Unknown",
        "lat": lat,
        "lng": lng,
        "aqi": aqi,
        "category": category,
        "color": color,
        "pollutants": {
            "pm25": _to_float(iaqi.get("pm25", {}).get("v")) if isinstance(iaqi.get("pm25"), dict) else None,
            "pm10": _to_float(iaqi.get("pm10", {}).get("v")) if isinstance(iaqi.get("pm10"), dict) else None,
            "no2": _to_float(iaqi.get("no2", {}).get("v")) if isinstance(iaqi.get("no2"), dict) else None,
            "so2": _to_float(iaqi.get("so2", {}).get("v")) if isinstance(iaqi.get("so2"), dict) else None,
            "co": _to_float(iaqi.get("co", {}).get("v")) if isinstance(iaqi.get("co"), dict) else None,
            "o3": _to_float(iaqi.get("o3", {}).get("v")) if isinstance(iaqi.get("o3"), dict) else None,
        },
        "lastUpdated": timestamp,
        "source": "WAQI",
    }


def fetch_air_quality(
    state: str | None = None,
    city: str | None = None,
    station: str | None = None,
    date: str | None = None,
    time: str | None = None,
) -> dict[str, Any]:
    records = _fetch_cpcb_records()
    cpcb_stations = _aggregate_cpcb(records)

    all_states = sorted({s["state"] for s in cpcb_stations})
    all_cities = sorted({s["city"] for s in cpcb_stations})
    all_station_names = sorted({s["stationName"] for s in cpcb_stations})

    filtered = cpcb_stations
    if state:
        filtered = [s for s in filtered if s["state"].lower() == state.lower()]
    if city:
        filtered = [s for s in filtered if s["city"].lower() == city.lower()]
    if station:
        filtered = [s for s in filtered if s["stationName"].lower() == station.lower()]

    # Date/time filter applied after location filters.
    strict_filtered = [
        s for s in filtered if _matches_date_time(_parse_timestamp(s["lastUpdated"]), date, time)
    ]

    date_time_relaxed = False
    if (date or time) and not strict_filtered and filtered:
        strict_filtered = filtered
        date_time_relaxed = True

    waqi_fallback_used = False
    if not strict_filtered and city:
        waqi_station = _fetch_waqi_city(city)
        if waqi_station is not None:
            strict_filtered = [waqi_station]
            waqi_fallback_used = True

    # Build dependent dropdown options for better UX.
    city_options = sorted(
        {
            s["city"]
            for s in cpcb_stations
            if not state or s["state"].lower() == state.lower()
        }
    )
    station_options = sorted(
        {
            s["stationName"]
            for s in cpcb_stations
            if (not state or s["state"].lower() == state.lower())
            and (not city or s["city"].lower() == city.lower())
        }
    )

    return {
        "stations": strict_filtered,
        "filters": {
            "states": all_states,
            "cities": city_options if city_options else all_cities,
            "stations": station_options if station_options else all_station_names,
        },
        "meta": {
            "count": len(strict_filtered),
            "updatedAt": datetime.now().isoformat(),
            "waqiFallbackUsed": waqi_fallback_used,
            "dateTimeRelaxed": date_time_relaxed,
            "applied": {
                "state": state,
                "city": city,
                "station": station,
                "date": date,
                "time": time,
            },
        },
    }


def fetch_forecast(latitude: float, longitude: float, hours: int = 72) -> dict[str, Any]:
    safe_hours = max(24, min(72, hours))

    params = {
        "latitude": latitude,
        "longitude": longitude,
        "hourly": "pm2_5,pm10,carbon_monoxide,nitrogen_dioxide",
        "forecast_days": 4,
        "timezone": "auto",
    }

    with httpx.Client(timeout=25.0) as client:
        res = client.get(OPEN_METEO_BASE, params=params)
        res.raise_for_status()
        payload = res.json()

    hourly = payload.get("hourly", {})
    times = hourly.get("time", [])
    pm25 = hourly.get("pm2_5", [])
    pm10 = hourly.get("pm10", [])
    co = hourly.get("carbon_monoxide", [])
    no2 = hourly.get("nitrogen_dioxide", [])

    point_count = min(len(times), len(pm25), len(pm10), len(co), len(no2), safe_hours)

    points = []
    for idx in range(point_count):
        points.append(
            {
                "timestamp": times[idx],
                "pm25": pm25[idx],
                "pm10": pm10[idx],
                "co": co[idx],
                "no2": no2[idx],
            }
        )

    return {
        "latitude": latitude,
        "longitude": longitude,
        "hours": safe_hours,
        "points": points,
        "updatedAt": datetime.now().isoformat(),
    }
