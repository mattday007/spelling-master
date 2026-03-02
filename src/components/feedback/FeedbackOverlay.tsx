"use client";

import { motion, AnimatePresence } from "framer-motion";
import { StarRating } from "@/components/ui/StarRating";
import { Button } from "@/components/ui/Button";
import { buildHint } from "@/lib/scoring/spelling-scorer";

interface FeedbackOverlayProps {
  visible: boolean;
  score: number;
  isCorrect: boolean;
  targetWord: string;
  recognisedText: string;
  mode?: "spelling" | "pronunciation";
  onNext: () => void;
  onRetry?: () => void;
}

const ENCOURAGEMENTS_CORRECT = [
  "Brilliant!",
  "Fantastic!",
  "Well done!",
  "Superstar!",
  "Amazing!",
  "You nailed it!",
  "Perfect!",
];

const ENCOURAGEMENTS_CLOSE = [
  "Almost there!",
  "So close!",
  "Good try!",
  "Nearly perfect!",
  "Keep going!",
];

const ENCOURAGEMENTS_TRY_AGAIN = [
  "Have another go!",
  "You can do it!",
  "Let's try again!",
  "Keep practising!",
  "Don't give up!",
];

function getEncouragement(score: number): string {
  const list =
    score >= 3
      ? ENCOURAGEMENTS_CORRECT
      : score >= 2
        ? ENCOURAGEMENTS_CLOSE
        : ENCOURAGEMENTS_TRY_AGAIN;
  return list[Math.floor(Math.random() * list.length)];
}

const CONFETTI_COLORS = ["#4F8CFF", "#D946EF", "#FF6B6B", "#FDCB6E", "#00B894", "#FF8C42"];
const CONFETTI_PIECES = Array.from({ length: 24 }, (_, i) => ({
  color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  left: `${(i * 4.2 + 3) % 100}%`,
  rotate: (i * 57) % 720 - 360,
  x: (i * 17) % 200 - 100,
  duration: 1.5 + (i % 5) * 0.2,
  delay: (i % 8) * 0.06,
}));

function Confetti() {
  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {CONFETTI_PIECES.map((piece, i) => (
        <motion.div
          key={i}
          className="absolute w-3 h-3 rounded-full"
          style={{
            backgroundColor: piece.color,
            left: piece.left,
            top: -10,
          }}
          initial={{ y: -10, opacity: 1, rotate: 0 }}
          animate={{
            y: typeof window !== "undefined" ? window.innerHeight + 20 : 800,
            opacity: 0,
            rotate: piece.rotate,
            x: piece.x,
          }}
          transition={{
            duration: piece.duration,
            delay: piece.delay,
            ease: "easeIn",
          }}
        />
      ))}
    </div>
  );
}

export function FeedbackOverlay({
  visible,
  score,
  isCorrect,
  targetWord,
  recognisedText,
  mode = "spelling",
  onNext,
  onRetry,
}: FeedbackOverlayProps) {
  return (
    <AnimatePresence>
      {visible && (
        <>
          {score >= 3 && <Confetti />}
          <motion.div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="glass-card p-8 max-w-sm w-full text-center space-y-5"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              <StarRating score={score} size={48} />

              <motion.p
                className="text-3xl font-black"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring" }}
              >
                {getEncouragement(score)}
              </motion.p>

              <div className="space-y-1">
                {isCorrect ? (
                  <p className="text-lg">
                    <span className="text-muted">The word was:</span>{" "}
                    <span className="font-black text-foreground text-2xl">{targetWord}</span>
                  </p>
                ) : (
                  <div className="space-y-2">
                    <p className="text-lg text-muted">Hint:</p>
                    <span className="inline-flex items-center gap-1.5 font-black text-3xl">
                      {mode === "spelling" && recognisedText
                        ? buildHint(targetWord, recognisedText).split("").map((ch, i) =>
                            ch === "\u25A1" ? (
                              <span
                                key={i}
                                className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-coral text-white text-sm font-black"
                              >
                                ?
                              </span>
                            ) : (
                              <span key={i} className="text-green">{ch}</span>
                            )
                          )
                        : targetWord}
                    </span>
                  </div>
                )}
                {recognisedText && (
                  <p className="text-sm text-muted">
                    {mode === "pronunciation" ? "We heard:" : "You wrote:"}{" "}
                    <span className={`font-semibold ${isCorrect ? "text-green" : "text-coral"}`}>
                      {recognisedText}
                    </span>
                  </p>
                )}
              </div>

              <div className="flex gap-3 justify-center pt-2">
                {!isCorrect && onRetry && (
                  <Button variant="secondary" onClick={onRetry}>
                    Try Again
                  </Button>
                )}
                <Button variant="success" onClick={onNext}>
                  {isCorrect ? "Next Word" : "Continue"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
