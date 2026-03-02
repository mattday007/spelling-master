/**
 * Text-to-speech: plays pre-generated MP3s from /audio/{word}.mp3,
 * then checks the IndexedDB audio cache (runtime-generated),
 * falling back to Web Speech API if neither exists.
 *
 * Uses Web Audio API (AudioContext) for MP3 playback — this is
 * reliable on iOS Safari where HTMLAudioElement.play() silently fails.
 *
 * iOS Safari requires AudioContext to be created AND resumed during a
 * synchronous user-gesture call stack. We handle this by:
 * 1. Unlocking on the first touch/click anywhere on the page
 * 2. Calling resume() synchronously at the top of speak(), before any await
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

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
// Web Audio API — iOS-safe AudioContext management
// ---------------------------------------------------------------------------

let audioCtx: AudioContext | null = null;
let currentSource: AudioBufferSourceNode | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const Ctor = window.AudioContext || (window as any).webkitAudioContext;
    audioCtx = new Ctor();
  }
  return audioCtx;
}

/**
 * Must be called synchronously during a user gesture (before any await).
 * Creates the AudioContext if needed, resumes it if suspended, and plays
 * a tiny silent buffer to fully unlock audio on iOS Safari.
 */
function ensureAudioUnlocked(): void {
  const ctx = getAudioContext();
  if (ctx.state === "suspended") {
    ctx.resume();
  }
  // Play a silent buffer — this is the standard iOS audio unlock trick.
  // Without this, some iOS versions keep the context "running" but muted.
  try {
    const silent = ctx.createBuffer(1, 1, 22050);
    const src = ctx.createBufferSource();
    src.buffer = silent;
    src.connect(ctx.destination);
    src.start();
  } catch {
    // Ignore — worst case audio unlock didn't work this time
  }
}

// Unlock audio on the very first user interaction with the page.
// This covers cases where speak() isn't the first thing called.
if (typeof document !== "undefined") {
  const unlock = () => {
    ensureAudioUnlocked();
    document.removeEventListener("touchstart", unlock, true);
    document.removeEventListener("touchend", unlock, true);
    document.removeEventListener("click", unlock, true);
  };
  document.addEventListener("touchstart", unlock, true);
  document.addEventListener("touchend", unlock, true);
  document.addEventListener("click", unlock, true);
}

// ---------------------------------------------------------------------------
// Audio playback
// ---------------------------------------------------------------------------

async function playAudioBuffer(buffer: ArrayBuffer): Promise<void> {
  const ctx = getAudioContext();
  const audioBuffer = await ctx.decodeAudioData(buffer);

  return new Promise((resolve, reject) => {
    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);
    source.onended = () => {
      currentSource = null;
      resolve();
    };
    currentSource = source;
    try {
      source.start();
    } catch (err) {
      currentSource = null;
      reject(err);
    }
  });
}

async function playStaticMP3(filename: string): Promise<void> {
  const res = await fetch(`/audio/${filename}.mp3`);
  if (!res.ok) throw new Error("not-found");
  const buffer = await res.arrayBuffer();
  await playAudioBuffer(buffer);
}

async function playCachedAudio(text: string): Promise<void> {
  const blob = await getCachedAudio(text);
  if (!blob) throw new Error("not-cached");
  const buffer = await blob.arrayBuffer();
  await playAudioBuffer(buffer);
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
  // IMPORTANT: unlock/resume AudioContext synchronously during the user
  // gesture, BEFORE any await. iOS Safari revokes gesture privilege after
  // the first async gap.
  ensureAudioUnlocked();

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
  if (currentSource) {
    try { currentSource.stop(); } catch { /* already stopped */ }
    currentSource = null;
  }
  if ("speechSynthesis" in window) {
    speechSynthesis.cancel();
  }
}

export function isTTSSupported(): boolean {
  return true; // Audio API is universally supported
}
