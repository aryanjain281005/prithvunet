"use client";

import { useState } from "react";
import { MapPin, Plus, Search, Trash2, Wind, Droplets, Volume2, Radio } from "lucide-react";
import { useSupabaseCRUD } from "@/lib/useSupabaseCRUD";

interface MonitoringLocation {
  id: string;
  name: string;
  type: "air" | "water" | "noise";
  lat: number;
  lng: number;
  city: string;
  state: string;
  region: string;
  status: "Live" | "Delay" | "Offline";
  installDate: string;
  lastMaintenance: string;
  equipment: string;
}

const INITIAL_LOCATIONS: MonitoringLocation[] = [
  { id: "ML01", name: "Anand Vihar CAAQMS", type: "air", lat: 28.65, lng: 77.32, city: "Delhi", state: "Delhi", region: "DPCC-DEL", status: "Live", installDate: "2019-03-15", lastMaintenance: "2025-12-01", equipment: "BAM 1020 + Gaseous Analyzers" },
  { id: "ML02", name: "ITO Junction CAAQMS", type: "air", lat: 28.63, lng: 77.24, city: "Delhi", state: "Delhi", region: "DPCC-DEL", status: "Live", installDate: "2018-11-20", lastMaintenance: "2025-11-15", equipment: "Envea AQMS Station" },
  { id: "ML03", name: "Bandra CAAQMS", type: "air", lat: 19.06, lng: 72.83, city: "Mumbai", state: "Maharashtra", region: "MPCB-MUM", status: "Live", installDate: "2020-05-10", lastMaintenance: "2025-10-20", equipment: "Thermo Fisher 5030" },
  { id: "ML04", name: "Ganga at Varanasi RTWQMS", type: "water", lat: 25.32, lng: 83.01, city: "Varanasi", state: "Uttar Pradesh", region: "UPPCB-LKO", status: "Live", installDate: "2020-01-10", lastMaintenance: "2025-11-01", equipment: "Online Water Analyzer" },
  { id: "ML05", name: "Yamuna at Okhla RTWQMS", type: "water", lat: 28.57, lng: 77.27, city: "Delhi", state: "Delhi", region: "DPCC-DEL", status: "Delay", installDate: "2019-06-20", lastMaintenance: "2025-09-15", equipment: "Multi-parameter Sonde" },
  { id: "ML06", name: "Peenya Industrial NMS", type: "noise", lat: 13.03, lng: 77.49, city: "Bengaluru", state: "Karnataka", region: "KSPCB-BLR", status: "Live", installDate: "2021-02-01", lastMaintenance: "2025-11-30", equipment: "Larson Davis SLM" },
  { id: "ML07", name: "Sabarmati RTWQMS", type: "water", lat: 23.03, lng: 72.58, city: "Ahmedabad", state: "Gujarat", region: "GPCB-AHM", status: "Live", installDate: "2020-08-15", lastMaintenance: "2025-10-10", equipment: "YSI EXO2" },
  { id: "ML08", name: "BTM Layout CAAQMS", type: "air", lat: 12.92, lng: 77.61, city: "Bengaluru", state: "Karnataka", region: "KSPCB-BLR", status: "Live", installDate: "2019-09-01", lastMaintenance: "2025-12-10", equipment: "APM 460 DRHV Sampler" },
  { id: "ML09", name: "Dadar Station NMS", type: "noise", lat: 19.02, lng: 72.84, city: "Mumbai", state: "Maharashtra", region: "MPCB-MUM", status: "Live", installDate: "2021-04-15", lastMaintenance: "2025-11-05", equipment: "CESVA TA120" },
  { id: "ML10", name: "Hooghly at Kolkata RTWQMS", type: "water", lat: 22.57, lng: 88.35, city: "Kolkata", state: "West Bengal", region: "WBPCB-KOL", status: "Offline", installDate: "2020-03-20", lastMaintenance: "2025-08-20", equipment: "Hydrolab HL4" },
];

const typeConfig = {
  air: { icon: Wind, color: "text-yellow-400", bg: "bg-yellow-500/15", label: "Air Quality" },
  water: { icon: Droplets, color: "text-blue-400", bg: "bg-blue-500/15", label: "Water Quality" },
  noise: { icon: Volume2, color: "text-purple-400", bg: "bg-purple-500/15", label: "Noise Level" },
};

const statusStyle = {
  Live: "bg-green-500/20 text-green-400",
  Delay: "bg-yellow-500/20 text-yellow-400",
  Offline: "bg-red-500/20 text-red-400",
};

