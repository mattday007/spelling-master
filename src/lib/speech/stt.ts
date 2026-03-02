/* eslint-disable @typescript-eslint/no-explicit-any */

export interface STTResult {
  transcript: string;
  confidence: number;
  alternatives: Array<{ transcript: string; confidence: number }>;
}

export function isSTTSupported(): boolean {
  if (typeof window === "undefined") return false;
  return !!(
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition
  );
}

// Try languages in order of preference for NZ English
const PREFERRED_LANGS = ["en-NZ", "en-AU", "en-GB", "en-US"];

export function createRecognition(lang?: string): any | null {
  if (!isSTTSupported()) return null;

  const SpeechRecognitionCtor =
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition;

  const recognition = new SpeechRecognitionCtor();
  recognition.lang = lang ?? PREFERRED_LANGS[0];
  recognition.interimResults = false;
  recognition.maxAlternatives = 5;

  return recognition;
}

export function getPreferredLang(): string {
  // Most browsers accept any BCP47 tag but may not have specific accents.
  // Chrome tends to support en-US, en-GB, en-AU well; en-NZ less so.
  // We default to en-AU as closest to NZ English.
  return "en-AU";
}
