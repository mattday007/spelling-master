/**
 * Generate MP3 audio files for all preset words using Google Cloud TTS.
 *
 * Usage:
 *   GOOGLE_CLOUD_API_KEY=... npx tsx scripts/generate-audio.ts
 *
 * Or set GOOGLE_CLOUD_API_KEY in .env.local and run:
 *   npx tsx scripts/generate-audio.ts
 *
 * Generates files to public/audio/{word}.mp3. Skips words that already
 * have an MP3 (incremental). Safe to re-run.
 */

import * as fs from "fs";
import * as path from "path";
import { PRESET_WORD_LISTS } from "../src/db/word-lists";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const VOICE = {
  languageCode: "en-AU",
  name: "en-AU-Neural2-C", // Female Australian
};

const AUDIO_CONFIG = {
  audioEncoding: "MP3" as const,
  speakingRate: 0.9, // Slightly slower for clarity
};

const OUTPUT_DIR = path.resolve(__dirname, "../public/audio");
const DELAY_MS = 100; // Delay between API calls to respect rate limits

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Convert word text to a URL-safe filename (without extension). */
export function toAudioFilename(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

function loadApiKey(): string {
  // Check environment first
  if (process.env.GOOGLE_CLOUD_API_KEY) {
    return process.env.GOOGLE_CLOUD_API_KEY;
  }

  // Try loading from .env.local
  const envPath = path.resolve(__dirname, "../.env.local");
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf-8");
    for (const line of envContent.split("\n")) {
      const match = line.match(/^GOOGLE_CLOUD_API_KEY=(.+)$/);
      if (match) return match[1].trim();
    }
  }

  throw new Error(
    "GOOGLE_CLOUD_API_KEY not found. Set it as an environment variable or in .env.local"
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// TTS API
// ---------------------------------------------------------------------------

async function synthesize(
  text: string,
  apiKey: string
): Promise<Buffer> {
  const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`;

  const body = {
    input: { text },
    voice: VOICE,
    audioConfig: AUDIO_CONFIG,
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`TTS API error for "${text}": ${res.status} ${error}`);
  }

  const json = (await res.json()) as { audioContent: string };
  return Buffer.from(json.audioContent, "base64");
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const apiKey = loadApiKey();

  // Collect and deduplicate all words
  const allWords = new Set<string>();
  for (const list of PRESET_WORD_LISTS) {
    for (const word of list.words) {
      allWords.add(word);
    }
  }

  const words = Array.from(allWords).sort();
  console.log(`Found ${words.length} unique words across ${PRESET_WORD_LISTS.length} lists`);

  // Ensure output directory exists
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  let generated = 0;
  let skipped = 0;
  let failed = 0;

  for (const word of words) {
    const filename = toAudioFilename(word);
    if (!filename) {
      console.warn(`  Skipping "${word}" — empty filename after sanitization`);
      skipped++;
      continue;
    }

    const outputPath = path.join(OUTPUT_DIR, `${filename}.mp3`);

    if (fs.existsSync(outputPath)) {
      skipped++;
      continue;
    }

    try {
      const audio = await synthesize(word, apiKey);
      fs.writeFileSync(outputPath, audio);
      generated++;
      process.stdout.write(`  ✓ ${word} → ${filename}.mp3\n`);
      await sleep(DELAY_MS);
    } catch (err) {
      failed++;
      console.error(`  ✗ ${word}: ${err instanceof Error ? err.message : err}`);
    }
  }

  console.log(
    `\nDone: ${generated} generated, ${skipped} skipped (already exist), ${failed} failed`
  );

  if (failed > 0) {
    process.exit(1);
  }
}

main();
