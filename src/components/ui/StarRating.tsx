"use client";

import { motion } from "framer-motion";

interface StarRatingProps {
  score: number; // 0-3
  size?: number;
}

export function StarRating({ score, size = 40 }: StarRatingProps) {
  const totalStars = 3;

  return (
    <div className="flex gap-2 justify-center">
      {Array.from({ length: totalStars }).map((_, i) => (
        <motion.span
          key={i}
          initial={{ scale: 0, rotate: -180 }}
          animate={{
            scale: i < score ? 1 : 0.6,
            rotate: 0,
            opacity: i < score ? 1 : 0.3,
          }}
          transition={{
            delay: i * 0.15,
            type: "spring",
            stiffness: 300,
            damping: 15,
          }}
          style={{ fontSize: size }}
          className="inline-block"
        >
          {i < score ? "\u2B50" : "\u2606"}
        </motion.span>
      ))}
    </div>
  );
}
