"""
PrithviNet AQI Forecaster
Simple ML-based time-series forecasting using linear regression + sinusoidal model.
(For hackathon demo — in production, use Prophet/LSTM)
"""

import math
import random
from datetime import datetime, timedelta
from typing import Any

from simulator import IoTSimulator


class AQIForecaster:
    """
    Generates AQI forecasts using a physics-inspired model:
    - Diurnal cycle (rush hour peaks)
    - Trend persistence (recent AQI influences forecast)
    - Random perturbation (weather uncertainty)
    - Increasing confidence bands over time
    """

    def __init__(self):
        self.simulator = IoTSimulator()

    def predict(self, city: str = "Delhi", hours: int = 72) -> dict[str, Any]:
        """Generate AQI forecast for a city."""
        # Get recent historical data to seed the forecast
        history = self.simulator.generate_air_data(city, hours=24)
        recent_readings = history["readings"]
        current_aqi = recent_readings[-1]["aqi"] if recent_readings else 150

        # Calculate recent trend
        if len(recent_readings) >= 6:
            recent_avg = sum(r["aqi"] for r in recent_readings[-6:]) / 6
            older_avg = sum(r["aqi"] for r in recent_readings[:6]) / 6
            trend = (recent_avg - older_avg) / max(1, older_avg)  # normalized trend
        else:
            trend = 0

        now = datetime.now()
        forecasts = []
        val = float(current_aqi)

        for i in range(1, hours + 1):
            t = now + timedelta(hours=i)
            hour = t.hour

            # Diurnal pattern
            rush = 1.2 if (7 <= hour <= 10 or 17 <= hour <= 21) else 1.0
            night = 0.65 if 0 <= hour <= 5 else 1.0

            # Mean reversion + trend
            mean_aqi = current_aqi * (1 + trend * 0.1)
            val = val * 0.9 + mean_aqi * 0.1 * rush * night

            # Random perturbation (increases with forecast horizon)
            perturbation = random.gauss(0, 1) * (5 + i * 0.3)
            val = max(10, val + perturbation)

            # Confidence bands widen with time
            uncertainty = max(8, i * 0.7 + 5)

            forecasts.append({
                "timestamp": t.isoformat(),
                "hour": i,
                "predicted_aqi": round(val),
                "lower_bound": round(max(0, val - uncertainty)),
                "upper_bound": round(min(500, val + uncertainty)),
                "confidence": round(max(40, 95 - i * 0.5), 1),
            })

        # Determine advisory
        max_predicted = max(f["predicted_aqi"] for f in forecasts[:24])
        if max_predicted > 300:
            advisory = "SEVERE: AQI likely to reach hazardous levels. Health emergency advisory."
        elif max_predicted > 200:
            advisory = "POOR: AQI expected in poor range. Reduce outdoor activity."
        elif max_predicted > 100:
            advisory = "MODERATE: AQI moderate. Sensitive groups should be cautious."
        else:
            advisory = "GOOD: Air quality expected to remain satisfactory."

        return {
            "city": city,
            "forecast_hours": hours,
            "current_aqi": current_aqi,
            "forecasts": forecasts,
            "advisory": advisory,
            "model": "PrithviNet-Forecast-v1 (Diurnal + Trend + Stochastic)",
            "generated_at": now.isoformat(),
        }

    def predict_parameter(
        self, parameter: str = "pm25", city: str = "Delhi", hours: int = 72
    ) -> dict[str, Any]:
        """Forecast a specific pollutant parameter."""
        base_values = {
            "pm25": 80, "pm10": 140, "so2": 15, "no2": 35,
            "co": 1.5, "o3": 40, "bod": 4.0, "noise": 55,
        }
        base = base_values.get(parameter, 50)

        now = datetime.now()
        forecasts = []
        val = base * (1 + random.gauss(0, 0.1))

        for i in range(1, hours + 1):
            t = now + timedelta(hours=i)
            hour = t.hour
            rush = 1.15 if (7 <= hour <= 10 or 17 <= hour <= 21) else 1.0
            night = 0.7 if 0 <= hour <= 5 else 1.0

            val = val * 0.92 + base * 0.08 * rush * night + random.gauss(0, base * 0.05)
            val = max(1, val)
            uncertainty = max(2, i * 0.3 + 3)

            forecasts.append({
                "timestamp": t.isoformat(),
                "value": round(val, 1),
                "lower": round(max(0, val - uncertainty), 1),
                "upper": round(val + uncertainty, 1),
            })

        return {
            "parameter": parameter,
            "city": city,
            "forecast_hours": hours,
            "forecasts": forecasts,
            "generated_at": now.isoformat(),
        }
