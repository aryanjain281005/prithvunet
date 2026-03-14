"use client";

import { useState } from "react";
import { UserCog, Plus, Search, Shield, Trash2, Mail, Phone, MapPin } from "lucide-react";
import type { UserRole } from "@/lib/types";
import { ROLE_LABELS, ROLE_COLORS } from "@/lib/rbac";
import { useSupabaseCRUD } from "@/lib/useSupabaseCRUD";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  region: string;
  team: string;
  status: "Active" | "Inactive";
  lastLogin: string;
}

const MANAGED_ROLES: UserRole[] = ["super_admin", "regional_officer", "monitoring_team", "industry_user", "citizen"];

const INITIAL_USERS: TeamMember[] = [
  { id: "U001", name: "Dr. Rajesh Kumar", email: "rajesh@spcb.gov.in", phone: "+91 98765 43210", role: "super_admin", region: "All India", team: "State HQ", status: "Active", lastLogin: "2026-03-10 09:30" },
  { id: "U002", name: "Priya Sharma", email: "priya@mpcb.gov.in", phone: "+91 98765 43211", role: "regional_officer", region: "Maharashtra", team: "MPCB Mumbai", status: "Active", lastLogin: "2026-03-10 08:15" },
  { id: "U003", name: "Arun Patel", email: "arun@gpcb.gov.in", phone: "+91 98765 43212", role: "monitoring_team", region: "Gujarat", team: "GPCB Field Team A", status: "Active", lastLogin: "2026-03-09 17:45" },
  { id: "U004", name: "Vikram Singh", email: "vikram@tatasteel.com", phone: "+91 98765 43213", role: "industry_user", region: "Jharkhand", team: "Tata Steel Works", status: "Active", lastLogin: "2026-03-10 10:00" },
  { id: "U005", name: "Meena Devi", email: "meena@spcb.gov.in", phone: "+91 98765 43214", role: "regional_officer", region: "Delhi", team: "DPCC Delhi", status: "Active", lastLogin: "2026-03-10 07:30" },
  { id: "U006", name: "Suresh Reddy", email: "suresh@tspcb.gov.in", phone: "+91 98765 43215", role: "monitoring_team", region: "Telangana", team: "TSPCB Hyderabad", status: "Active", lastLogin: "2026-03-09 16:20" },
  { id: "U007", name: "Kavita Joshi", email: "kavita@spcb.gov.in", phone: "+91 98765 43216", role: "monitoring_team", region: "Karnataka", team: "KSPCB Field Team B", status: "Active", lastLogin: "2026-03-10 06:45" },
  { id: "U008", name: "Rakesh Gupta", email: "rakesh@ambuja.com", phone: "+91 98765 43217", role: "industry_user", region: "Gujarat", team: "Ambuja Cements", status: "Active", lastLogin: "2026-03-09 15:00" },
  { id: "U009", name: "Anita Kumari", email: "anita@spcb.gov.in", phone: "+91 98765 43218", role: "regional_officer", region: "Uttar Pradesh", team: "UPPCB Lucknow", status: "Active", lastLogin: "2026-03-10 11:15" },
  { id: "U010", name: "Deepak Verma", email: "deepak@ntpc.com", phone: "+91 98765 43219", role: "industry_user", region: "Uttar Pradesh", team: "NTPC Dadri", status: "Inactive", lastLogin: "2026-02-28 14:30" },
  { id: "U011", name: "Rahul Nair", email: "rahul@spcb.gov.in", phone: "+91 98765 43220", role: "monitoring_team", region: "Kerala", team: "KSPCB Field Team C", status: "Active", lastLogin: "2026-03-10 08:00" },
  { id: "U012", name: "Sanjay Das", email: "sanjay@wbpcb.gov.in", phone: "+91 98765 43221", role: "regional_officer", region: "West Bengal", team: "WBPCB Kolkata", status: "Active", lastLogin: "2026-03-09 18:00" },
];

