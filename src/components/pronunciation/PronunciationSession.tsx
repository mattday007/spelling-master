"use client";

import { useReducer, useCallback, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { WordDisplay } from "./WordDisplay";
import { MicrophoneButton } from "./MicrophoneButton";
import { FeedbackOverlay } from "@/components/feedback/FeedbackOverlay";
import { useTTS } from "@/hooks/useTTS";
import { useSTT } from "@/hooks/useSTT";
import { useSessionWords } from "@/hooks/useSessionWords";
import { scorePronunciation } from "@/lib/scoring/pronunciation-scorer";
import { db } from "@/db/database";
import { updateMasteryAfterSession } from "@/lib/mastery";

interface SessionState {
  phase: "prompting" | "recording" | "feedback" | "complete";
  score: number;
  isCorrect: boolean;
  recognisedText: string;
  correctCount: number;
  startedAt: Date;
}

type Action =
  | { type: "START_RECORDING" }
  | { type: "SHOW_FEEDBACK"; score: number; isCorrect: boolean; recognisedText: string }
  | { type: "NEXT" }
  | { type: "COMPLETE" }
  | { type: "RESET" };

function reducer(state: SessionState, action: Action): SessionState {
  switch (action.type) {
    case "START_RECORDING":
      return { ...state, phase: "recording" };
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

interface PronunciationSessionProps {
  profileId: number;
  wordListIds: number[];
  difficulty?: number;
  onFinish: () => void;
}

export function PronunciationSession({ profileId, wordListIds, difficulty, onFinish }: PronunciationSessionProps) {
  const { currentWord, currentIndex, nextWord, isComplete, loading, total } =
    useSessionWords(profileId, wordListIds, "pronunciation", difficulty);
  const { speakWord, isSpeaking } = useTTS();
  const { startListening, isListening, supported: sttSupported } = useSTT();
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

  useEffect(() => {
    if (isComplete && !sessionSaved.current) {
      sessionSaved.current = true;
      dispatch({ type: "COMPLETE" });
      db.sessionSummaries.add({
        profileId,
        wordListId: wordListIds[0] ?? 0,
        mode: "pronunciation",
        totalWords: total,
        correctCount: state.correctCount,
        startedAt: state.startedAt,
        endedAt: new Date(),
      });
      updateMasteryAfterSession(profileId, "pronunciation", wordResults.current);
    }
  }, [isComplete, profileId, wordListIds, total, state.correctCount, state.startedAt]);

  const handleRecord = useCallback(async () => {
    if (!currentWord || !sttSupported) return;

    dispatch({ type: "START_RECORDING" });

    try {
      const { transcript, confidence, alternatives } = await startListening();
      const result = scorePronunciation(currentWord.text, transcript, confidence, alternatives);

      await db.practiceAttempts.add({
        profileId,
        wordId: currentWord.id!,
        wordText: currentWord.text,
        mode: "pronunciation",
        success: result.isCorrect,
        recognisedText: result.heardAs,
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
        recognisedText: result.heardAs,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not hear you";
      console.log("[Pronunciation] Recognition failed:", message);
      dispatch({
        type: "SHOW_FEEDBACK",
        score: 0,
        isCorrect: false,
        recognisedText: `(${message})`,
      });
    }
  }, [currentWord, profileId, sttSupported, startListening]);

  const handleNext = useCallback(() => {
    nextWord();
    dispatch({ type: "NEXT" });
  }, [nextWord]);

  if (!sttSupported) {
    return (
      <Card className="text-center space-y-4 max-w-md mx-auto">
        <div className="text-5xl">😔</div>
        <h2 className="text-2xl font-black">Speech Recognition Unavailable</h2>
        <p className="text-muted">
          Unfortunately, speech recognition isn&apos;t supported on this device or browser.
          Try using Chrome on a desktop or Android device.
        </p>
        <p className="text-sm text-muted">
          iOS Safari has limited speech recognition support.
        </p>
        <Button onClick={onFinish}>Go Back</Button>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-8 h-8 border-3 border-pink border-t-transparent rounded-full"
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

      <WordDisplay
        word={currentWord?.text ?? ""}
        onHear={() => currentWord && speakWord(currentWord.text)}
        isSpeaking={isSpeaking}
      />

      <div className="flex flex-col items-center gap-3 py-4">
        <MicrophoneButton
          isListening={isListening}
          onClick={handleRecord}
          disabled={state.phase === "feedback"}
        />
        <p className="text-sm text-muted">
          {isListening
            ? "Listening... say the word twice!"
            : "Tap and say the word twice"}
        </p>
      </div>

      <FeedbackOverlay
        visible={state.phase === "feedback"}
        score={state.score}
        isCorrect={state.isCorrect}
        targetWord={currentWord?.text ?? ""}
        recognisedText={state.recognisedText}
        mode="pronunciation"
        onNext={handleNext}
        onRetry={() => dispatch({ type: "NEXT" })}
      />
    </div>
  );
}
