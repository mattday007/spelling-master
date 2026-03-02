"use client";

import { motion } from "framer-motion";
import type { Profile } from "@/types";
import { AVATARS } from "@/types";

interface ProfileSelectorProps {
  profiles: Profile[];
  onSelect: (profile: Profile) => void;
  onAddNew: () => void;
}

export function ProfileSelector({ profiles, onSelect, onAddNew }: ProfileSelectorProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 w-full max-w-lg">
      {profiles.map((profile, i) => {
        const avatar = AVATARS.find((a) => a.id === profile.avatarId) ?? AVATARS[0];
        return (
          <motion.button
            key={profile.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, type: "spring", stiffness: 200 }}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelect(profile)}
            className="flex flex-col items-center gap-3 p-4 no-select"
          >
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center text-5xl shadow-lg"
              style={{
                background: `linear-gradient(135deg, ${avatar.color}40, ${avatar.color}15)`,
                border: `3px solid ${avatar.color}`,
              }}
            >
              {avatar.emoji}
            </div>
            <span className="text-lg font-bold text-foreground">{profile.name}</span>
          </motion.button>
        );
      })}

      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: profiles.length * 0.1, type: "spring", stiffness: 200 }}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.95 }}
        onClick={onAddNew}
        className="flex flex-col items-center gap-3 p-4 no-select"
      >
        <div className="w-24 h-24 rounded-full flex items-center justify-center text-4xl border-3 border-dashed border-gray-300 text-gray-400 hover:border-blue hover:text-blue transition-colors">
          +
        </div>
        <span className="text-lg font-bold text-muted">Add Child</span>
      </motion.button>
    </div>
  );
}