export default function UsersPage() {
  const { data: users, addItem, deleteItem } = useSupabaseCRUD<TeamMember>("users", INITIAL_USERS);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState<UserRole | "all">("all");
  const [showAdd, setShowAdd] = useState(false);
  const [selected, setSelected] = useState<TeamMember | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", role: "monitoring_team" as UserRole, region: "", team: "" });

  const filtered = users.filter((u) => {
    if (filterRole !== "all" && u.role !== filterRole) return false;
    return u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()) || u.team.toLowerCase().includes(search.toLowerCase());
  });

  const handleAdd = () => {
    if (!form.name || !form.email) return;
    const newUser: TeamMember = {
      id: `U${String(users.length + 1).padStart(3, "0")}`,
      ...form,
      status: "Active",
      lastLogin: "Never",
    };
    addItem(newUser);
    setShowAdd(false);
    setForm({ name: "", email: "", phone: "", role: "monitoring_team", region: "", team: "" });
  };

  const roleCount = (r: UserRole) => users.filter((u) => u.role === r).length;

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Users & Monitoring Teams</h1>
          <p className="text-sm text-muted">Manage user roles, permissions, and team assignments</p>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark">
          <Plus size={16} /> Add User
        </button>
      </div>

      {/* Role Stats */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {MANAGED_ROLES.map((r) => (
          <div key={r} className="rounded-xl border border-border bg-card p-3 text-center">
            <p className="text-xl font-bold text-white">{roleCount(r)}</p>
            <p className={`mt-0.5 rounded px-1.5 py-0.5 text-[10px] font-bold ${ROLE_COLORS[r]}`}>{ROLE_LABELS[r].split("(")[0].trim()}</p>
          </div>
        ))}
      </div>

      {/* Add Form */}
      {showAdd && (
        <div className="mb-6 rounded-xl border border-primary/30 bg-primary/5 p-5">
          <h3 className="mb-4 text-sm font-semibold text-white">Add New User</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <input placeholder="Full Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-white placeholder:text-muted focus:border-primary focus:outline-none" />
            <input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-white placeholder:text-muted focus:border-primary focus:outline-none" />
            <input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-white placeholder:text-muted focus:border-primary focus:outline-none" />
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })} className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-white focus:border-primary focus:outline-none">
              {MANAGED_ROLES.map((r) => (
                <option key={r} value={r}>{ROLE_LABELS[r]}</option>
              ))}
            </select>
            <input placeholder="Region" value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-white placeholder:text-muted focus:border-primary focus:outline-none" />
            <input placeholder="Team / Organization" value={form.team} onChange={(e) => setForm({ ...form, team: e.target.value })} className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-white placeholder:text-muted focus:border-primary focus:outline-none" />
          </div>
          <div className="mt-3 flex gap-2">
            <button onClick={handleAdd} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark">Save</button>
            <button onClick={() => setShowAdd(false)} className="rounded-lg bg-card px-4 py-2 text-sm text-muted hover:text-white">Cancel</button>
          </div>
        </div>
      )}

      {/* Search + Filter */}
      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={14} />
          <input type="text" placeholder="Search name, email, team..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full rounded-lg border border-border bg-card py-2 pl-9 pr-3 text-sm text-white placeholder:text-muted focus:border-primary focus:outline-none" />
        </div>
        <button onClick={() => setFilterRole("all")} className={`rounded-lg px-3 py-2 text-xs font-medium ${filterRole === "all" ? "bg-white/10 text-white" : "text-muted hover:text-white"}`}>All Roles</button>
        {MANAGED_ROLES.map((r) => (
          <button key={r} onClick={() => setFilterRole(r)} className={`rounded-lg px-3 py-2 text-xs font-medium ${filterRole === r ? "bg-white/10 text-white" : "text-muted hover:text-white"}`}>
            {ROLE_LABELS[r].split("(")[0].trim()}
          </button>
        ))}
      </div>

      {/* Users grid + detail */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-2 lg:col-span-2">
          {filtered.map((u) => (
            <div
              key={u.id}
              onClick={() => setSelected(u)}
              className={`cursor-pointer rounded-xl border p-4 transition-all ${selected?.id === u.id ? "border-primary/50 bg-primary/5" : "border-border bg-card hover:bg-card-hover"}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-info/20 text-xs font-bold text-info">
                    {u.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </div>
                  <div>
                    <p className="font-medium text-white">{u.name}</p>
                    <p className="text-xs text-muted">{u.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${ROLE_COLORS[u.role]}`}>{ROLE_LABELS[u.role].split("(")[0].trim()}</span>
                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${u.status === "Active" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>{u.status}</span>
                </div>
              </div>
              <div className="mt-2 flex gap-4 text-[11px] text-muted">
                <span>{u.team}</span>
                <span>•</span>
                <span>{u.region}</span>
                <span>•</span>
                <span>Last: {u.lastLogin}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Detail */}
        <div className="rounded-xl border border-border bg-card p-5">
          {selected ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-info/20 text-lg font-bold text-info">
                  {selected.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </div>
                <div>
                  <h3 className="font-bold text-white">{selected.name}</h3>
                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${ROLE_COLORS[selected.role]}`}>{ROLE_LABELS[selected.role]}</span>
                </div>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2"><Mail size={14} className="text-muted" /><span className="text-muted">{selected.email}</span></div>
                <div className="flex items-center gap-2"><Phone size={14} className="text-muted" /><span className="text-muted">{selected.phone}</span></div>
                <div className="flex items-center gap-2"><MapPin size={14} className="text-muted" /><span className="text-muted">{selected.region}</span></div>
                <div className="flex items-center gap-2"><Shield size={14} className="text-muted" /><span className="text-muted">{selected.team}</span></div>
              </div>
              <div className="rounded-lg bg-background p-3">
                <p className="text-xs text-muted">Last Login</p>
                <p className="text-sm font-medium text-white">{selected.lastLogin}</p>
              </div>
              <div className="flex gap-2">
                <button className="flex-1 rounded-lg bg-primary/20 py-2 text-xs font-medium text-primary hover:bg-primary/30">Edit</button>
                <button onClick={() => { deleteItem(selected.id); setSelected(null); }} className="flex-1 rounded-lg bg-red-500/20 py-2 text-xs font-medium text-red-400 hover:bg-red-500/30">Remove</button>
              </div>
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center py-12 text-center">
              <UserCog className="mb-3 text-muted" size={40} />
              <p className="text-sm text-muted">Select a user to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
