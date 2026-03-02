"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useCallback, useRef } from "react";
import { isSTTSupported, createRecognition, getPreferredLang } from "@/lib/speech/stt";
import type { STTResult } from "@/lib/speech/stt";

/** Max time we'll listen before force-stopping (ms) */
const MAX_LISTEN_MS = 8000;

/**
 * After speechend fires, wait this long before calling stop().
 * Gives the recogniser time to finalise short utterances.
 */
const POST_SPEECH_DELAY_MS = 1500;

export function useSTT() {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const supported = typeof window !== "undefined" && isSTTSupported();

  const clearTimers = useCallback(() => {
    for (const t of timersRef.current) clearTimeout(t);
    timersRef.current = [];
  }, []);

  const startListening = useCallback((): Promise<STTResult> => {
    return new Promise((resolve, reject) => {
      if (!supported) {
        reject(new Error("Speech recognition not supported on this device"));
        return;
      }

      const lang = getPreferredLang();
      const recognition = createRecognition(lang);
      if (!recognition) {
        reject(new Error("Failed to create speech recognition"));
        return;
      }

      // Use continuous mode so the browser doesn't auto-stop on short words
      recognition.continuous = true;
      recognition.interimResults = true;

      recognitionRef.current = recognition;
      setIsListening(true);
      setError(null);
      clearTimers();

      let settled = false;
      let lastInterimTranscript = "";
      let hasSpeechEnded = false;

      const finish = (result: STTResult) => {
        if (settled) return;
        settled = true;
        clearTimers();
        setIsListening(false);
        resolve(result);
      };

      const fail = (msg: string) => {
        if (settled) return;
        settled = true;
        clearTimers();
        setIsListening(false);
        setError(msg);
        reject(new Error(msg));
      };

      /** Gracefully stop — this triggers onresult with final=true for pending audio */
      const gracefulStop = () => {
        try { recognition.stop(); } catch { /* already stopped */ }
      };

      recognition.onresult = (event: any) => {
        let finalTranscript = "";
        let interimTranscript = "";
        let bestConfidence = 0;
        const alternatives: Array<{ transcript: string; confidence: number }> = [];

        for (let i = 0; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript;
            bestConfidence = Math.max(bestConfidence, result[0].confidence);
            for (let j = 0; j < result.length; j++) {
              alternatives.push({
                transcript: result[j].transcript.trim().toLowerCase(),
                confidence: result[j].confidence,
              });
            }
          } else {
            interimTranscript += result[0].transcript;
          }
        }

        lastInterimTranscript = interimTranscript || finalTranscript || lastInterimTranscript;

        if (finalTranscript) {
          console.log("[STT] Final transcript:", finalTranscript, "confidence:", bestConfidence, "alternatives:", alternatives);
          finish({
            transcript: finalTranscript.trim().toLowerCase(),
            confidence: bestConfidence,
            alternatives,
          });
          // Stop recognition now that we have a final result
          gracefulStop();
        }
      };

      recognition.onerror = (event: any) => {
        console.log("[STT] Error:", event.error, event.message);
        // "no-speech" just means silence — not fatal in continuous mode
        if (event.error === "no-speech") return;
        fail(`Speech error: ${event.error}`);
      };

      recognition.onend = () => {
        console.log("[STT] Recognition ended. settled:", settled, "lastInterim:", lastInterimTranscript);
        setIsListening(false);
        if (!settled) {
          if (lastInterimTranscript) {
            console.log("[STT] Using interim transcript as fallback:", lastInterimTranscript);
            finish({
              transcript: lastInterimTranscript.trim().toLowerCase(),
              confidence: 0.5,
              alternatives: [{ transcript: lastInterimTranscript.trim().toLowerCase(), confidence: 0.5 }],
            });
          } else {
            fail("No speech was detected. Please try again.");
          }
        }
      };

      recognition.onaudiostart = () => console.log("[STT] Audio capture started");
      recognition.onspeechstart = () => console.log("[STT] Speech detected");

      recognition.onspeechend = () => {
        console.log("[STT] Speech ended");
        hasSpeechEnded = true;
        // Give the recogniser time to finalise, then stop gracefully.
        // stop() forces it to emit a final result for any buffered audio.
        const t = setTimeout(() => {
          if (!settled) {
            console.log("[STT] Post-speech delay elapsed, stopping recognition");
            gracefulStop();
          }
        }, POST_SPEECH_DELAY_MS);
        timersRef.current.push(t);
      };

      // Safety timeout — don't listen forever
      const maxTimer = setTimeout(() => {
        if (!settled) {
          console.log("[STT] Max listen time reached, stopping");
          gracefulStop();
        }
      }, MAX_LISTEN_MS);
      timersRef.current.push(maxTimer);

      console.log("[STT] Starting recognition with lang:", lang, "(continuous mode)");
      recognition.start();
    });
  }, [supported, clearTimers]);

  const stopListening = useCallback(() => {
    clearTimers();
    try { recognitionRef.current?.stop(); } catch { /* ignore */ }
    setIsListening(false);
  }, [clearTimers]);

  return { startListening, stopListening, isListening, supported, error };
}
