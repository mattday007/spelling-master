"use client";

import { useReducer, useCallback, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { WordPrompt } from "./WordPrompt";
import { HandwritingCanvas } from "./HandwritingCanvas";
import { FeedbackOverlay } from "@/components/feedback/FeedbackOverlay";
import { useTTS } from "@/hooks/useTTS";
import { useSessionWords } from "@/hooks/useSessionWords";
import { scoreSpelling } from "@/lib/scoring/spelling-scorer";
import { db } from "@/db/database";
import { updateMasteryAfterSession } from "@/lib/mastery";
import type { Word } from "@/types";

interface SessionState {
  phase: "prompting" | "writing" | "feedback" | "complete";
  score: number;
  isCorrect: boolean;
  recognisedText: string;
  correctCount: number;
  startedAt: Date;
}

type Action =
  | { type: "START_WRITING" }
  | { type: "SHOW_FEEDBACK"; score: number; isCorrect: boolean; recognisedText: string }
  | { type: "NEXT" }
  | { type: "COMPLETE" }
  | { type: "RESET" };

function reducer(state: SessionState, action: Action): SessionState {
  switch (action.type) {
    case "START_WRITING":
      return { ...state, phase: "writing" };
    case "SHOW_FEEDBACK":
      return {
        ...state,
        phase: "feedback",
        score: action.score,
        isCorrect: action.isCorrect,
        recognisedText: action.recognisedText,
        correctCount: state.correctCount + (action.isCorrect ? 1 : 0),
      };
    case "NEXT":
      return { ...state, phase: "prompting", score: 0, isCorrect: false, recognisedText: "" };
    case "COMPLETE":
      return { ...state, phase: "complete" };
    case "RESET":
      return {
        phase: "prompting",
        score: 0,
        isCorrect: false,
        recognisedText: "",
        correctCount: 0,
        startedAt: new Date(),
      };
    default:
      return state;
  }
}

interface SpellingSessionProps {
  profileId: number;
  wordListIds: number[];
  difficulty?: number;
  onFinish: () => void;
}

export function SpellingSession({ profileId, wordListIds, difficulty, onFinish }: SpellingSessionProps) {
  const { words, currentWord, currentIndex, nextWord, isComplete, loading, total } =
    useSessionWords(profileId, wordListIds, "spelling", difficulty);
  const { speakWord, isSpeaking } = useTTS();
  const sessionSaved = useRef(false);
  const wordResults = useRef<{ wordId: number; wordText: string; success: boolean }[]>([]);

  const [state, dispatch] = useReducer(reducer, {
    phase: "prompting",
    score: 0,
    isCorrect: false,
    recognisedText: "",
    correctCount: 0,
    startedAt: new Date(),
  });

  // Auto-play is skipped — iOS Safari only allows audio from direct user
  // gestures. The child taps the speaker button to hear the word.

  useEffect(() => {
    if (isComplete && !sessionSaved.current) {
      sessionSaved.current = true;
      dispatch({ type: "COMPLETE" });
      db.sessionSummaries.add({
        profileId,
        wordListId: wordListIds[0] ?? 0,
        mode: "spelling",
        totalWords: total,
        correctCount: state.correctCount,
        startedAt: state.startedAt,
        endedAt: new Date(),
      });
      updateMasteryAfterSession(profileId, "spelling", wordResults.current);
    }
  }, [isComplete, profileId, wordListIds, total, state.correctCount, state.startedAt]);

  const handleRecognised = useCallback(
    async (text: string) => {
      if (!currentWord) return;

      const result = scoreSpelling(currentWord.text, text);

      await db.practiceAttempts.add({
        profileId,
        wordId: currentWord.id!,
        wordText: currentWord.text,
        mode: "spelling",
        success: result.isCorrect,
        recognisedText: text,
        score: result.score,
        attemptedAt: new Date(),
      });

      wordResults.current.push({
        wordId: currentWord.id!,
        wordText: currentWord.text,
        success: result.isCorrect,
      });

      dispatch({
        type: "SHOW_FEEDBACK",
        score: result.score,
        isCorrect: result.isCorrect,
        recognisedText: text,
      });
    },
    [currentWord, profileId]
  );

  const handleNext = useCallback(() => {
    nextWord();
    dispatch({ type: "NEXT" });
  }, [nextWord]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-8 h-8 border-3 border-blue border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (total === 0) {
    return (
      <Card className="text-center space-y-4">
        <p className="text-xl font-bold">No words in this list!</p>
        <p className="text-muted">Ask a parent to add some words first.</p>
        <Button onClick={onFinish}>Go Back</Button>
      </Card>
    );
  }

  if (state.phase === "complete") {
    const percentage = total > 0 ? Math.round((state.correctCount / total) * 100) : 0;
    return (
      <Card className="text-center space-y-6 max-w-md mx-auto">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
          className="text-6xl"
        >
          {percentage >= 80 ? "🏆" : percentage >= 50 ? "⭐" : "💪"}
        </motion.div>
        <h2 className="text-3xl font-black">Session Complete!</h2>
        <p className="text-xl text-muted">
          You got{" "}
          <span className="font-black text-green">{state.correctCount}</span> out of{" "}
          <span className="font-black">{total}</span> correct!
        </p>
        <ProgressBar value={percentage} label="Accuracy" />
        <div className="flex gap-3 justify-center">
          <Button variant="secondary" onClick={onFinish}>
            Done
          </Button>
          <Button
            onClick={() => {
              sessionSaved.current = false;
              wordResults.current = [];
              dispatch({ type: "RESET" });
            }}
          >
            Play Again
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-lg mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-muted">
          Word {currentIndex + 1} of {total}
        </span>
        <Button variant="ghost" size="sm" onClick={onFinish}>
          End Session
        </Button>
      </div>

      <ProgressBar value={((currentIndex) / total) * 100} />

      <WordPrompt
        onHear={() => currentWord && speakWord(currentWord.text)}
        isSpeaking={isSpeaking}
        hint={currentWord?.text}
      />

      <HandwritingCanvas
        onRecognised={handleRecognised}
        lexicon={words.map((w: Word) => w.text)}
        disabled={state.phase === "feedback"}
      />

      <FeedbackOverlay
        visible={state.phase === "feedback"}
        score={state.score}
        isCorrect={state.isCorrect}
        targetWord={currentWord?.text ?? ""}
        recognisedText={state.recognisedText}
        onNext={handleNext}
        onRetry={() => dispatch({ type: "START_WRITING" })}
      />
    </div>
  );
}
