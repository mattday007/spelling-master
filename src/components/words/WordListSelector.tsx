"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { db } from "@/db/database";
import type { WordList } from "@/types";

const DIFFICULTY_LEVELS = [
  { value: 1, label: "Easy", emoji: "\u{1F331}", bg: "bg-green/20", border: "border-green/40", text: "text-green" },
  { value: 2, label: "Medium", emoji: "\u{1F525}", bg: "bg-orange/20", border: "border-orange/40", text: "text-orange" },
  { value: 3, label: "Hard", emoji: "\u26A1", bg: "bg-purple/20", border: "border-purple/40", text: "text-purple" },
] as const;

interface DifficultyPickerProps {
  presetListIds: number[];
  customLists: WordList[];
  onSelectDifficulty: (difficulty: number, listIds: number[]) => void;
  onSelectCustom: (listId: number) => void;
}

export function DifficultyPicker({
  presetListIds,
  customLists,
  onSelectDifficulty,
  onSelectCustom,
}: DifficultyPickerProps) {
  const [counts, setCounts] = useState<Record<number, number>>({});

  useEffect(() => {
    if (presetListIds.length === 0) return;

    async function loadCounts() {
      const words = await db.words
        .where("wordListId")
        .anyOf(presetListIds)
        .toArray();

      const byDifficulty: Record<number, number> = {};
      for (const w of words) {
        byDifficulty[w.difficulty] = (byDifficulty[w.difficulty] ?? 0) + 1;
      }
      setCounts(byDifficulty);
    }

    loadCounts();
  }, [presetListIds]);

  if (presetListIds.length === 0 && customLists.length === 0) {
    return (
      <Card className="text-center space-y-3">
        <p className="text-xl font-bold">No word lists available!</p>
        <p className="text-muted">Ask a parent to add some word lists for your age group.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6 w-full max-w-md">
      {presetListIds.length > 0 && (
        <div className="space-y-3">
          <p className="text-lg text-muted font-semibold text-center">Choose your level:</p>
          {DIFFICULTY_LEVELS.map((level, i) => {
            const count = counts[level.value] ?? 0;
            const disabled = count === 0;

            return (
              <motion.button
                key={level.value}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                whileHover={disabled ? {} : { scale: 1.02 }}
                whileTap={disabled ? {} : { scale: 0.98 }}
                onClick={() => !disabled && onSelectDifficulty(level.value, presetListIds)}
                disabled={disabled}
                className={`w-full p-5 rounded-2xl text-left flex items-center gap-4 border-2 transition-shadow no-select
                  ${level.bg} ${level.border}
                  ${disabled ? "opacity-40 cursor-not-allowed" : "hover:shadow-xl cursor-pointer"}`}
              >
                <span className="text-4xl">{level.emoji}</span>
                <div className="flex-1">
                  <p className={`font-black text-xl ${level.text}`}>{level.label}</p>
                  <p className="text-sm text-muted">
                    {count} {count === 1 ? "word" : "words"}
                  </p>
                </div>
                {!disabled && <span className="text-muted text-xl">&rarr;</span>}
              </motion.button>
            );
          })}
        </div>
      )}

      {customLists.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-muted/30" />
            <p className="text-sm text-muted font-semibold">Your Lists</p>
            <div className="h-px flex-1 bg-muted/30" />
          </div>
          {customLists.map((list, i) => (
            <motion.button
              key={list.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: (DIFFICULTY_LEVELS.length + i) * 0.08 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelectCustom(list.id!)}
              className="w-full glass-card p-4 text-left flex items-center justify-between hover:shadow-xl transition-shadow no-select"
            >
              <div>
                <p className="font-bold text-lg">{list.name}</p>
              </div>
              <span className="text-muted text-xl">&rarr;</span>
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}
