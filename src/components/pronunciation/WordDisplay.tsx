"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { getSyllables } from "@/lib/syllables/syllabify";

const PILL_COLOURS = [
  "bg-blue text-white",
  "bg-pink text-white",
  "bg-green text-white",
  "bg-purple text-white",
  "bg-orange text-white",
  "bg-coral text-white",
  "bg-gold text-foreground",
];

interface WordDisplayProps {
  word: string;
  onHear?: () => void;
  isSpeaking?: boolean;
}

export function WordDisplay({ word, onHear, isSpeaking }: WordDisplayProps) {
  const syllables = useMemo(() => getSyllables(word), [word]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center gap-4"
    >
      <p className="text-lg text-muted font-semibold">Say this word twice:</p>

      <motion.div
        key={word}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card px-12 py-6"
      >
        <span className="text-5xl sm:text-6xl font-black text-foreground">{word}</span>
      </motion.div>

      {syllables.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap justify-center">
          {syllables.map((syl, i) => (
            <div key={`${word}-${i}`} className="flex items-center gap-1.5">
              {i > 0 && syllables.length > 1 && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.4 }}
                  transition={{ delay: i * 0.08 }}
                  className="text-muted text-lg select-none"
                >
                  ·
                </motion.span>
              )}
              <motion.span
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08, duration: 0.25 }}
                className={`rounded-full px-3 py-1.5 font-bold text-sm ${PILL_COLOURS[i % PILL_COLOURS.length]}`}
              >
                {syl}
              </motion.span>
            </div>
          ))}
        </div>
      )}

      {onHear && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onHear}
          disabled={isSpeaking}
          className="text-muted"
        >
          {isSpeaking ? "🔊 Playing..." : "🔈 Hear it first"}
        </Button>
      )}
    </motion.div>
  );
}
