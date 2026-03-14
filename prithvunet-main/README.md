# 🌍 PrithviNet — Smart Environmental Monitoring & Compliance Platform

**Air • Water • Noise — Real-time Monitoring for India**

PrithviNet is a comprehensive environmental monitoring platform that tracks air quality, water quality, and noise levels across India using real-time data from CPCB (Central Pollution Control Board) networks, with AI-powered forecasting and anomaly detection.

---

## 🚀 Features

### 📊 Dashboard
- Real-time AQI monitoring for 16+ Indian cities
- Live data from WAQI API (World Air Quality Index)
- Water quality & noise level overview
- Auto-refreshing every 60 seconds

### 🗺️ Geo-Spatial Map
- Interactive Leaflet.js map with dark theme
- Color-coded markers for air, water, and noise stations
- Layer filtering (Air / Water / Noise / All)
- AQI legend with India NAQI standards

### 🔔 Alerts & Compliance
- Auto-generated alerts from CPCB limit exceedances
- Severity filtering (Critical / Warning)
- Escalation workflow (Active → Acknowledged → Resolved)
- Type-based filtering (Air / Water / Noise)

### 🏭 Industry Registry
- 12 major Indian industries tracked
- Compliance status with emissions & effluent data
- Searchable, filterable table with detail panel
- Stack emissions & effluent discharge monitoring

### 📈 Reports & Analytics
- PM₂.₅, PM₁₀ trend charts with NAAQS limit lines
- 72-hour AQI forecast with confidence bands
- BOD water quality trends
- City-wise AQI comparison table

### 🤖 AI Copilot
- Chat interface for environmental analysis
- What-if scenario modeling
- Predictive insights and health advisories
- Markdown-formatted responses with data tables

### 👥 Citizen Portal
- Public-facing dashboard (no login required)
- Health advisories based on AQI levels
- Expandable city cards with pollutant details
- Tabbed view: Air / Water / Noise

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, TypeScript |
| Styling | Tailwind CSS v4 |
| Charts | Recharts |
| Maps | Leaflet.js + react-leaflet |
| Icons | Lucide React |
| Backend API | Python FastAPI |
| AI/ML | Scikit-learn, NumPy, Pandas |
| Data Source | WAQI API (real-time) + Simulated |

---

## 📦 Project Structure

```
ecell/
├── web/                      # Next.js Frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx          # Dashboard
│   │   │   ├── map/page.tsx      # Geo-Spatial Map
│   │   │   ├── alerts/page.tsx   # Alerts & Compliance
│   │   │   ├── industries/page.tsx # Industry Registry
│   │   │   ├── reports/page.tsx  # Reports & Analytics
│   │   │   ├── copilot/page.tsx  # AI Copilot
│   │   │   └── citizen/page.tsx  # Citizen Portal
│   │   ├── components/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── StatCard.tsx
│   │   │   ├── AQIGauge.tsx
│   │   │   └── Charts.tsx
│   │   └── lib/
│   │       ├── types.ts          # TypeScript types
│   │       ├── constants.ts      # Config & static data
│   │       └── api.ts            # Data fetching & simulation
│   └── package.json
│
└── ai-service/               # Python FastAPI Backend
    ├── main.py               # FastAPI server
    ├── simulator.py          # IoT data simulator
    ├── forecaster.py         # ML-based AQI forecasting
    ├── anomaly.py            # Anomaly detection
    └── requirements.txt
```

---

## 🏃 Getting Started

### Frontend (Next.js)

```bash
cd web
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Backend (Python)

```bash
cd ai-service
pip install -r requirements.txt
python main.py
```

API at [http://localhost:8000](http://localhost:8000)
Docs at [http://localhost:8000/docs](http://localhost:8000/docs)

### Environment Variables

Create `web/.env.local`:
```
NEXT_PUBLIC_WAQI_TOKEN=your_waqi_api_token
```

Get a free token at [https://aqicn.org/data-platform/token/](https://aqicn.org/data-platform/token/)

---

## 📊 Data Strategy

| Data Type | Source | Status |
|-----------|--------|--------|
| Air Quality | WAQI API (real-time) | ✅ Live |
| Water Quality | Simulated (CPCB RTWQMS parameters) | 🔄 Simulated |
| Noise Levels | Simulated (CPCB standards) | 🔄 Simulated |
| Industrial Emissions | Simulated (OCEMS format) | 🔄 Simulated |

---

## 🏆 Hackathon Evaluation Criteria

- ✅ **Technical Implementation** — Next.js + FastAPI, TypeScript, clean architecture
- ✅ **Real-time Capability** — WAQI API integration, auto-refresh, IoT simulation
- ✅ **Data Visualization** — Interactive charts, maps, gauges, tables
- ✅ **Innovation Features** — AI Copilot, anomaly detection, what-if scenarios
- ✅ **Scalability** — Modular design, API-first architecture
- ✅ **Environmental Impact** — Citizen portal, health advisories, compliance tracking

---

Built with 💚 for the environment
