"use client";

import { useState } from "react";
import { Building2, Plus, Search, Edit, Trash2, MapPin, Phone, Mail, Users, Factory } from "lucide-react";
import { useSupabaseCRUD } from "@/lib/useSupabaseCRUD";

interface RegionalOffice {
  id: string;
  name: string;
  code: string;
  state: string;
  district: string;
  address: string;
  phone: string;
  email: string;
  headOfficer: string;
  stations: number;
  industries: number;
  status: "Active" | "Inactive";
}

const INITIAL_OFFICES: RegionalOffice[] = [
  { id: "RO01", name: "Maharashtra PCB - Mumbai", code: "MPCB-MUM", state: "Maharashtra", district: "Mumbai", address: "Kalpataru Point, Sion, Mumbai 400022", phone: "+91 22 2401 0437", email: "mpcb.mumbai@gov.in", headOfficer: "Dr. S. K. Mehra", stations: 45, industries: 320, status: "Active" },
  { id: "RO02", name: "Delhi SPCB - ITO", code: "DPCC-DEL", state: "Delhi", district: "Central Delhi", address: "6th Floor, ISBT Building, Kashmere Gate", phone: "+91 11 2386 2804", email: "dpcc.delhi@gov.in", headOfficer: "Shri R. Gupta", stations: 38, industries: 190, status: "Active" },
  { id: "RO03", name: "KSPCB - Bengaluru", code: "KSPCB-BLR", state: "Karnataka", district: "Bengaluru Urban", address: "Parisara Bhavan, Church St", phone: "+91 80 2558 9112", email: "kspcb.blr@gov.in", headOfficer: "Dr. M. Nair", stations: 28, industries: 250, status: "Active" },
  { id: "RO04", name: "TNPCB - Chennai", code: "TNPCB-CHE", state: "Tamil Nadu", district: "Chennai", address: "76 Mount Salai, Guindy, Chennai", phone: "+91 44 2235 1003", email: "tnpcb.chennai@gov.in", headOfficer: "Smt. L. Raman", stations: 32, industries: 280, status: "Active" },
  { id: "RO05", name: "GPCB - Ahmedabad", code: "GPCB-AHM", state: "Gujarat", district: "Ahmedabad", address: "Paryavaran Bhavan, Gandhinagar", phone: "+91 79 2322 0583", email: "gpcb.ahm@gov.in", headOfficer: "Shri D. Patel", stations: 22, industries: 380, status: "Active" },
  { id: "RO06", name: "UPPCB - Lucknow", code: "UPPCB-LKO", state: "Uttar Pradesh", district: "Lucknow", address: "TC-12, Vibhuti Khand, Gomti Nagar", phone: "+91 522 272 0660", email: "uppcb.lko@gov.in", headOfficer: "Dr. A. Yadav", stations: 52, industries: 420, status: "Active" },
  { id: "RO07", name: "WBPCB - Kolkata", code: "WBPCB-KOL", state: "West Bengal", district: "Kolkata", address: "Paribesh Bhawan, Salt Lake, Kolkata", phone: "+91 33 2335 3656", email: "wbpcb.kol@gov.in", headOfficer: "Shri P. Das", stations: 25, industries: 210, status: "Active" },
  { id: "RO08", name: "RSPCB - Jaipur", code: "RPCB-JPR", state: "Rajasthan", district: "Jaipur", address: "4, Jhalana Institutional Area, Jaipur", phone: "+91 141 270 7039", email: "rpcb.jaipur@gov.in", headOfficer: "Smt. K. Sharma", stations: 18, industries: 160, status: "Active" },
];

