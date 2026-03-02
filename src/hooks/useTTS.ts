"use client";

import { useState, useCallback } from "react";
import { speak, cancelSpeech, isTTSSupported } from "@/lib/speech/tts";

export function useTTS() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const supported = isTTSSupported();

  const speakWord = useCallback(async (text: string) => {
    if (!supported) return;
    setIsSpeaking(true);
    try {
      await speak(text);
    } finally {
      setIsSpeaking(false);
    }
  }, [supported]);

  const cancel = useCallback(() => {
    cancelSpeech();
    setIsSpeaking(false);
  }, []);

  return { speakWord, cancel, isSpeaking, supported };
}
