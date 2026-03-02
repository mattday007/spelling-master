"use client";

import { motion } from "framer-motion";

interface ProgressBarProps {
  value: number; // 0-100
  color?: string;
  label?: string;
}

export function ProgressBar({ value, color = "var(--color-green)", label }: ProgressBarProps) {
  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between mb-1">
          <span className="text-sm font-semibold text-foreground">{label}</span>
          <span className="text-sm font-bold text-muted">{Math.round(value)}%</span>
        </div>
      )}
      <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, Math.max(0, value))}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}
