"use client";

import { useState } from "react";
import { Plus, Search, Calendar, Users, MapPin, Play, Pause, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import { useSupabaseCRUD } from "@/lib/useSupabaseCRUD";

interface Campaign {
  id: string;
  name: string;
  type: "air" | "water" | "noise" | "multi";
  status: "Active" | "Scheduled" | "Completed" | "Paused";
  region: string;
  startDate: string;
  endDate: string;
  description: string;
  stations: number;
  assignedTeam: string;
  lead: string;
  progress: number;
  samplesCollected: number;
  samplesTarget: number;
}

const CAMPAIGNS: Campaign[] = [
  { id: "CAM001", name: "Diwali Air Quality Surge Monitoring", type: "air", status: "Completed", region: "Delhi NCR", startDate: "2025-10-25", endDate: "2025-11-10", description: "Intensive PM₂.₅ and PM₁₀ monitoring during Diwali festive period across 15 stations in Delhi NCR to assess impact of firecracker emissions.", stations: 15, assignedTeam: "DPCC Field Team A", lead: "Arun Patel", progress: 100, samplesCollected: 420, samplesTarget: 420 },
  { id: "CAM002", name: "Ganga Water Quality Assessment Q1 2026", type: "water", status: "Active", region: "Uttar Pradesh", startDate: "2026-01-15", endDate: "2026-03-31", description: "Quarterly assessment of Ganga tributaries covering BOD, DO, coliform, and heavy metals at 8 monitoring points from Haridwar to Varanasi.", stations: 8, assignedTeam: "UPPCB Water Team", lead: "Rahul Nair", progress: 72, samplesCollected: 288, samplesTarget: 400 },
  { id: "CAM003", name: "Industrial Belt Noise Survey — Peenya", type: "noise", status: "Active", region: "Karnataka", startDate: "2026-02-01", endDate: "2026-04-30", description: "Comprehensive noise level survey of Peenya Industrial Area including day/night Leq measurements and frequency analysis.", stations: 6, assignedTeam: "KSPCB Team A", lead: "Suresh Reddy", progress: 45, samplesCollected: 135, samplesTarget: 300 },
  { id: "CAM004", name: "Pre-Monsoon River Health Baseline", type: "water", status: "Scheduled", region: "Maharashtra", startDate: "2026-05-01", endDate: "2026-06-15", description: "Pre-monsoon baseline water quality data for Mithi River, Ulhas River, and coastal creek systems in Mumbai Metropolitan Region.", stations: 12, assignedTeam: "MPCB Mumbai Team", lead: "Priya Sharma", progress: 0, samplesCollected: 0, samplesTarget: 360 },
  { id: "CAM005", name: "Winter Smog Episode Tracking", type: "air", status: "Completed", region: "Delhi NCR", startDate: "2025-12-01", endDate: "2026-01-31", description: "Real-time monitoring of PM₂.₅, visibility, and meteorological parameters during winter smog episodes for GRAP enforcement.", stations: 20, assignedTeam: "DPCC Field Team B", lead: "Meena Devi", progress: 100, samplesCollected: 1200, samplesTarget: 1200 },
  { id: "CAM006", name: "Hospital Zone Silence Compliance", type: "noise", status: "Paused", region: "Delhi", startDate: "2026-02-15", endDate: "2026-04-15", description: "Verification of noise levels in designated silence zones around 10 major hospitals. Paused due to sensor calibration.", stations: 10, assignedTeam: "DPCC Noise Team", lead: "Arun Patel", progress: 30, samplesCollected: 90, samplesTarget: 300 },
  { id: "CAM007", name: "Sabarmati Rejuvenation Impact Study", type: "multi", status: "Active", region: "Gujarat", startDate: "2026-01-01", endDate: "2026-06-30", description: "Multi-parameter study of Sabarmati River covering water quality, ambient air near banks, and noise from riverfront activities.", stations: 10, assignedTeam: "GPCB Water Team", lead: "Rakesh Gupta", progress: 38, samplesCollected: 228, samplesTarget: 600 },
];

const typeLabel: Record<string, string> = { air: "Air Quality", water: "Water Quality", noise: "Noise Level", multi: "Multi-Parameter" };
const typeColor: Record<string, string> = { air: "text-yellow-400 bg-yellow-500/15", water: "text-blue-400 bg-blue-500/15", noise: "text-purple-400 bg-purple-500/15", multi: "text-green-400 bg-green-500/15" };
const statusIcon: Record<string, React.ReactNode> = { Active: <Play size={10} />, Scheduled: <Clock size={10} />, Completed: <CheckCircle2 size={10} />, Paused: <Pause size={10} /> };
const statusColor: Record<string, string> = { Active: "bg-green-500/20 text-green-400", Scheduled: "bg-blue-500/20 text-blue-400", Completed: "bg-gray-500/20 text-gray-400", Paused: "bg-yellow-500/20 text-yellow-400" };

export default function CampaignsPage() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<Campaign | null>(null);
  const { data: campaigns, addItem } = useSupabaseCRUD<Campaign>("campaigns", CAMPAIGNS);

  const [form, setForm] = useState({ name: "", type: "air", region: "", startDate: "", endDate: "", description: "", stations: "", assignedTeam: "", lead: "", samplesTarget: "" });

  const filtered = campaigns.filter((c) => {
    if (filterStatus !== "all" && c.status !== filterStatus) return false;
    return c.name.toLowerCase().includes(search.toLowerCase()) || c.region.toLowerCase().includes(search.toLowerCase());
  });

  const active = campaigns.filter((c) => c.status === "Active").length;
  const completed = campaigns.filter((c) => c.status === "Completed").length;
  const totalSamples = campaigns.reduce((s, c) => s + c.samplesCollected, 0);

  const handleAdd = () => {
    if (!form.name || !form.startDate || !form.endDate) return;
    const nc: Campaign = {
      id: "CAM" + String(campaigns.length + 1).padStart(3, "0"),
      name: form.name,
      type: form.type as Campaign["type"],
      status: "Scheduled",
      region: form.region,
      startDate: form.startDate,
      endDate: form.endDate,
      description: form.description,
      stations: parseInt(form.stations) || 0,
      assignedTeam: form.assignedTeam,
      lead: form.lead,
      progress: 0,
      samplesCollected: 0,
      samplesTarget: parseInt(form.samplesTarget) || 0,
    };
    addItem(nc);
    setForm({ name: "", type: "air", region: "", startDate: "", endDate: "", description: "", stations: "", assignedTeam: "", lead: "", samplesTarget: "" });
    setShowForm(false);
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Special Monitoring Campaigns</h1>
          <p className="text-sm text-muted">Plan, track and manage focused environmental monitoring campaigns</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white">
          <Plus size={14} /> New Campaign
        </button>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-2xl font-bold text-white">{campaigns.length}</p>
          <p className="text-xs text-muted">Total Campaigns</p>
        </div>
        <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-4">
          <p className="text-2xl font-bold text-green-400">{active}</p>
          <p className="text-xs text-muted">Active Now</p>
        </div>
        <div className="rounded-xl border border-gray-500/20 bg-gray-500/5 p-4">
          <p className="text-2xl font-bold text-gray-400">{completed}</p>
          <p className="text-xs text-muted">Completed</p>
        </div>
        <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
          <p className="text-2xl font-bold text-blue-400">{totalSamples.toLocaleString()}</p>
          <p className="text-xs text-muted">Samples Collected</p>
        </div>
      </div>

      {/* Create campaign form */}
      {showForm && (
        <div className="mb-6 rounded-xl border border-border bg-card p-5">
          <h3 className="mb-4 text-sm font-semibold text-white">Create New Campaign</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <input type="text" placeholder="Campaign Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-white placeholder:text-muted focus:border-primary focus:outline-none" />
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-white focus:border-primary focus:outline-none">
              <option value="air">Air Quality</option>
              <option value="water">Water Quality</option>
              <option value="noise">Noise Level</option>
              <option value="multi">Multi-Parameter</option>
            </select>
            <input type="text" placeholder="Region" value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-white placeholder:text-muted focus:border-primary focus:outline-none" />
            <input type="date" placeholder="Start Date *" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-white focus:border-primary focus:outline-none" />
            <input type="date" placeholder="End Date *" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-white focus:border-primary focus:outline-none" />
            <input type="number" placeholder="# of Stations" value={form.stations} onChange={(e) => setForm({ ...form, stations: e.target.value })} className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-white placeholder:text-muted focus:border-primary focus:outline-none" />
            <input type="text" placeholder="Assigned Team" value={form.assignedTeam} onChange={(e) => setForm({ ...form, assignedTeam: e.target.value })} className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-white placeholder:text-muted focus:border-primary focus:outline-none" />
            <input type="text" placeholder="Campaign Lead" value={form.lead} onChange={(e) => setForm({ ...form, lead: e.target.value })} className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-white placeholder:text-muted focus:border-primary focus:outline-none" />
            <input type="number" placeholder="Samples Target" value={form.samplesTarget} onChange={(e) => setForm({ ...form, samplesTarget: e.target.value })} className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-white placeholder:text-muted focus:border-primary focus:outline-none" />
            <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-white placeholder:text-muted focus:border-primary focus:outline-none sm:col-span-2 lg:col-span-3" rows={2} />
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={handleAdd} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white">Create</button>
            <button onClick={() => setShowForm(false)} className="rounded-lg bg-card px-4 py-2 text-sm text-muted hover:text-white">Cancel</button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={14} />
          <input type="text" placeholder="Search campaigns..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full rounded-lg border border-border bg-card py-2 pl-9 pr-3 text-sm text-white placeholder:text-muted focus:border-primary focus:outline-none" />
        </div>
        <div className="flex gap-1">
          {["all", "Active", "Scheduled", "Completed", "Paused"].map((s) => (
            <button key={s} onClick={() => setFilterStatus(s)} className={`rounded-lg px-3 py-1.5 text-xs font-medium ${filterStatus === s ? "bg-white/10 text-white" : "text-muted hover:text-white"}`}>
              {s === "all" ? "All" : s}
            </button>
          ))}
        </div>
      </div>

      {/* Campaign cards */}
      <div className="grid gap-4 lg:grid-cols-2">
        {filtered.map((c) => (
          <div key={c.id} onClick={() => setSelected(selected?.id === c.id ? null : c)} className={`cursor-pointer rounded-xl border transition-colors ${selected?.id === c.id ? "border-primary bg-card" : "border-border bg-card hover:border-border/80"} p-5`}>
            <div className="mb-3 flex items-start justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">{c.name}</h3>
                <div className="mt-1 flex items-center gap-2 text-[10px] text-muted">
                  <MapPin size={10} /> {c.region}
                  <span>·</span>
                  <Calendar size={10} /> {c.startDate} → {c.endDate}
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${typeColor[c.type]}`}>{typeLabel[c.type]}</span>
                <span className={`flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-bold ${statusColor[c.status]}`}>{statusIcon[c.status]} {c.status}</span>
              </div>
            </div>

            <p className="mb-3 text-xs leading-relaxed text-muted">{c.description}</p>

            {/* Progress bar */}
            <div className="mb-2">
              <div className="flex items-center justify-between text-[10px] text-muted">
                <span>{c.samplesCollected} / {c.samplesTarget} samples</span>
                <span>{c.progress}%</span>
              </div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${c.progress}%` }} />
              </div>
            </div>

            <div className="flex items-center gap-3 text-[10px] text-muted">
              <span className="flex items-center gap-1"><MapPin size={10} /> {c.stations} stations</span>
              <span className="flex items-center gap-1"><Users size={10} /> {c.assignedTeam}</span>
              <span>Lead: {c.lead}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
