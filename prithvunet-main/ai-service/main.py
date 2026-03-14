"""
PrithviNet AI Service — FastAPI Backend
IoT Simulator, ML Forecasting, Anomaly Detection
"""

from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime

from simulator import IoTSimulator
from forecaster import AQIForecaster
from anomaly import AnomalyDetector
from air_quality_backend import fetch_air_quality, fetch_forecast
from routers import industry
from routers import industry, noise

app = FastAPI(
    title="PrithviNet AI Service",
    description="Smart Environmental Monitoring — AI & Data Backend",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(industry.router, prefix="/api/v1", tags=["Industry"])
app.include_router(noise.router,    prefix="/api/v1", tags=["Noise"])

simulator = IoTSimulator()
forecaster = AQIForecaster()
anomaly_detector = AnomalyDetector()


@app.get("/")
def root():
    return {
        "service": "PrithviNet AI Service",
        "version": "1.0.0",
        "status": "running",
        "timestamp": datetime.now().isoformat(),
    }


# ============================================
# IoT Simulator Endpoints
# ============================================


@app.get("/api/simulate/air")
def simulate_air(city: str = "Delhi", hours: int = Query(default=24, le=720)):
    """Generate realistic simulated air quality data for a city."""
    return simulator.generate_air_data(city, hours)


@app.get("/api/simulate/water")
def simulate_water(station: str = "Yamuna at Delhi"):
    """Generate simulated water quality data for a monitoring station."""
    return simulator.generate_water_data(station)


@app.get("/api/simulate/noise")
def simulate_noise(zone: str = "Residential"):
    """Generate simulated noise level data for a zone."""
    return simulator.generate_noise_data(zone)


@app.get("/api/simulate/industry")
def simulate_industry(industry_type: str = "Steel"):
    """Generate simulated OCEMS data for an industrial unit."""
    return simulator.generate_industry_data(industry_type)


@app.get("/api/simulate/iot-stream")
def iot_stream(city: str = "Delhi", count: int = Query(default=10, le=100)):
    """Simulate real-time IoT sensor stream (batch of readings)."""
    return simulator.generate_iot_stream(city, count)


# ============================================
# Forecasting Endpoints
# ============================================


@app.get("/api/forecast/aqi")
def forecast_aqi(city: str = "Delhi", hours: int = Query(default=72, le=168)):
    """ML-based AQI forecast with confidence intervals."""
    return forecaster.predict(city, hours)


@app.get("/api/forecast/trend")
def forecast_trend(
    parameter: str = "pm25",
    city: str = "Delhi",
    hours: int = Query(default=72, le=168),
):
    """Forecast specific pollutant trend."""
    return forecaster.predict_parameter(parameter, city, hours)


# ============================================
# Real Air Monitoring Endpoints
# ============================================


@app.get("/api/air-quality")
def air_quality(
    state: str | None = None,
    city: str | None = None,
    station: str | None = None,
    date: str | None = None,
    time: str | None = None,
):
    """Fetch CPCB air-quality stations with WAQI fallback for missing city data."""
    try:
        return fetch_air_quality(
            state=state,
            city=city,
            station=station,
            date=date,
            time=time,
        )
    except Exception as exc:  # pragma: no cover - defensive API guard
        raise HTTPException(status_code=500, detail=f"Failed to fetch air quality: {exc}")


@app.get("/api/forecast")
def forecast(
    latitude: float,
    longitude: float,
    hours: int = Query(default=72, ge=24, le=72),
):
    """Fetch Open-Meteo air quality forecast for next 24-72 hours."""
    try:
        return fetch_forecast(latitude=latitude, longitude=longitude, hours=hours)
    except Exception as exc:  # pragma: no cover - defensive API guard
        raise HTTPException(status_code=500, detail=f"Failed to fetch forecast: {exc}")


# ============================================
# Anomaly Detection Endpoints
# ============================================


@app.get("/api/anomaly/detect")
def detect_anomalies(city: str = "Delhi"):
    """Run anomaly detection on latest readings for a city."""
    data = simulator.generate_air_data(city, hours=48)
    return anomaly_detector.detect(data["readings"])


@app.get("/api/anomaly/report")
def anomaly_report():
    """Generate anomaly detection report across all cities."""
    cities = ["Delhi", "Mumbai", "Kolkata", "Chennai", "Bengaluru", "Hyderabad"]
    reports = []
    for city in cities:
        data = simulator.generate_air_data(city, hours=24)
        result = anomaly_detector.detect(data["readings"])
        reports.append({"city": city, **result})
    return {"reports": reports, "timestamp": datetime.now().isoformat()}


# ============================================
# Health & Utility
# ============================================


@app.get("/api/health")
def health():
    return {
        "status": "healthy",
        "services": {
            "simulator": "active",
            "forecaster": "active",
            "anomaly_detector": "active",
        },
        "timestamp": datetime.now().isoformat(),
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
