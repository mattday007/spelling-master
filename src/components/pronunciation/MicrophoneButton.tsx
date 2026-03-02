"use client";

import { motion } from "framer-motion";

interface MicrophoneButtonProps {
  isListening: boolean;
  onClick: () => void;
  disabled?: boolean;
}

export function MicrophoneButton({ isListening, onClick, disabled = false }: MicrophoneButtonProps) {
  return (
    <div className="relative flex items-center justify-center">
      {isListening && (
        <>
          <motion.div
            className="absolute w-24 h-24 rounded-full bg-coral/30"
            animate={{ scale: [1, 1.5], opacity: [0.6, 0] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeOut" }}
          />
          <motion.div
            className="absolute w-24 h-24 rounded-full bg-coral/20"
            animate={{ scale: [1, 1.8], opacity: [0.4, 0] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeOut", delay: 0.3 }}
          />
        </>
      )}
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        onClick={onClick}
        disabled={disabled}
        className={`
          relative z-10 w-20 h-20 rounded-full flex items-center justify-center text-3xl
          shadow-lg transition-colors no-select
          disabled:opacity-50 disabled:pointer-events-none
          ${isListening ? "bg-coral text-white" : "bg-blue text-white"}
        `}
      >
        {isListening ? (
          <motion.span
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ repeat: Infinity, duration: 0.6 }}
          >
            🎙️
          </motion.span>
        ) : (
          "🎤"
        )}
      </motion.button>
    </div>
  );
}
