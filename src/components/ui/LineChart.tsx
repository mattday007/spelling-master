"use client";

import { motion } from "framer-motion";
import { useRef, useState, useEffect } from "react";

interface DataPoint {
  date: string;
  value: number;
}

interface Series {
  label: string;
  color: string;
  data: DataPoint[];
}

interface LineChartProps {
  series: Series[];
  height?: number;
}

const PADDING = { top: 20, right: 16, bottom: 32, left: 36 };

export function LineChart({ series, height = 200 }: LineChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      setWidth(entries[0].contentRect.width);
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Collect all dates and values for axis computation
  const allDates = Array.from(
    new Set(series.flatMap((s) => s.data.map((d) => d.date)))
  ).sort();
  const allValues = series.flatMap((s) => s.data.map((d) => d.value));
  const maxValue = Math.max(...allValues, 1);
  const minValue = 0;

  const chartW = width - PADDING.left - PADDING.right;
  const chartH = height - PADDING.top - PADDING.bottom;

  if (allDates.length === 0 || width === 0) {
    return (
      <div ref={containerRef} className="w-full" style={{ height }}>
        <p className="text-sm text-muted text-center pt-8">No data yet</p>
      </div>
    );
  }

  function x(i: number) {
    if (allDates.length === 1) return PADDING.left + chartW / 2;
    return PADDING.left + (i / (allDates.length - 1)) * chartW;
  }

  function y(val: number) {
    return PADDING.top + chartH - ((val - minValue) / (maxValue - minValue)) * chartH;
  }

  // Y-axis gridlines (4 lines)
  const gridCount = 4;
  const gridLines = Array.from({ length: gridCount + 1 }, (_, i) => {
    const val = minValue + ((maxValue - minValue) / gridCount) * i;
    return { val: Math.round(val), py: y(val) };
  });

  // X-axis labels — show up to ~6 evenly spaced dates
  const maxLabels = 6;
  const labelStep = Math.max(1, Math.floor(allDates.length / maxLabels));
  const xLabels = allDates.filter((_, i) => i % labelStep === 0 || i === allDates.length - 1);

  return (
    <div ref={containerRef} className="w-full">
      {width > 0 && (
        <>
          <svg width={width} height={height} className="overflow-visible">
            {/* Grid lines */}
            {gridLines.map((g) => (
              <g key={g.val}>
                <line
                  x1={PADDING.left}
                  y1={g.py}
                  x2={PADDING.left + chartW}
                  y2={g.py}
                  stroke="currentColor"
                  strokeOpacity={0.1}
                  strokeWidth={1}
                />
                <text
                  x={PADDING.left - 6}
                  y={g.py + 4}
                  textAnchor="end"
                  fontSize={10}
                  fill="currentColor"
                  fillOpacity={0.4}
                >
                  {g.val}
                </text>
              </g>
            ))}

            {/* X-axis labels */}
            {xLabels.map((date) => {
              const i = allDates.indexOf(date);
              const label = date.slice(5); // "MM-DD"
              return (
                <text
                  key={date}
                  x={x(i)}
                  y={height - 4}
                  textAnchor="middle"
                  fontSize={10}
                  fill="currentColor"
                  fillOpacity={0.4}
                >
                  {label}
                </text>
              );
            })}

            {/* Series lines and dots */}
            {series.map((s) => {
              const dateMap = new Map(s.data.map((d) => [d.date, d.value]));
              const points = allDates
                .map((date, i) => {
                  const val = dateMap.get(date);
                  return val != null ? { px: x(i), py: y(val), val } : null;
                })
                .filter(Boolean) as { px: number; py: number; val: number }[];

              if (points.length === 0) return null;

              const pathD = points
                .map((p, i) => `${i === 0 ? "M" : "L"} ${p.px} ${p.py}`)
                .join(" ");

              return (
                <g key={s.label}>
                  <motion.path
                    d={pathD}
                    fill="none"
                    stroke={s.color}
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                  {points.map((p, i) => (
                    <motion.circle
                      key={i}
                      cx={p.px}
                      cy={p.py}
                      r={3}
                      fill={s.color}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.5 + i * 0.05 }}
                    />
                  ))}
                </g>
              );
            })}
          </svg>

          {/* Legend */}
          <div className="flex gap-4 justify-center mt-2">
            {series.map((s) => (
              <div key={s.label} className="flex items-center gap-1.5 text-xs font-bold text-muted">
                <span
                  className="inline-block w-3 h-3 rounded-full"
                  style={{ backgroundColor: s.color }}
                />
                {s.label}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
