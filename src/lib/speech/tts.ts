/**
 * Text-to-speech: plays pre-generated MP3s from /audio/{word}.mp3,
 * then checks the IndexedDB audio cache (runtime-generated),
 * falling back to Web Speech API if neither exists.
 *
 * iOS Safari notes:
 * - play() must be called from touchend/click/keydown handler
 * - HTMLAudioElement plays on the media channel (not muted by silent switch)
 * - iOS 17.4+ has unreliable media events (canplay, loadeddata, ended)
 *   so we monitor currentTime and use timeouts as safety nets
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
// Single reusable Audio element
// ---------------------------------------------------------------------------

let sharedAudio: HTMLAudioElement | null = null;

function getSharedAudio(): HTMLAudioElement {
  if (!sharedAudio) {
    sharedAudio = new Audio();
  }
  return sharedAudio;
}

/**
 * Play audio through the shared element with timeout and playback monitoring.
 * Resolves when audio finishes or after duration elapses.
 * Rejects if play() is blocked or audio doesn't start within 2 seconds.
 */
function playOnSharedElement(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const audio = getSharedAudio();
    let settled = false;
    let playbackStarted = false;
    let maxTimer: ReturnType<typeof setTimeout> | null = null;
    let checkTimer: ReturnType<typeof setTimeout> | null = null;

    const finish = () => {
      if (settled) return;
      settled = true;
      if (maxTimer) clearTimeout(maxTimer);
      if (checkTimer) clearTimeout(checkTimer);
      audio.onended = null;
      audio.onerror = null;
      audio.ontimeupdate = null;
      resolve();
    };

    const fail = (reason: string) => {
      if (settled) return;
      settled = true;
      if (maxTimer) clearTimeout(maxTimer);
      if (checkTimer) clearTimeout(checkTimer);
      audio.pause();
      audio.onended = null;
      audio.onerror = null;
      audio.ontimeupdate = null;
      reject(new Error(reason));
    };

    audio.onended = finish;
    audio.onerror = () => fail("audio-error");

    // Monitor timeupdate to know audio is actually producing output
    audio.ontimeupdate = () => {
      if (!playbackStarted) {
        playbackStarted = true;
        // Audio is actually playing — set a max timer based on duration
        const remaining = (audio.duration - audio.currentTime) * 1000;
        if (isFinite(remaining) && remaining > 0) {
          maxTimer = setTimeout(finish, remaining + 500);
        }
      }
    };

    audio.src = src;

    const p = audio.play();
    if (p) {
      p.then(() => {
        // play() resolved — playback has started (or iOS claims it has).
        // If we don't see timeupdate within 2s, audio isn't really playing.
        checkTimer = setTimeout(() => {
          if (!playbackStarted && !settled) {
            fail("audio-no-playback");
          }
        }, 2000);

        // Safety: even if events are broken, don't hang longer than 10s
        if (!maxTimer) {
          maxTimer = setTimeout(finish, 10_000);
        }
      }).catch((err) => {
        fail(err?.message ?? "play-rejected");
      });
    }
  });
}

// ---------------------------------------------------------------------------
// Web Speech API fallback
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

    // Safety timeout — iOS speechSynthesis can also hang
    const timeout = setTimeout(() => resolve(), 5000);

    utterance.onend = () => { clearTimeout(timeout); resolve(); };
    utterance.onerror = (e) => {
      clearTimeout(timeout);
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
 * 1. Static pre-generated MP3 from /audio/ (direct URL, no fetch before play)
 * 2. Runtime-generated MP3 from IndexedDB audio cache (blob URL)
 * 3. Web Speech API fallback
 *
 * Each step has timeouts to prevent isSpeaking from getting stuck.
 */
export async function speak(text: string): Promise<void> {
  const filename = toAudioFilename(text);

  // 1. Try static file — sets src and calls play() with no async gap
  if (filename) {
    try {
      await playOnSharedElement(`/audio/${filename}.mp3`);
      return;
    } catch {
      // Failed or timed out — continue to next method
    }
  }

  // 2. Try cached audio from IndexedDB (blob URL has an async gap to create)
  try {
    const blob = await getCachedAudio(text);
    if (blob) {
      const url = URL.createObjectURL(blob);
      try {
        await playOnSharedElement(url);
        return;
      } catch {
        // Play failed — continue
      } finally {
        URL.revokeObjectURL(url);
      }
    }
  } catch {
    // Not cached — continue
  }

  // 3. Fall back to Web Speech API (built into iOS, always works from gesture)
  await speakWithWebSpeechAPI(text);
}

export function cancelSpeech() {
  const audio = sharedAudio;
  if (audio) {
    audio.pause();
    audio.currentTime = 0;
  }
  if ("speechSynthesis" in window) {
    speechSynthesis.cancel();
  }
}

export function isTTSSupported(): boolean {
  return true;
}
