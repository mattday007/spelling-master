"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";

interface PinInputProps {
  length?: number;
  onComplete: (pin: string) => void;
  error?: boolean;
}

export function PinInput({ length = 4, onComplete, error = false }: PinInputProps) {
  const [values, setValues] = useState<string[]>(Array(length).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const prevError = useRef(false);
  useEffect(() => {
    if (error && !prevError.current) {
      // Reset on rising edge of error
      Promise.resolve().then(() => {
        setValues(Array(length).fill(""));
        inputRefs.current[0]?.focus();
      });
    }
    prevError.current = error;
  }, [error, length]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newValues = [...values];
    newValues[index] = value.slice(-1);
    setValues(newValues);

    if (value && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newValues.every((v) => v !== "")) {
      onComplete(newValues.join(""));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !values[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <div className="flex gap-3 justify-center">
      {values.map((value, i) => (
        <motion.input
          key={i}
          ref={(el) => { inputRefs.current[i] = el; }}
          type="tel"
          inputMode="numeric"
          maxLength={1}
          value={value}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          animate={error ? { x: [0, -8, 8, -8, 0] } : {}}
          transition={{ duration: 0.4 }}
          className={`
            w-16 h-20 text-center text-3xl font-bold rounded-2xl
            border-2 outline-none transition-colors
            ${error
              ? "border-coral bg-red-50"
              : value
                ? "border-blue bg-blue/5"
                : "border-gray-200 bg-white"
            }
            focus:border-blue focus:ring-2 focus:ring-blue/20
          `}
        />
      ))}
    </div>
  );
}
