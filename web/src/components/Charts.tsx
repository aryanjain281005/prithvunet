"use client";

import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { TimeSeriesData, ForecastPoint } from "@/lib/types";

interface PollutionChartProps {
  data: TimeSeriesData[];
  title: string;
  color?: string;
  unit?: string;
  limit?: number;
  type?: "line" | "area" | "bar";
  height?: number;
}

export function PollutionChart({
  data,
  title,
  color = "#22c55e",
  unit = "µg/m³",
  limit,
  type = "area",
  height = 250,
}: PollutionChartProps) {
  const chartData = data.map((d) => ({
    name: d.label || new Date(d.timestamp).getHours() + ":00",
    value: d.value,
    limit: limit,
  }));

  const tooltipStyle = {
    backgroundColor: "rgba(15, 15, 18, 0.95)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "12px",
    fontSize: "12px",
    backdropFilter: "blur(12px)",
    boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
  };
  const gridStroke = "rgba(255,255,255,0.04)";
  const axisStroke = "#52525b";

  return (
    <div className="glass rounded-2xl p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        <span className="rounded-full bg-white/5 px-2.5 py-0.5 text-[11px] text-zinc-500">{unit}</span>
      </div>
      <ResponsiveContainer width="100%" height={height}>
        {type === "bar" ? (
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
            <XAxis dataKey="name" stroke={axisStroke} fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke={axisStroke} fontSize={11} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
            <Bar dataKey="value" fill={color} radius={[6, 6, 0, 0]} />
            {limit && (
              <Line type="monotone" dataKey="limit" stroke="#ef4444" strokeDasharray="5 5" dot={false} />
            )}
          </BarChart>
        ) : type === "line" ? (
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
            <XAxis dataKey="name" stroke={axisStroke} fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke={axisStroke} fontSize={11} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} />
            {limit && (
              <Line type="monotone" dataKey="limit" stroke="#ef4444" strokeDasharray="5 5" dot={false} />
            )}
          </LineChart>
        ) : (
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id={`grad-${title}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.2} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
            <XAxis dataKey="name" stroke={axisStroke} fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke={axisStroke} fontSize={11} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2} fill={`url(#grad-${title})`} />
            {limit && (
              <Line type="monotone" dataKey="limit" stroke="#ef4444" strokeDasharray="5 5" dot={false} />
            )}
          </AreaChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

// Forecast chart with confidence bands
interface ForecastChartProps {
  data: ForecastPoint[];
  title: string;
  unit?: string;
  color?: string;
  height?: number;
}

export function ForecastChart({
  data,
  title,
  unit = "µg/m³",
  color = "#3b82f6",
  height = 280,
}: ForecastChartProps) {
  const chartData = data.map((d) => ({
    name: new Date(d.timestamp).toLocaleString("en-IN", {
      day: "2-digit",
      hour: "2-digit",
      hour12: false,
    }),
    value: d.value,
    lower: d.lower,
    upper: d.upper,
    range: [d.lower, d.upper],
  }));

  const tooltipStyle = {
    backgroundColor: "rgba(15, 15, 18, 0.95)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "12px",
    fontSize: "12px",
    backdropFilter: "blur(12px)",
    boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
  };

  return (
    <div className="glass rounded-2xl p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white">{title}</h3>
          <p className="text-xs text-zinc-500">72-hour prediction with confidence bands</p>
        </div>
        <span className="rounded-full bg-white/5 px-2.5 py-0.5 text-[11px] text-zinc-500">{unit}</span>
      </div>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.15} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="confidenceGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.08} />
              <stop offset="95%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
          <XAxis dataKey="name" stroke="#52525b" fontSize={11} interval={11} tickLine={false} axisLine={false} />
          <YAxis stroke="#52525b" fontSize={11} tickLine={false} axisLine={false} />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend />
          <Area type="monotone" dataKey="upper" stroke="transparent" fill="url(#confidenceGrad)" name="Upper Bound" />
          <Area type="monotone" dataKey="lower" stroke="transparent" fill="transparent" name="Lower Bound" />
          <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} name="Forecast" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
