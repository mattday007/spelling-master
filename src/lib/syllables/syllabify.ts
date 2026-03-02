import { syllableMap } from "./syllable-map";

/**
 * Returns the syllable breakdown of a word.
 * Uses the curated map first, falls back to an algorithmic split.
 */
export function getSyllables(word: string): string[] {
  const trimmed = word.trim();
  if (!trimmed) return [];

  // Exact match in curated map
  if (syllableMap[trimmed]) return syllableMap[trimmed];

  // Case-insensitive lookup
  const lower = trimmed.toLowerCase();
  const entry = Object.entries(syllableMap).find(
    ([key]) => key.toLowerCase() === lower
  );
  if (entry) return entry[1];

  // Fallback: algorithmic syllabification
  return isMaoriLike(lower)
    ? syllabifyMaori(trimmed)
    : syllabifyEnglish(trimmed);
}

/**
 * Heuristic: does the word look like a te reo Māori loan word?
 * Requires Māori digraphs (wh/ng) and only Māori-compatible letters.
 */
function isMaoriLike(lower: string): boolean {
  // Only Māori-compatible letters
  if (!/^[aehikmngoprtuwy]+$/.test(lower)) return false;
  // Must end in a vowel
  if (!/[aeiou]$/.test(lower)) return false;
  // Should contain a Māori digraph to distinguish from English
  if (!/wh|ng/.test(lower)) return false;
  // After replacing digraphs, no consonant clusters
  const cleaned = lower.replace(/wh/g, "W").replace(/ng/g, "N");
  return !/[^aeiouWN]{2}/.test(cleaned);
}

/**
 * Māori syllabification: strict (C)V pattern.
 * Treats wh and ng as single consonants; keeps common diphthongs together.
 */
function syllabifyMaori(word: string): string[] {
  const vowels = "aeiouAEIOU";
  const syllables: string[] = [];
  let i = 0;

  while (i < word.length) {
    let syl = "";

    // Optional consonant onset (including digraphs wh, ng)
    if (i < word.length && !vowels.includes(word[i])) {
      if (
        i + 1 < word.length &&
        ((word[i] === "w" || word[i] === "W") &&
          (word[i + 1] === "h" || word[i + 1] === "H"))
      ) {
        syl += word[i] + word[i + 1];
        i += 2;
      } else if (
        i + 1 < word.length &&
        ((word[i] === "n" || word[i] === "N") &&
          (word[i + 1] === "g" || word[i + 1] === "G"))
      ) {
        syl += word[i] + word[i + 1];
        i += 2;
      } else {
        syl += word[i];
        i++;
      }
    }

    // Vowel nucleus (keep diphthongs ai, ae, ao, au, ei, oi, ou together)
    if (i < word.length && vowels.includes(word[i])) {
      syl += word[i];
      i++;
      // Check for diphthong
      if (i < word.length && vowels.includes(word[i])) {
        const pair = (syl.slice(-1) + word[i]).toLowerCase();
        const diphthongs = ["ai", "ae", "ao", "au", "ei", "oi", "ou"];
        if (diphthongs.includes(pair)) {
          syl += word[i];
          i++;
        }
      }
    }

    if (syl) {
      syllables.push(syl);
    } else {
      // Safety: skip unrecognised character
      i++;
    }
  }

  return syllables.length > 0 ? syllables : [word];
}

/**
 * Simple English syllabification fallback.
 * Splits on vowel-group boundaries; handles silent-e and common patterns.
 */
function syllabifyEnglish(word: string): string[] {
  const lower = word.toLowerCase();

  // Find vowel-group spans (y counts as vowel when not word-initial)
  const isVowel = (ch: string, idx: number) =>
    "aeiou".includes(ch) || (ch === "y" && idx > 0);

  interface Span {
    start: number;
    end: number;
  }

  const groups: Span[] = [];
  let inGroup = false;
  let groupStart = 0;

  for (let i = 0; i < lower.length; i++) {
    if (isVowel(lower[i], i)) {
      if (!inGroup) {
        groupStart = i;
        inGroup = true;
      }
    } else {
      if (inGroup) {
        groups.push({ start: groupStart, end: i });
        inGroup = false;
      }
    }
  }
  if (inGroup) {
    groups.push({ start: groupStart, end: lower.length });
  }

  // Detect silent-e: trailing "e" that forms its own vowel group
  if (
    groups.length > 1 &&
    lower.endsWith("e") &&
    groups[groups.length - 1].start === lower.length - 1
  ) {
    // Merge trailing silent-e into previous syllable
    groups.pop();
  }

  if (groups.length <= 1) return [word];

  // Split the word between vowel groups
  const syllables: string[] = [];
  let lastCut = 0;

  for (let g = 0; g < groups.length - 1; g++) {
    const consonantStart = groups[g].end;
    const nextVowelStart = groups[g + 1].start;
    const clusterLen = nextVowelStart - consonantStart;

    let cutAt: number;
    if (clusterLen <= 1) {
      // Single consonant goes with next syllable
      cutAt = consonantStart;
    } else {
      // Split consonant cluster: keep last consonant with next syllable
      cutAt = nextVowelStart - 1;
    }

    syllables.push(word.slice(lastCut, cutAt));
    lastCut = cutAt;
  }
  syllables.push(word.slice(lastCut));

  return syllables;
}
