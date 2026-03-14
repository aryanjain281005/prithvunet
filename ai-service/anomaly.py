"""
PrithviNet Anomaly Detector
Detects anomalous readings using statistical methods.
(Z-score based + threshold checks against CPCB limits)
"""

import math
from datetime import datetime
from typing import Any


# CPCB NAAQS limits
CPCB_LIMITS = {
    "pm25": 60,
    "pm10": 100,
    "so2": 80,
    "no2": 80,
    "co": 4.0,
    "o3": 180,
}


class AnomalyDetector:
    """
    Detects anomalies in environmental sensor data using:
    1. Z-score method (readings > 2σ from mean)
    2. CPCB limit exceedance (readings above prescribed standards)
    3. Sudden spike detection (> 50% change in 1 hour)
    """

    def _compute_stats(self, values: list[float]) -> tuple[float, float]:
        """Compute mean and std deviation."""
        if not values:
            return 0.0, 1.0
        n = len(values)
        mean = sum(values) / n
        variance = sum((x - mean) ** 2 for x in values) / max(1, n - 1)
        std = math.sqrt(variance)
        return mean, max(std, 0.01)  # Avoid division by zero

    def detect(self, readings: list[dict[str, Any]]) -> dict[str, Any]:
        """
        Detect anomalies in a series of air quality readings.

        Args:
            readings: List of dicts with keys like pm25, pm10, so2, no2, co, o3, aqi

        Returns:
            Dict with anomalies, summary stats, and severity assessment.
        """
        if not readings:
            return {"anomalies": [], "summary": "No data", "anomaly_count": 0}

        parameters = ["pm25", "pm10", "so2", "no2", "co", "o3"]
        anomalies = []

        for param in parameters:
            values = [r.get(param, 0) for r in readings if r.get(param) is not None]
            if not values:
                continue

            mean, std = self._compute_stats(values)
            limit = CPCB_LIMITS.get(param, float("inf"))

            for i, reading in enumerate(readings):
                val = reading.get(param)
                if val is None:
                    continue

                reasons = []

                # Z-score anomaly
                z_score = (val - mean) / std
                if abs(z_score) > 2.0:
                    reasons.append(f"Statistical outlier (z={z_score:.1f})")

                # CPCB limit exceedance
                if val > limit:
                    ratio = val / limit
                    reasons.append(f"Exceeds CPCB limit by {(ratio - 1) * 100:.0f}%")

                # Sudden spike (compared to previous reading)
                if i > 0:
                    prev = readings[i - 1].get(param, val)
                    if prev > 0:
                        change = abs(val - prev) / prev
                        if change > 0.5:
                            reasons.append(f"Sudden spike ({change * 100:.0f}% change)")

                if reasons:
                    severity = "Critical" if val > limit * 2 or abs(z_score) > 3 else "Warning"
                    anomalies.append({
                        "timestamp": reading.get("timestamp", ""),
                        "parameter": param,
                        "value": val,
                        "mean": round(mean, 1),
                        "std": round(std, 1),
                        "z_score": round(z_score, 2),
                        "limit": limit,
                        "severity": severity,
                        "reasons": reasons,
                    })

        # Summary
        critical_count = sum(1 for a in anomalies if a["severity"] == "Critical")
        warning_count = sum(1 for a in anomalies if a["severity"] == "Warning")
        affected_params = list(set(a["parameter"] for a in anomalies))

        if critical_count > 5:
            summary = "CRITICAL: Multiple severe anomalies detected. Immediate investigation required."
        elif critical_count > 0:
            summary = f"WARNING: {critical_count} critical anomalies detected in {', '.join(affected_params)}."
        elif warning_count > 0:
            summary = f"CAUTION: {warning_count} minor anomalies detected. Monitoring advised."
        else:
            summary = "NORMAL: No significant anomalies detected."

        return {
            "anomaly_count": len(anomalies),
            "critical": critical_count,
            "warnings": warning_count,
            "affected_parameters": affected_params,
            "summary": summary,
            "anomalies": anomalies[:20],  # Limit to top 20
            "analysis_timestamp": datetime.now().isoformat(),
        }