export default function RegionsPage() {
  const { data: offices, loading: sbLoading, addItem, deleteItem } = useSupabaseCRUD<RegionalOffice>("regional_offices", INITIAL_OFFICES);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<RegionalOffice | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", code: "", state: "", district: "", address: "", phone: "", email: "", headOfficer: "" });

  const filtered = offices.filter(
    (o) =>
      o.name.toLowerCase().includes(search.toLowerCase()) ||
      o.state.toLowerCase().includes(search.toLowerCase()) ||
      o.code.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = () => {
    if (!form.name || !form.code) return;
    const newOffice: RegionalOffice = {
      id: `RO${String(offices.length + 1).padStart(2, "0")}`,
      ...form,
      stations: 0,
      industries: 0,
      status: "Active",
    };
    addItem(newOffice);
    setShowAdd(false);
    setForm({ name: "", code: "", state: "", district: "", address: "", phone: "", email: "", headOfficer: "" });
  };

  const handleDelete = (id: string) => {
    deleteItem(id);
    if (selected?.id === id) setSelected(null);
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Regional Offices</h1>
          <p className="text-sm text-muted">Manage State Pollution Control Board regional offices</p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
        >
          <Plus size={16} /> Add Regional Office
        </button>
      </div>

      {/* Add Form */}
      {showAdd && (
        <div className="mb-6 rounded-xl border border-primary/30 bg-primary/5 p-5">
          <h3 className="mb-4 text-sm font-semibold text-white">New Regional Office</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {(["name", "code", "state", "district", "address", "phone", "email", "headOfficer"] as const).map((field) => (
              <input
                key={field}
                type={field === "email" ? "email" : "text"}
                placeholder={field.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase())}
                value={form[field]}
                onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-white placeholder:text-muted focus:border-primary focus:outline-none"
              />
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <button onClick={handleAdd} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark">Save</button>
            <button onClick={() => setShowAdd(false)} className="rounded-lg bg-card px-4 py-2 text-sm text-muted hover:text-white">Cancel</button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={14} />
        <input
          type="text"
          placeholder="Search offices, state, code..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-border bg-card py-2 pl-9 pr-3 text-sm text-white placeholder:text-muted focus:border-primary focus:outline-none"
        />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          {filtered.map((office) => (
            <div
              key={office.id}
              onClick={() => setSelected(office)}
              className={`cursor-pointer rounded-xl border p-4 transition-all ${
                selected?.id === office.id ? "border-primary/50 bg-primary/5" : "border-border bg-card hover:bg-card-hover"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/15">
                    <Building2 className="text-blue-400" size={18} />
                  </div>
                  <div>
                    <p className="font-medium text-white">{office.name}</p>
                    <p className="text-xs text-muted">{office.code} • {office.district}, {office.state}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(office.id); }} className="rounded p-1.5 text-muted hover:bg-red-500/10 hover:text-red-400">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div className="mt-3 flex gap-4 text-xs text-muted">
                <span className="flex items-center gap-1"><MapPin size={11} />{office.stations} stations</span>
                <span className="flex items-center gap-1"><Factory size={11} />{office.industries} industries</span>
                <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${office.status === "Active" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                  {office.status}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Detail Panel */}
        <div className="rounded-xl border border-border bg-card p-5">
          {selected ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/15">
                  <Building2 className="text-blue-400" size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-white">{selected.name}</h3>
                  <p className="text-xs text-muted">{selected.code}</p>
                </div>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <MapPin size={14} className="mt-0.5 text-muted" />
                  <span className="text-muted">{selected.address}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone size={14} className="text-muted" />
                  <span className="text-muted">{selected.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail size={14} className="text-muted" />
                  <span className="text-muted">{selected.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users size={14} className="text-muted" />
                  <span className="text-muted">Head: {selected.headOfficer}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-background p-3 text-center">
                  <p className="text-lg font-bold text-white">{selected.stations}</p>
                  <p className="text-[10px] text-muted">Stations</p>
                </div>
                <div className="rounded-lg bg-background p-3 text-center">
                  <p className="text-lg font-bold text-white">{selected.industries}</p>
                  <p className="text-[10px] text-muted">Industries</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center py-12 text-center">
              <Building2 className="mb-3 text-muted" size={40} />
              <p className="text-sm text-muted">Select an office to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
