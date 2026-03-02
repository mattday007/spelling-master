/**
 * Runtime audio generation and caching.
 *
 * When a parent adds a custom word, this module calls the /api/tts proxy
 * to generate an MP3 and stores it in the Dexie audioCache table.
 * When a word is removed, it cleans up orphaned cache entries.
 */

import { db } from "@/db/database";

// ---------------------------------------------------------------------------
// Audio filename helper (matches scripts/generate-audio.ts and tts.ts)
// ---------------------------------------------------------------------------

function toAudioFilename(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

/**
 * Check whether a static pre-generated MP3 exists for this word.
 * Sends a HEAD request to avoid downloading the full file.
 */
async function hasStaticAudio(text: string): Promise<boolean> {
  const filename = toAudioFilename(text);
  if (!filename) return false;

  try {
    const res = await fetch(`/audio/${filename}.mp3`, { method: "HEAD" });
    return res.ok;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// TTS generation via server-side proxy
// ---------------------------------------------------------------------------

async function callTTSProxy(text: string): Promise<Blob> {
  const res = await fetch("/api/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`TTS proxy error: ${res.status} ${error}`);
  }

  const json = (await res.json()) as { audioContent: string };
  const binary = atob(json.audioContent);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: "audio/mpeg" });
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Generate and cache audio for a word. Skips if:
 * - A static MP3 already exists in /audio/
 * - The word is already in the audioCache
 * - The TTS proxy returns an error (fails silently)
 */
export async function generateAndCacheAudio(wordText: string): Promise<void> {
  const text = wordText.trim().toLowerCase();
  if (!text) return;

  // Already cached?
  const existing = await db.audioCache.get(text);
  if (existing) return;

  // Static file exists?
  if (await hasStaticAudio(text)) return;

  try {
    const blob = await callTTSProxy(wordText);
    await db.audioCache.put({ word: text, blob, createdAt: new Date() });
  } catch (err) {
    console.warn(`Failed to generate audio for "${text}":`, err);
  }
}

/**
 * Delete cached audio for a word if it's no longer used by any word record.
 * Static pre-generated files are unaffected (can't delete those at runtime).
 */
export async function deleteAudioIfOrphaned(wordText: string): Promise<void> {
  const text = wordText.trim().toLowerCase();
  if (!text) return;

  // Check if any word record still has this text
  const remaining = await db.words.where("text").equals(text).count();
  if (remaining > 0) return;

  // Also check case-insensitive (word texts are stored as entered)
  const remainingAny = await db.words.filter(
    (w) => w.text.trim().toLowerCase() === text
  ).count();
  if (remainingAny > 0) return;

  await db.audioCache.delete(text);
}

/**
 * Bulk cleanup: delete cached audio for multiple words if orphaned.
 * Used when deleting an entire word list.
 */
export async function deleteAudioForWords(
  words: { text: string }[]
): Promise<void> {
  for (const word of words) {
    await deleteAudioIfOrphaned(word.text);
  }
}

/**
 * Get a cached audio blob for a word, or null if not cached.
 */
export async function getCachedAudio(
  wordText: string
): Promise<Blob | null> {
  const text = wordText.trim().toLowerCase();
  const entry = await db.audioCache.get(text);
  return entry?.blob ?? null;
}
