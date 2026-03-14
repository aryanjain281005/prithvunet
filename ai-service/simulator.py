"""
PrithviNet IoT Simulator
Generates realistic environmental sensor data based on Indian CPCB standards.
"""

import math
import random
from datetime import datetime, timedelta
from typing import Any

# City-specific pollution profiles (realistic for India)
CITY_PROFILES = {
    "Delhi": {"pm25_base": 120, "pm10_base": 200, "so2_base": 18, "no2_base": 45, "co_base": 1.8, "o3_base": 35},
    "Mumbai": {"pm25_base": 65, "pm10_base": 110, "so2_base": 12, "no2_base": 35, "co_base": 1.2, "o3_base": 40},
    "Kolkata": {"pm25_base": 80, "pm10_base": 140, "so2_base": 15, "no2_base": 38, "co_base": 1.5, "o3_base": 30},
    "Chennai": {"pm25_base": 45, "pm10_base": 80, "so2_base": 8, "no2_base": 25, "co_base": 0.8, "o3_base": 45},
    "Bengaluru": {"pm25_base": 55, "pm10_base": 95, "so2_base": 10, "no2_base": 30, "co_base": 1.0, "o3_base": 42},
    "Hyderabad": {"pm25_base": 60, "pm10_base": 100, "so2_base": 11, "no2_base": 32, "co_base": 1.1, "o3_base": 38},
    "Ahmedabad": {"pm25_base": 75, "pm10_base": 130, "so2_base": 14, "no2_base": 36, "co_base": 1.3, "o3_base": 36},
    "Pune": {"pm25_base": 50, "pm10_base": 85, "so2_base": 9, "no2_base": 28, "co_base": 0.9, "o3_base": 40},
    "Jaipur": {"pm25_base": 85, "pm10_base": 160, "so2_base": 13, "no2_base": 34, "co_base": 1.4, "o3_base": 32},
    "Lucknow": {"pm25_base": 95, "pm10_base": 170, "so2_base": 16, "no2_base": 40, "co_base": 1.6, "o3_base": 28},
    "Patna": {"pm25_base": 100, "pm10_base": 180, "so2_base": 17, "no2_base": 42, "co_base": 1.7, "o3_base": 25},
    "Varanasi": {"pm25_base": 90, "pm10_base": 155, "so2_base": 15, "no2_base": 38, "co_base": 1.5, "o3_base": 30},
}

# CPCB NAAQS limits
LIMITS = {
    "pm25": 60,    # µg/m³ (24-hr)
    "pm10": 100,   # µg/m³ (24-hr)
    "so2": 80,     # µg/m³ (24-hr)
    "no2": 80,     # µg/m³ (24-hr)
    "co": 4.0,     # mg/m³ (8-hr)
    "o3": 180,     # µg/m³ (1-hr)
}


