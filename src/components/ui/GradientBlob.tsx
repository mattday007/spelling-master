"use client";

import { motion } from "framer-motion";

type BlobVariant = "home" | "spelling" | "pronunciation" | "progress" | "parent";

const BLOB_CONFIGS: Record<BlobVariant, { colors: string[]; positions: string[] }> = {
  home: {
    colors: ["#4F8CFF", "#D946EF", "#FF6B6B", "#FF8C42"],
    positions: ["20% 30%", "80% 20%", "60% 70%", "30% 80%"],
  },
  spelling: {
    colors: ["#6C5CE7", "#4F8CFF", "#00B894", "#D946EF"],
    positions: ["30% 25%", "70% 35%", "50% 75%", "20% 60%"],
  },
  pronunciation: {
    colors: ["#4F8CFF", "#D946EF", "#FF6B6B", "#6C5CE7"],
    positions: ["25% 30%", "75% 25%", "60% 70%", "35% 75%"],
  },
  progress: {
    colors: ["#00B894", "#4F8CFF", "#FDCB6E", "#00B894"],
    positions: ["30% 30%", "70% 25%", "50% 70%", "25% 65%"],
  },
  parent: {
    colors: ["#6C5CE7", "#4F8CFF", "#D946EF", "#00B894"],
    positions: ["25% 35%", "75% 30%", "55% 70%", "30% 70%"],
  },
};

export function GradientBlob({ variant = "home" }: { variant?: BlobVariant }) {
  const config = BLOB_CONFIGS[variant];

  const background = config.colors
    .map(
      (color, i) =>
        `radial-gradient(circle at ${config.positions[i]}, ${color}40 0%, transparent 50%)`
    )
    .join(", ");

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
      <motion.div
        className="absolute inset-[-20%] w-[140%] h-[140%]"
        style={{ background, filter: "blur(80px)" }}
        animate={{
          x: [0, 20, -10, 0],
          y: [0, -15, 10, 0],
          scale: [1, 1.03, 0.97, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <div className="grain-overlay" />
    </div>
  );
}
