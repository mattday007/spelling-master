import { db } from "./database";
import { PRESET_WORD_LISTS } from "./word-lists";

// Bump this when preset word lists change to trigger re-seed
const SEED_VERSION = 6;

/**
 * Estimate spelling complexity of a word.
 * Higher score = harder to spell.
 */
function wordComplexity(word: string): number {
  const w = word.toLowerCase();
  let score = w.length;

  // Irregular / silent-letter patterns
  if (/ough|igh|eigh/.test(w)) score += 3;
  if (/tion|sion|cious|tious/.test(w)) score += 2;
  if (/ph|gh|kn|wr|mb|gn|ps/.test(w)) score += 2;

  // Double consonants (harder to remember)
  if (/([bcdfghlmnprst])\1/.test(w)) score += 1;

  // Syllable count proxy — more vowel groups = harder
  const vowelGroups = w.match(/[aeiouy]+/gi) || [];
  if (vowelGroups.length >= 3) score += 1;
  if (vowelGroups.length >= 4) score += 2;

  return score;
}

export async function seedDatabase() {
  const versionSetting = await db.appSettings.get("seedVersion");
  const currentVersion = versionSetting ? JSON.parse(versionSetting.value) : 0;

  if (currentVersion >= SEED_VERSION) return;

  // Clear old preset lists and their words before re-seeding
  const oldPresetIds = (
    await db.wordLists.filter((wl) => wl.isPreset).toArray()
  ).map((wl) => wl.id!);
  for (const id of oldPresetIds) {
    await db.words.where("wordListId").equals(id).delete();
  }
  await db.wordLists.bulkDelete(oldPresetIds);

  for (const preset of PRESET_WORD_LISTS) {
    const listId = await db.wordLists.add({
      name: preset.name,
      isPreset: true,
      ageMin: preset.ageMin,
      ageMax: preset.ageMax,
      createdAt: new Date(),
    });

    // Assign difficulty by absolute complexity thresholds so
    // "easy" means the same thing across every list.
    //   1-3  → Easy
    //   4-6  → Medium
    //   7+   → Hard
    const words = preset.words.map((text) => {
      const score = wordComplexity(text);
      const difficulty = score <= 3 ? 1 : score <= 6 ? 2 : 3;
      return { wordListId: listId as number, text, difficulty };
    });

    await db.words.bulkAdd(words);
  }

  await db.appSettings.put({
    key: "seedVersion",
    value: JSON.stringify(SEED_VERSION),
  });
}
