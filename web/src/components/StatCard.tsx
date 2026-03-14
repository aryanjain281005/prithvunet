"use client";

import { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  trend?: { value: number; label: string };
  color?: "green" | "red" | "yellow" | "blue" | "purple";
}

const colorMap = {
  green: "bg-emerald-500/10 text-emerald-400",
  red: "bg-red-500/10 text-red-400",
  yellow: "bg-amber-500/10 text-amber-400",
  blue: "bg-blue-500/10 text-blue-400",
  purple: "bg-purple-500/10 text-purple-400",
};

export default function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  color = "blue",
}: StatCardProps) {
  return (
    <div className="glass glass-hover rounded-2xl p-5 transition-all duration-200">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[13px] text-zinc-500">{title}</p>
          <p className="mt-1.5 text-[28px] font-semibold leading-none text-white">{value}</p>
          {subtitle && <p className="mt-1.5 text-xs text-zinc-500">{subtitle}</p>}
          {trend && (
            <p
              className={`mt-2 text-xs font-medium ${
                trend.value >= 0 ? "text-red-400" : "text-emerald-400"
              }`}
            >
              {trend.value >= 0 ? "↑" : "↓"} {Math.abs(trend.value)}%{" "}
              <span className="text-zinc-500">{trend.label}</span>
            </p>
          )}
        </div>
        <div className={`rounded-xl p-2.5 ${colorMap[color]}`}>{icon}</div>
      </div>
    </div>
  );
}
