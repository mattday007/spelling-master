/**
 * Text-to-speech: plays pre-generated MP3s from /audio/{word}.mp3,
 * then checks the IndexedDB audio cache (runtime-generated),
 * falling back to Web Speech API if neither exists.
 */

import { getCachedAudio } from "@/lib/audio/audio-cache";

// ---------------------------------------------------------------------------
// Audio filename helper (must match scripts/generate-audio.ts)
// ---------------------------------------------------------------------------

function toAudioFilename(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

// ---------------------------------------------------------------------------
// Audio playback
// ---------------------------------------------------------------------------

let currentAudio: HTMLAudioElement | null = null;

function playAudioUrl(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const audio = new Audio(url);
    currentAudio = audio;

    audio.onended = () => {
      currentAudio = null;
      resolve();
    };
    audio.onerror = () => {
      currentAudio = null;
      reject(new Error("audio-play-failed"));
    };

    audio.play().catch((err) => {
      currentAudio = null;
      reject(err);
    });
  });
}

function playStaticMP3(filename: string): Promise<void> {
  return playAudioUrl(`/audio/${filename}.mp3`);
}

async function playCachedAudio(text: string): Promise<void> {
  const blob = await getCachedAudio(text);
  if (!blob) throw new Error("not-cached");
  const url = URL.createObjectURL(blob);
  try {
    await playAudioUrl(url);
  } finally {
    URL.revokeObjectURL(url);
  }
}

// ---------------------------------------------------------------------------
// Web Speech API fallback (for custom words without pre-generated audio)
// ---------------------------------------------------------------------------

const PREFERRED_VOICES = [
  "Karen",                     // Apple — Australian
  "Daniel",                    // Apple — British
  "Google UK English Female",
  "Google UK English Male",
  "Moira",                     // Apple — Irish
];

const PREFERRED_LANGS = ["en-NZ", "en-AU", "en-GB", "en"];

let cachedVoice: SpeechSynthesisVoice | null = null;

function getPreferredVoice(): SpeechSynthesisVoice | null {
  if (cachedVoice) return cachedVoice;

  const voices = speechSynthesis.getVoices();
  if (voices.length === 0) return null;

  for (const name of PREFERRED_VOICES) {
    const enhanced = voices.find(
      (v) => v.name.includes(name) && /enhanced|premium/i.test(v.name)
    );
    if (enhanced) { cachedVoice = enhanced; return enhanced; }
    const standard = voices.find((v) => v.name.includes(name));
    if (standard) { cachedVoice = standard; return standard; }
  }

  for (const lang of PREFERRED_LANGS) {
    const matches = voices.filter((v) => v.lang.startsWith(lang));
    const enhanced = matches.find((v) => /enhanced|premium/i.test(v.name));
    if (enhanced) { cachedVoice = enhanced; return enhanced; }
    const nonCompact = matches.find((v) => !/compact/i.test(v.name));
    if (nonCompact) { cachedVoice = nonCompact; return nonCompact; }
    if (matches.length > 0) { cachedVoice = matches[0]; return matches[0]; }
  }

  cachedVoice = voices[0];
  return voices[0];
}

function speakWithWebSpeechAPI(text: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!("speechSynthesis" in window)) {
      reject(new Error("Speech synthesis not supported"));
      return;
    }

    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const voice = getPreferredVoice();
    if (voice) utterance.voice = voice;

    utterance.rate = text.length <= 3 ? 0.7 : 0.85;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onend = () => resolve();
    utterance.onerror = (e) => {
      if (e.error === "canceled") resolve();
      else reject(e);
    };

    speechSynthesis.speak(utterance);
  });
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Speak a word. Tries in order:
 * 1. Static pre-generated MP3 from /audio/
 * 2. Runtime-generated MP3 from IndexedDB audio cache
 * 3. Web Speech API fallback
 */
export async function speak(text: string): Promise<void> {
  const filename = toAudioFilename(text);

  // 1. Try static file
  if (filename) {
    try {
      await playStaticMP3(filename);
      return;
    } catch {
      // Static file not found — continue
    }
  }

  // 2. Try cached audio from IndexedDB
  try {
    await playCachedAudio(text);
    return;
  } catch {
    // Not cached — continue
  }

  // 3. Fall back to Web Speech API
  await speakWithWebSpeechAPI(text);
}

export function cancelSpeech() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
  if ("speechSynthesis" in window) {
    speechSynthesis.cancel();
  }
}

export function isTTSSupported(): boolean {
  return true; // Audio API is universally supported
}
