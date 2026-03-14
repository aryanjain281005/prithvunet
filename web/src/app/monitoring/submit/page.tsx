"use client";

import { useState } from "react";
import { ClipboardList, Wind, Droplets, Volume2, Send, CheckCircle2, AlertTriangle } from "lucide-react";
import { useSupabaseCRUD } from "@/lib/useSupabaseCRUD";

type SubmissionType = "air" | "water" | "noise";

interface Submission {
  id: string;
  type: SubmissionType;
  station: string;
  timestamp: string;
  submittedBy: string;
  status: "Submitted" | "Validated" | "Rejected";
  data: Record<string, number>;
}

const RECENT_SUBMISSIONS: Submission[] = [
  { id: "SUB001", type: "air", station: "Anand Vihar CAAQMS", timestamp: "2026-03-10 10:30", submittedBy: "Arun Patel", status: "Validated", data: { pm25: 185, pm10: 240, so2: 25, no2: 45, co: 12, o3: 35 } },
  { id: "SUB002", type: "water", station: "Yamuna at Okhla", timestamp: "2026-03-10 09:15", submittedBy: "Kavita Joshi", status: "Submitted", data: { bod: 8.5, do: 3.2, ph: 7.8, temp: 24, cod: 32, turbidity: 18 } },
  { id: "SUB003", type: "noise", station: "Peenya Industrial NMS", timestamp: "2026-03-10 08:00", submittedBy: "Suresh Reddy", status: "Validated", data: { leq: 72, lmax: 85, lmin: 48 } },
  { id: "SUB004", type: "air", station: "ITO Junction CAAQMS", timestamp: "2026-03-09 18:00", submittedBy: "Meena Devi", status: "Rejected", data: { pm25: 0, pm10: 0, so2: 0, no2: 0 } },
  { id: "SUB005", type: "water", station: "Ganga at Varanasi", timestamp: "2026-03-09 16:45", submittedBy: "Rahul Nair", status: "Validated", data: { bod: 2.1, do: 6.8, ph: 7.2, temp: 22 } },
];

const airFields = [
  { key: "pm25", label: "PM₂.₅", unit: "µg/m³", limit: 60 },
  { key: "pm10", label: "PM₁₀", unit: "µg/m³", limit: 100 },
  { key: "so2", label: "SO₂", unit: "µg/m³", limit: 80 },
  { key: "no2", label: "NO₂", unit: "µg/m³", limit: 80 },
  { key: "co", label: "CO", unit: "mg/m³", limit: 4 },
  { key: "o3", label: "O₃", unit: "µg/m³", limit: 180 },
  { key: "nh3", label: "NH₃", unit: "µg/m³", limit: 400 },
];

const waterFields = [
  { key: "bod", label: "BOD", unit: "mg/L", limit: 3 },
  { key: "do", label: "Dissolved Oxygen", unit: "mg/L", limit: 4 },
  { key: "ph", label: "pH", unit: "", limit: 8.5 },
  { key: "temp", label: "Temperature", unit: "°C", limit: 40 },
  { key: "nitrate", label: "Nitrate", unit: "mg/L", limit: 45 },
  { key: "cod", label: "COD", unit: "mg/L", limit: 50 },
  { key: "turbidity", label: "Turbidity", unit: "NTU", limit: 25 },
];

const noiseFields = [
  { key: "leq", label: "Leq (Equivalent)", unit: "dB(A)", limit: 75 },
  { key: "lmax", label: "Lmax (Maximum)", unit: "dB(A)", limit: 90 },
  { key: "lmin", label: "Lmin (Minimum)", unit: "dB(A)", limit: 40 },
];

const statusStyle = {
  Submitted: "bg-blue-500/20 text-blue-400",
  Validated: "bg-green-500/20 text-green-400",
  Rejected: "bg-red-500/20 text-red-400",
};

