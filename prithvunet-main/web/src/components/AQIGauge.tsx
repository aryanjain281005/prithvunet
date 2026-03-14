"use client";

import { getAQIColor, getAQICategory, getAQIEmoji } from "@/lib/api";

interface AQIGaugeProps {
  value: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  stationName?: string;
}

export default function AQIGauge({
  value,
  size = "md",
  showLabel = true,
  stationName,
}: AQIGaugeProps) {
  const color = getAQIColor(value);
  const category = getAQICategory(value);
  const emoji = getAQIEmoji(value);

  const sizeMap = {
    sm: { outer: "w-[72px]", text: "text-lg", label: "text-[10px]" },
    md: { outer: "w-24", text: "text-2xl", label: "text-[11px]" },
    lg: { outer: "w-32", text: "text-3xl", label: "text-xs" },
  };

  const s = sizeMap[size];

  return (
    <div className={`flex flex-col items-center gap-2 ${s.outer}`}>
      <div
        className="flex aspect-square w-full flex-col items-center justify-center rounded-2xl border transition-transform duration-200 hover:scale-105"
        style={{ borderColor: `${color}30`, backgroundColor: `${color}0a` }}
      >
        <span className={`${s.text} font-semibold`} style={{ color }}>
          {value}
        </span>
        <span className={`${s.label} mt-0.5 text-zinc-500`}>
          {category}
        </span>
      </div>
      {showLabel && stationName && (
        <p className="max-w-full truncate text-center text-[11px] text-zinc-500">
          {stationName}
        </p>
      )}
    </div>
  );
}
