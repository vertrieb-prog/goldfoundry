"use client";

import { useMemo } from "react";

interface MiniChartProps {
  data: number[];
  color: string;
  width?: number;
  height?: number;
  className?: string;
  showGradient?: boolean;
}

export function MiniChart({
  data,
  color,
  width = 200,
  height = 50,
  className = "",
  showGradient = true,
}: MiniChartProps) {
  const { path, area, gradientId } = useMemo(() => {
    if (data.length < 2) return { path: "", area: "", gradientId: "" };

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const padding = 2;

    const points = data.map((v, i) => ({
      x: (i / (data.length - 1)) * width,
      y: height - padding - ((v - min) / range) * (height - padding * 2),
    }));

    const linePath = points
      .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
      .join(" ");

    const areaPath = `${linePath} L ${width} ${height} L 0 ${height} Z`;
    const id = `gradient-${color.replace("#", "")}-${Math.random().toString(36).slice(2, 6)}`;

    return { path: linePath, area: areaPath, gradientId: id };
  }, [data, color, width, height]);

  if (data.length < 2) {
    return (
      <div
        className={`flex items-center justify-center text-xs opacity-40 ${className}`}
        style={{ width: "100%", height }}
      >
        Keine Daten
      </div>
    );
  }

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      style={{ width: "100%", height }}
    >
      {showGradient && (
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0.02} />
          </linearGradient>
        </defs>
      )}
      {showGradient && <path d={area} fill={`url(#${gradientId})`} />}
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
