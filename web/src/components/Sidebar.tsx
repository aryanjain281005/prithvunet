"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Map,
  Bell,
  Droplets,
  Factory,
  BarChart3,
  Bot,
  Users,
  Leaf,
  Menu,
  X,
  Building2,
  MapPin,
  Ruler,
  Shield,
  UserCog,
  ClipboardList,
  FileText,
  Siren,
  ChevronRight,
  LogOut,
  Volume2,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import type { UserRole } from "@/lib/types";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  roles: UserRole[];
  badge?: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
  collapsible?: boolean;
}

const navGroups: NavGroup[] = [
  {
    label: "Main",
    items: [
      { name: "Dashboard", href: "/", icon: LayoutDashboard, roles: ["super_admin", "regional_officer", "monitoring_team", "industry_user"] },
      { name: "Pollution Map", href: "/map", icon: Map, roles: ["super_admin", "regional_officer", "monitoring_team", "citizen"] },
      { name: "Alerts", href: "/alerts", icon: Bell, roles: ["super_admin", "regional_officer", "monitoring_team", "industry_user"] },
    ],
  },
  {
    label: "Monitoring",
    collapsible: true,
    items: [
      { name: "Submit Data", href: "/monitoring/submit", icon: ClipboardList, roles: ["industry_user"] },
      { name: "Logs", href: "/monitoring/logs", icon: FileText, roles: ["super_admin", "regional_officer", "monitoring_team"] },
      { name: "Campaigns", href: "/monitoring/campaigns", icon: Siren, roles: ["super_admin", "regional_officer", "monitoring_team"] },
    ],
  },
  {
    label: "Compliance",
    collapsible: true,
    items: [
      { name: "Cases", href: "/compliance", icon: Shield, roles: ["super_admin", "regional_officer"] },
      { name: "Industries", href: "/industries", icon: Factory, roles: ["super_admin", "regional_officer", "industry_user"] },
    ],
  },
  {
    label: "Water",
    collapsible: true,
    items: [
      { name: "Water Monitor", href: "/water", icon: Droplets, roles: ["super_admin", "regional_officer", "monitoring_team"] },
    ],
  },
    {
      label: "Noise",
      collapsible: true,
      items: [
        { name: "Noise Monitor", href: "/noise", icon: Volume2, roles: ["super_admin", "regional_officer", "monitoring_team", "citizen"] },
      ],
    },
  {
    label: "Analytics",
    collapsible: true,
    items: [
      { name: "Reports", href: "/reports", icon: BarChart3, roles: ["super_admin", "regional_officer", "monitoring_team"] },
      { name: "AI Copilot", href: "/copilot", icon: Bot, roles: ["super_admin", "regional_officer"] },
    ],
  },
  {
    label: "Admin",
    collapsible: true,
    items: [
      { name: "Regions", href: "/admin/regions", icon: Building2, roles: ["super_admin"] },
      { name: "Locations", href: "/admin/locations", icon: MapPin, roles: ["super_admin", "regional_officer"] },
      { name: "Limits", href: "/admin/limits", icon: Ruler, roles: ["super_admin"] },
      { name: "Users", href: "/admin/users", icon: UserCog, roles: ["super_admin", "regional_officer"] },
      { name: "Complaint Triage", href: "/admin/complaints", icon: ClipboardList, roles: ["super_admin", "regional_officer"] },
      { name: "Copilot Logs", href: "/admin/copilot-logs", icon: Bot, roles: ["super_admin", "regional_officer"] },
    ],
  },
  {
    label: "Public",
    items: [
      { name: "Citizen Portal", href: "/citizen", icon: Users, roles: ["super_admin", "regional_officer", "monitoring_team", "industry_user"] },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const { user, role, roleLabel, roleColor, logout, loadingAuth } = useAuth();

  if (pathname === "/login") return null;
  if (loadingAuth) return null;
  if (!role) return null;
  if (pathname === "/citizen" && role === "citizen") return null;

  const visibleGroups = navGroups
    .map((g) => ({ ...g, items: g.items.filter((item) => item.roles.includes(role)) }))
    .filter((g) => g.items.length > 0);

  // Auto-expand groups that contain the active page
  const isGroupActive = (group: NavGroup) => group.items.some((item) => pathname === item.href);
  const isCollapsed = (label: string, group: NavGroup) =>
    group.collapsible && collapsed[label] !== undefined ? collapsed[label] : group.collapsible && !isGroupActive(group);

  const toggleGroup = (label: string) => setCollapsed((prev) => ({ ...prev, [label]: !prev[label] }));

  const handleLogout = async () => {
    await logout();
    router.push("/login");
    router.refresh();
  };

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed top-5 left-5 z-50 flex h-10 w-10 items-center justify-center rounded-xl glass lg:hidden"
      >
        {mobileOpen ? <X size={18} /> : <Menu size={18} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 flex h-full w-[260px] flex-col bg-[#09090b] transition-transform duration-300 lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-500/20">
            <Leaf className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-[15px] font-semibold tracking-tight text-white">PrithviNet</h1>
            <p className="text-[11px] text-zinc-500">Environmental Intelligence</p>
          </div>
        </div>

        {/* Divider */}
        <div className="mx-5 h-px bg-white/5" />

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {visibleGroups.map((group, gi) => {
            const groupCollapsed = isCollapsed(group.label, group);
            return (
              <div key={group.label} className={gi > 0 ? "mt-5" : ""}>
                {group.collapsible ? (
                  <button
                    onClick={() => toggleGroup(group.label)}
                    className="mb-1 flex w-full items-center justify-between px-3 text-[11px] font-medium uppercase tracking-widest text-zinc-500 transition-colors hover:text-zinc-400"
                  >
                    {group.label}
                    <ChevronRight
                      size={12}
                      className={`transition-transform duration-200 ${groupCollapsed ? "" : "rotate-90"}`}
                    />
                  </button>
                ) : (
                  <p className="mb-1 px-3 text-[11px] font-medium uppercase tracking-widest text-zinc-500">
                    {group.label}
                  </p>
                )}
                {!groupCollapsed && (
                  <div className="mt-1 space-y-0.5">
                    {group.items.map((item) => {
                      const isActive = pathname === item.href;
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMobileOpen(false)}
                          className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] transition-all duration-150 ${
                            isActive
                              ? "bg-white/[0.08] font-medium text-white"
                              : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200"
                          }`}
                        >
                          <Icon size={16} className={isActive ? "text-emerald-400" : "text-zinc-500 group-hover:text-zinc-400"} />
                          {item.name}
                          {isActive && (
                            <span className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-400" />
                          )}
                          {item.badge && (
                            <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500/20 px-1 text-[10px] font-bold text-red-400">
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="mx-3 mb-3 space-y-2">
          {/* Divider */}
          <div className="h-px bg-white/5" />

          <div className="rounded-lg px-3 py-2 text-xs">
            <span className="text-[11px] text-zinc-500">Role:</span>
            <div className="mt-1">
              <span className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${roleColor}`}>
                {roleLabel}
              </span>
            </div>
          </div>

          {/* User info */}
          <div className="flex items-center gap-3 rounded-lg px-3 py-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500/20 to-indigo-500/20 text-xs font-semibold text-blue-400">
              {user?.avatar || "U"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium text-zinc-200">{user?.name || "Guest"}</p>
              <p className="truncate text-[11px] text-zinc-500">{user?.region || ""}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-zinc-300 transition-colors hover:bg-white/[0.05]"
          >
            <LogOut size={13} /> Sign out
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
    </>
  );
}
