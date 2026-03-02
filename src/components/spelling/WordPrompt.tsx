"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";

interface WordPromptProps {
  onHear: () => void;
  isSpeaking: boolean;
  hint?: string;
}

export function WordPrompt({ onHear, isSpeaking, hint }: WordPromptProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center gap-4"
    >
      <p className="text-lg text-muted font-semibold">Listen to the word, then spell it!</p>

      <Button
        variant="primary"
        size="icon"
        circular
        onClick={onHear}
        disabled={isSpeaking}
        className="w-20 h-20 text-3xl"
      >
        {isSpeaking ? (
          <motion.span
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 0.8 }}
          >
            🔊
          </motion.span>
        ) : (
          "🔈"
        )}
      </Button>

      <p className="text-sm text-muted">Tap to hear the word</p>

      {hint && (
        <p className="text-sm text-muted italic">
          Hint: {hint.length} letters
        </p>
      )}
    </motion.div>
  );
}