class IoTSimulator:
    """Simulates IoT sensor data for air, water, noise, and industrial emissions."""

    def _get_profile(self, city: str) -> dict:
        return CITY_PROFILES.get(city, CITY_PROFILES["Delhi"])

    def _diurnal_factor(self, hour: int) -> float:
        """Simulate diurnal variation — higher during rush hours, lower at night."""
        if 7 <= hour <= 10 or 17 <= hour <= 21:
            return 1.2 + random.uniform(0, 0.15)   # Rush hour
        elif 0 <= hour <= 5:
            return 0.55 + random.uniform(0, 0.1)   # Night
        elif 11 <= hour <= 15:
            return 0.9 + random.uniform(0, 0.1)    # Midday mixing
        else:
            return 1.0 + random.uniform(-0.05, 0.05)

    def _seasonal_factor(self) -> float:
        """Seasonal variation — worse in winter (Oct-Feb), better in monsoon."""
        month = datetime.now().month
        if month in (11, 12, 1):
            return 1.5    # Winter inversion
        elif month in (2, 10):
            return 1.2
        elif month in (6, 7, 8):
            return 0.6    # Monsoon washout
        elif month in (3, 4, 5):
            return 0.85   # Pre-monsoon heat
        return 1.0

    def _aqi_from_pm25(self, pm25: float) -> int:
        """Calculate India AQI from PM2.5 (Indian NAQI breakpoints)."""
        breakpoints = [
            (0, 30, 0, 50),
            (31, 60, 51, 100),
            (61, 90, 101, 200),
            (91, 120, 201, 300),
            (121, 250, 301, 400),
            (251, 500, 401, 500),
        ]
        for c_lo, c_hi, i_lo, i_hi in breakpoints:
            if c_lo <= pm25 <= c_hi:
                return round(((i_hi - i_lo) / (c_hi - c_lo)) * (pm25 - c_lo) + i_lo)
        return min(500, round(pm25 * 1.5))

    def generate_air_data(self, city: str, hours: int = 24) -> dict[str, Any]:
        """Generate hourly air quality time series for a city."""
        profile = self._get_profile(city)
        seasonal = self._seasonal_factor()
        readings = []
        now = datetime.now()

        for i in range(hours, 0, -1):
            t = now - timedelta(hours=i)
            diurnal = self._diurnal_factor(t.hour)
            noise = 1 + random.gauss(0, 0.1)

            pm25 = round(max(5, profile["pm25_base"] * diurnal * seasonal * noise), 1)
            pm10 = round(max(10, profile["pm10_base"] * diurnal * seasonal * noise), 1)
            so2 = round(max(1, profile["so2_base"] * diurnal * seasonal * noise * 0.8), 1)
            no2 = round(max(2, profile["no2_base"] * diurnal * seasonal * noise), 1)
            co = round(max(0.1, profile["co_base"] * diurnal * seasonal * noise), 2)
            o3 = round(max(5, profile["o3_base"] * (2 - diurnal) * seasonal * noise), 1)  # Ozone inversely related

            aqi = self._aqi_from_pm25(pm25)

            readings.append({
                "timestamp": t.isoformat(),
                "pm25": pm25,
                "pm10": pm10,
                "so2": so2,
                "no2": no2,
                "co": co,
                "o3": o3,
                "aqi": aqi,
                "temperature": round(25 + 8 * math.sin(math.pi * (t.hour - 6) / 12) + random.gauss(0, 1), 1),
                "humidity": round(max(20, min(95, 60 + 20 * math.sin(math.pi * (t.hour - 14) / 12) + random.gauss(0, 5))), 1),
                "wind_speed": round(max(0.5, 3 + 2 * math.sin(math.pi * t.hour / 12) + random.gauss(0, 0.5)), 1),
            })

        return {
            "city": city,
            "hours": hours,
            "readings": readings,
            "latest_aqi": readings[-1]["aqi"] if readings else 0,
            "generated_at": now.isoformat(),
        }

    def generate_water_data(self, station: str = "Yamuna at Delhi") -> dict[str, Any]:
        """Generate water quality data for a monitoring station."""
        # Pollution profiles for different rivers
        pollution_level = 1.0
        river = station.split(" at ")[0] if " at " in station else station
        if "Yamuna" in station and "Delhi" in station:
            pollution_level = 3.0
        elif river in ("Musi", "Cooum"):
            pollution_level = 2.5
        elif "Ganga" in station and "Haridwar" in station:
            pollution_level = 0.3

        now = datetime.now()
        bod = round(max(0.5, random.gauss(3 * pollution_level, 1)), 1)
        do = round(max(1, min(12, random.gauss(8 / pollution_level, 0.8))), 1)
        ph = round(random.gauss(7.2, 0.3), 1)
        temperature = round(random.gauss(26, 3), 1)
        cod = round(max(1, random.gauss(8 * pollution_level, 2)), 1)
        nitrate = round(max(0.1, random.gauss(5 * pollution_level, 2)), 1)
        turbidity = round(max(1, random.gauss(10 * pollution_level, 3)), 1)

        status = "Safe"
        if bod > 10 or do < 2:
            status = "Critical"
        elif bod > 6 or do < 4:
            status = "Polluted"
        elif bod > 3 or do < 6:
            status = "Caution"

        return {
            "station": station,
            "river": river,
            "timestamp": now.isoformat(),
            "parameters": {
                "bod": bod,
                "dissolved_oxygen": do,
                "ph": ph,
                "temperature": temperature,
                "cod": cod,
                "nitrate": nitrate,
                "turbidity": turbidity,
            },
            "status": status,
        }

    def generate_noise_data(self, zone: str = "Residential") -> dict[str, Any]:
        """Generate noise level data for a zone."""
        limits = {
            "Industrial": {"day": 75, "night": 70},
            "Commercial": {"day": 65, "night": 55},
            "Residential": {"day": 55, "night": 45},
            "Silence": {"day": 50, "night": 40},
        }
        zone_limits = limits.get(zone, limits["Residential"])
        hour = datetime.now().hour
        is_day = 6 <= hour < 22
        limit = zone_limits["day"] if is_day else zone_limits["night"]

        base_noise = {
            "Industrial": random.gauss(65, 8),
            "Commercial": random.gauss(58, 7),
            "Residential": random.gauss(48, 5),
            "Silence": random.gauss(42, 4),
        }
        leq = round(max(25, base_noise.get(zone, 48)), 1)

        return {
            "zone": zone,
            "period": "Day" if is_day else "Night",
            "timestamp": datetime.now().isoformat(),
            "leq": leq,
            "lmax": round(leq + random.uniform(5, 15), 1),
            "lmin": round(max(20, leq - random.uniform(5, 15)), 1),
            "limit": limit,
            "exceedance": leq > limit,
            "margin": round(leq - limit, 1),
        }

    def generate_industry_data(self, industry_type: str = "Steel") -> dict[str, Any]:
        """Generate OCEMS (Online Continuous Emission Monitoring) data."""
        profiles = {
            "Steel": {"pm": (80, 30), "so2": (150, 50), "nox": (100, 30)},
            "Cement": {"pm": (50, 20), "so2": (100, 30), "nox": (80, 25)},
            "Power": {"pm": (60, 25), "so2": (200, 60), "nox": (150, 40)},
            "Refinery": {"pm": (30, 15), "so2": (120, 40), "nox": (90, 30)},
            "Chemical": {"pm": (40, 20), "so2": (80, 30), "nox": (70, 25)},
        }
        profile = profiles.get(industry_type, profiles["Steel"])

        stack_emissions = {}
        for param, (mean, std) in profile.items():
            stack_emissions[param] = round(max(5, random.gauss(mean, std)), 1)

        # Effluent data
        effluent = {
            "ph": round(random.gauss(7.5, 0.5), 1),
            "bod": round(max(1, random.gauss(20, 8)), 1),
            "cod": round(max(5, random.gauss(60, 20)), 1),
            "tss": round(max(5, random.gauss(40, 15)), 1),
        }

        return {
            "industry_type": industry_type,
            "timestamp": datetime.now().isoformat(),
            "stack_emissions": stack_emissions,
            "effluent": effluent,
            "compliance": all(
                v < 150 for v in stack_emissions.values()
            ) and effluent["bod"] < 30 and 6.5 <= effluent["ph"] <= 8.5,
        }

    def generate_iot_stream(self, city: str, count: int = 10) -> dict[str, Any]:
        """Simulate a batch of IoT sensor readings (as if from a real-time stream)."""
        profile = self._get_profile(city)
        now = datetime.now()
        readings = []
        for i in range(count):
            t = now - timedelta(seconds=i * 30)
            noise = 1 + random.gauss(0, 0.05)
            readings.append({
                "sensor_id": f"{city[:3].upper()}-AQ-{random.randint(100, 999)}",
                "timestamp": t.isoformat(),
                "pm25": round(max(5, profile["pm25_base"] * noise), 1),
                "pm10": round(max(10, profile["pm10_base"] * noise), 1),
                "temperature": round(random.gauss(28, 3), 1),
                "humidity": round(random.gauss(55, 10), 1),
            })
        return {"city": city, "stream": readings, "count": len(readings)}