export default function SubmitPage() {
  const [type, setType] = useState<SubmissionType>("air");
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [station, setStation] = useState("");
  const { data: submissions, addItem } = useSupabaseCRUD<Submission>("submissions", RECENT_SUBMISSIONS);
  const [submitted, setSubmitted] = useState(false);
  const [violations, setViolations] = useState<string[]>([]);

  const fields = type === "air" ? airFields : type === "water" ? waterFields : noiseFields;

  const handleSubmit = () => {
    if (!station) return;
    const data: Record<string, number> = {};
    const viols: string[] = [];
    fields.forEach((f) => {
      const val = parseFloat(formData[f.key] || "0");
      data[f.key] = val;
      if (f.key === "do" ? val < f.limit : val > f.limit) {
        viols.push(`${f.label}: ${val} ${f.unit} exceeds limit (${f.limit} ${f.unit})`);
      }
    });
    setViolations(viols);
    const newSub: Submission = {
      id: `SUB${String(submissions.length + 1).padStart(3, "0")}`,
      type,
      station,
      timestamp: new Date().toLocaleString("en-IN"),
      submittedBy: "Current User",
      status: "Submitted",
      data,
    };
    addItem(newSub);
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 4000);
    setFormData({});
    setStation("");
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Environmental Data Submission</h1>
        <p className="text-sm text-muted">Submit Air, Water, or Noise monitoring data</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Submission Form */}
        <div className="lg:col-span-3">
          <div className="rounded-xl border border-border bg-card p-6">
            {/* Type selector */}
            <div className="mb-5 flex gap-2">
              {([
                { id: "air" as const, label: "Air Quality", icon: Wind, color: "yellow" },
                { id: "water" as const, label: "Water Quality", icon: Droplets, color: "blue" },
                { id: "noise" as const, label: "Noise Level", icon: Volume2, color: "purple" },
              ]).map((t) => (
                <button
                  key={t.id}
                  onClick={() => { setType(t.id); setFormData({}); setViolations([]); }}
                  className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
                    type === t.id ? `bg-${t.color}-500/15 text-${t.color}-400 border border-${t.color}-500/30` : "border border-border text-muted hover:text-white"
                  }`}
                >
                  <t.icon size={16} /> {t.label}
                </button>
              ))}
            </div>

            {/* Station selection */}
            <div className="mb-4">
              <label className="mb-1.5 block text-xs font-medium text-muted">Monitoring Station</label>
              <input
                type="text"
                placeholder="Enter station name or ID..."
                value={station}
                onChange={(e) => setStation(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-white placeholder:text-muted focus:border-primary focus:outline-none"
              />
            </div>

            {/* Parameter fields */}
            <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {fields.map((f) => (
                <div key={f.key}>
                  <label className="mb-1.5 flex items-center justify-between text-xs">
                    <span className="font-medium text-muted">{f.label}</span>
                    <span className="text-[10px] text-muted">Limit: {f.limit} {f.unit}</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData[f.key] || ""}
                      onChange={(e) => setFormData({ ...formData, [f.key]: e.target.value })}
                      className={`w-full rounded-lg border px-3 py-2.5 text-sm text-white placeholder:text-muted focus:outline-none ${
                        formData[f.key] && (f.key === "do" ? parseFloat(formData[f.key]) < f.limit : parseFloat(formData[f.key]) > f.limit)
                          ? "border-red-500/50 bg-red-500/5"
                          : "border-border bg-background focus:border-primary"
                      }`}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted">{f.unit}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Violations warning */}
            {violations.length > 0 && (
              <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/5 p-3">
                <div className="flex items-center gap-2 text-sm font-medium text-red-400">
                  <AlertTriangle size={14} /> Limit Violations Detected
                </div>
                <ul className="mt-2 space-y-1">
                  {violations.map((v, i) => (
                    <li key={i} className="text-xs text-red-400/80">• {v}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Success message */}
            {submitted && (
              <div className="mb-4 flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/5 p-3 text-sm text-green-400">
                <CheckCircle2 size={14} /> Data submitted successfully! Auto-compliance check triggered.
              </div>
            )}

            {/* Submit */}
            <button onClick={handleSubmit} className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white hover:bg-primary-dark">
              <Send size={14} /> Submit Data
            </button>
          </div>
        </div>

        {/* Recent Submissions */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
              <ClipboardList size={16} className="text-primary" /> Recent Submissions
            </h3>
            <div className="space-y-3">
              {submissions.slice(0, 8).map((s) => {
                const Icon = s.type === "air" ? Wind : s.type === "water" ? Droplets : Volume2;
                return (
                  <div key={s.id} className="rounded-lg border border-border bg-background p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Icon size={14} className="text-muted" />
                        <div>
                          <p className="text-xs font-medium text-white">{s.station}</p>
                          <p className="text-[10px] text-muted">{s.submittedBy} • {s.timestamp}</p>
                        </div>
                      </div>
                      <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${statusStyle[s.status]}`}>{s.status}</span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-muted">
                      {Object.entries(s.data).slice(0, 4).map(([k, v]) => (
                        <span key={k} className="rounded bg-white/5 px-1.5 py-0.5">{k}: {v}</span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
