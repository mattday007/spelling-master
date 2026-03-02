"use client";

import { useState, useEffect, useCallback } from "react";
import { db } from "@/db/database";
import type { Word, PracticeMode, WordMastery } from "@/types";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function useSessionWords(
  profileId: number | undefined,
  wordListIds: number[] | undefined,
  mode: PracticeMode,
  difficulty?: number,
  sessionSize = 10
) {
  const [words, setWords] = useState<Word[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // Stable serialisation for dependency array
  const listIdsKey = wordListIds?.join(",") ?? "";

  useEffect(() => {
    if (!wordListIds || wordListIds.length === 0 || !profileId) return;

    async function loadWords() {
      setLoading(true);

      let allWords: Word[];
      if (wordListIds!.length === 1) {
        allWords = await db.words
          .where("wordListId")
          .equals(wordListIds![0])
          .toArray();
      } else {
        allWords = await db.words
          .where("wordListId")
          .anyOf(wordListIds!)
          .toArray();
      }

      if (difficulty) {
        allWords = allWords.filter((w) => w.difficulty === difficulty);
      }

      // Deduplicate by word text (same word can appear in multiple lists)
      const seen = new Set<string>();
      allWords = allWords.filter((w) => {
        const key = w.text.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      // Load mastery records for this profile+mode
      const masteryRecords = await db.wordMastery
        .where("[profileId+mode]")
        .equals([profileId!, mode])
        .toArray();

      const masteryByWordId = new Map<number, WordMastery>();
      for (const m of masteryRecords) {
        masteryByWordId.set(m.wordId, m);
      }

      // Load attempt stats for accuracy sorting of struggling words
      const attempts = await db.practiceAttempts
        .where("[profileId+mode]")
        .equals([profileId!, mode])
        .toArray();

      const wordStats = new Map<number, { attempts: number; correct: number }>();
      for (const a of attempts) {
        const stats = wordStats.get(a.wordId) ?? { attempts: 0, correct: 0 };
        stats.attempts++;
        if (a.success) stats.correct++;
        wordStats.set(a.wordId, stats);
      }

      const now = new Date();

      // Bucket 1: Due for review (stage 1-2, nextReviewAt <= now)
      const dueWords: Word[] = [];
      // Bucket 2: Struggling (stage 0)
      const strugglingWords: Word[] = [];
      // Bucket 3: New words (no mastery record)
      const newWords: Word[] = [];
      // Bucket 4: Active fallback (stage 1-2, not yet due)
      const activeWords: Word[] = [];

      for (const w of allWords) {
        const m = masteryByWordId.get(w.id!);
        if (!m) {
          newWords.push(w);
        } else if (m.stage === 3) {
          // Known — exclude entirely
          continue;
        } else if (m.stage === 0) {
          strugglingWords.push(w);
        } else if (m.nextReviewAt && now >= m.nextReviewAt) {
          dueWords.push(w);
        } else {
          activeWords.push(w);
        }
      }

      // Sort struggling by worst accuracy
      strugglingWords.sort((a, b) => {
        const sa = wordStats.get(a.id!) ?? { attempts: 0, correct: 0 };
        const sb = wordStats.get(b.id!) ?? { attempts: 0, correct: 0 };
        const accA = sa.attempts > 0 ? sa.correct / sa.attempts : 0;
        const accB = sb.attempts > 0 ? sb.correct / sb.attempts : 0;
        return accA - accB;
      });

      // Build session with bucket priority: due(4) → struggling(3) → new(fill) → active(fill)
      const selected: Word[] = [];
      const maxDue = 4;
      const maxStruggling = 3;

      // Bucket 1: due for review
      const dueShuffled = shuffle(dueWords);
      selected.push(...dueShuffled.slice(0, maxDue));
      let surplus = maxDue - Math.min(dueShuffled.length, maxDue);

      // Bucket 2: struggling
      const strugglingMax = maxStruggling + surplus;
      selected.push(...strugglingWords.slice(0, strugglingMax));
      surplus = strugglingMax - Math.min(strugglingWords.length, strugglingMax);

      // Bucket 3: new words (fill remaining)
      const remaining = sessionSize - selected.length;
      const newShuffled = shuffle(newWords);
      selected.push(...newShuffled.slice(0, remaining));

      // Bucket 4: active fallback (if still not enough)
      if (selected.length < sessionSize) {
        const still = sessionSize - selected.length;
        const activeShuffled = shuffle(activeWords);
        selected.push(...activeShuffled.slice(0, still));
      }

      // Final shuffle so due/struggling/new aren't in predictable order
      setWords(shuffle(selected));
      setCurrentIndex(0);
      setLoading(false);
    }

    loadWords();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileId, listIdsKey, mode, difficulty, sessionSize]);

  const currentWord = words[currentIndex] ?? null;

  const nextWord = useCallback(() => {
    setCurrentIndex((prev) => Math.min(prev + 1, words.length));
  }, [words.length]);

  const isComplete = !loading && words.length > 0 && currentIndex >= words.length;

  return { words, currentWord, currentIndex, nextWord, isComplete, loading, total: words.length };
}