export default function LocationsPage() {
  const { data: locations, addItem, deleteItem } = useSupabaseCRUD<MonitoringLocation>("monitoring_locations", INITIAL_LOCATIONS);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"all" | "air" | "water" | "noise">("all");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<{ name: string; type: "air" | "water" | "noise"; lat: string; lng: string; city: string; state: string; region: string; equipment: string }>({ name: "", type: "air", lat: "", lng: "", city: "", state: "", region: "", equipment: "" });

  const filtered = locations.filter((l) => {
    if (filterType !== "all" && l.type !== filterType) return false;
    return l.name.toLowerCase().includes(search.toLowerCase()) || l.city.toLowerCase().includes(search.toLowerCase());
  });

  const handleAdd = () => {
    if (!form.name || !form.city) return;
    const newLoc: MonitoringLocation = {
      id: `ML${String(locations.length + 1).padStart(2, "0")}`,
      name: form.name,
      type: form.type,
      lat: parseFloat(form.lat) || 0,
      lng: parseFloat(form.lng) || 0,
      city: form.city,
      state: form.state,
      region: form.region,
      status: "Live",
      installDate: new Date().toISOString().split("T")[0],
      lastMaintenance: new Date().toISOString().split("T")[0],
      equipment: form.equipment,
    };
    addItem(newLoc);
    setShowAdd(false);
    setForm({ name: "", type: "air", lat: "", lng: "", city: "", state: "", region: "", equipment: "" });
  };

  const liveCount = locations.filter((l) => l.status === "Live").length;
  const airCount = locations.filter((l) => l.type === "air").length;
  const waterCount = locations.filter((l) => l.type === "water").length;
  const noiseCount = locations.filter((l) => l.type === "noise").length;

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Monitoring Locations</h1>
          <p className="text-sm text-muted">Geo-tagged monitoring stations across India</p>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark">
          <Plus size={16} /> Add Location
        </button>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
          <Radio className="text-green-400" size={18} />
          <div>
            <p className="text-xl font-bold text-white">{liveCount}/{locations.length}</p>
            <p className="text-[10px] text-muted">Live Stations</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4">
          <Wind className="text-yellow-400" size={18} />
          <div>
            <p className="text-xl font-bold text-yellow-400">{airCount}</p>
            <p className="text-[10px] text-muted">Air Stations</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
          <Droplets className="text-blue-400" size={18} />
          <div>
            <p className="text-xl font-bold text-blue-400">{waterCount}</p>
            <p className="text-[10px] text-muted">Water Stations</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-purple-500/20 bg-purple-500/5 p-4">
          <Volume2 className="text-purple-400" size={18} />
          <div>
            <p className="text-xl font-bold text-purple-400">{noiseCount}</p>
            <p className="text-[10px] text-muted">Noise Stations</p>
          </div>
        </div>
      </div>

      {/* Add Form */}
      {showAdd && (
        <div className="mb-6 rounded-xl border border-primary/30 bg-primary/5 p-5">
          <h3 className="mb-4 text-sm font-semibold text-white">Add New Monitoring Location</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <input placeholder="Station Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-white placeholder:text-muted focus:border-primary focus:outline-none" />
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as "air" | "water" | "noise" })} className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-white focus:border-primary focus:outline-none">
              <option value="air">Air Quality</option>
              <option value="water">Water Quality</option>
              <option value="noise">Noise Level</option>
            </select>
            <input placeholder="Latitude" value={form.lat} onChange={(e) => setForm({ ...form, lat: e.target.value })} className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-white placeholder:text-muted focus:border-primary focus:outline-none" />
            <input placeholder="Longitude" value={form.lng} onChange={(e) => setForm({ ...form, lng: e.target.value })} className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-white placeholder:text-muted focus:border-primary focus:outline-none" />
            <input placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-white placeholder:text-muted focus:border-primary focus:outline-none" />
            <input placeholder="State" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-white placeholder:text-muted focus:border-primary focus:outline-none" />
            <input placeholder="Regional Office Code" value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-white placeholder:text-muted focus:border-primary focus:outline-none" />
            <input placeholder="Equipment" value={form.equipment} onChange={(e) => setForm({ ...form, equipment: e.target.value })} className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-white placeholder:text-muted focus:border-primary focus:outline-none" />
          </div>
          <div className="mt-3 flex gap-2">
            <button onClick={handleAdd} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark">Save</button>
            <button onClick={() => setShowAdd(false)} className="rounded-lg bg-card px-4 py-2 text-sm text-muted hover:text-white">Cancel</button>
          </div>
        </div>
      )}

      {/* Filters + Search */}
      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={14} />
          <input type="text" placeholder="Search location, city..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full rounded-lg border border-border bg-card py-2 pl-9 pr-3 text-sm text-white placeholder:text-muted focus:border-primary focus:outline-none" />
        </div>
        {(["all", "air", "water", "noise"] as const).map((t) => (
          <button key={t} onClick={() => setFilterType(t)} className={`rounded-lg px-3 py-2 text-xs font-medium transition-all ${filterType === t ? "bg-white/10 text-white" : "text-muted hover:text-white"}`}>
            {t === "all" ? "All Types" : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-card">
            <tr>
              <th className="px-4 py-3 text-xs font-medium text-muted">Station</th>
              <th className="px-4 py-3 text-xs font-medium text-muted">Type</th>
              <th className="px-4 py-3 text-xs font-medium text-muted">Location</th>
              <th className="px-4 py-3 text-xs font-medium text-muted">Coordinates</th>
              <th className="px-4 py-3 text-xs font-medium text-muted">Status</th>
              <th className="px-4 py-3 text-xs font-medium text-muted">Equipment</th>
              <th className="px-4 py-3 text-xs font-medium text-muted">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((loc) => {
              const cfg = typeConfig[loc.type];
              const Icon = cfg.icon;
              return (
                <tr key={loc.id} className="border-b border-border bg-background transition-colors hover:bg-card-hover">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className={`rounded-lg p-1.5 ${cfg.bg}`}><Icon size={14} className={cfg.color} /></div>
                      <span className="font-medium text-white">{loc.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3"><span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${cfg.bg} ${cfg.color}`}>{cfg.label}</span></td>
                  <td className="px-4 py-3 text-muted">{loc.city}, {loc.state}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted">{loc.lat.toFixed(2)}°N, {loc.lng.toFixed(2)}°E</td>
                  <td className="px-4 py-3"><span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${statusStyle[loc.status]}`}>{loc.status}</span></td>
                  <td className="px-4 py-3 text-xs text-muted">{loc.equipment}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => deleteItem(loc.id)} className="rounded p-1.5 text-muted hover:bg-red-500/10 hover:text-red-400">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
