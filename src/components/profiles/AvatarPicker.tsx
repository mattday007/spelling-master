"use client";

import { motion } from "framer-motion";
import { AVATARS } from "@/types";

interface AvatarPickerProps {
  selected: number;
  onSelect: (id: number) => void;
}

export function AvatarPicker({ selected, onSelect }: AvatarPickerProps) {
  return (
    <div className="grid grid-cols-4 gap-4">
      {AVATARS.map((avatar) => (
        <motion.button
          key={avatar.id}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => onSelect(avatar.id)}
          className={`
            w-20 h-20 rounded-full flex items-center justify-center text-4xl
            no-select transition-all duration-200
            ${
              selected === avatar.id
                ? "ring-4 shadow-lg scale-110"
                : "ring-2 ring-gray-100 opacity-70 hover:opacity-100"
            }
          `}
          style={{
            background: `linear-gradient(135deg, ${avatar.color}30, ${avatar.color}10)`,
            ...(selected === avatar.id ? { boxShadow: `0 0 0 3px ${avatar.color}` } : {}),
          }}
        >
          {avatar.emoji}
        </motion.button>
      ))}
    </div>
  );
}
