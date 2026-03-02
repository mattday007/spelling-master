import Dexie, { type EntityTable } from "dexie";
import type {
  Profile,
  WordList,
  Word,
  PracticeAttempt,
  SessionSummary,
  AppSetting,
  AudioCacheEntry,
  WordMastery,
} from "@/types";

class SpellingMasterDB extends Dexie {
  profiles!: EntityTable<Profile, "id">;
  wordLists!: EntityTable<WordList, "id">;
  words!: EntityTable<Word, "id">;
  practiceAttempts!: EntityTable<PracticeAttempt, "id">;
  sessionSummaries!: EntityTable<SessionSummary, "id">;
  appSettings!: EntityTable<AppSetting, "key">;
  audioCache!: EntityTable<AudioCacheEntry, "word">;
  wordMastery!: EntityTable<WordMastery, "id">;

  constructor() {
    super("SpellingMasterDB");

    this.version(1).stores({
      profiles: "++id, name",
      wordLists: "++id, name, isPreset, ageMin, ageMax",
      words: "++id, wordListId, text, difficulty",
      practiceAttempts:
        "++id, profileId, wordId, wordText, mode, [profileId+mode], [profileId+wordId], attemptedAt",
      sessionSummaries: "++id, profileId, wordListId, mode, startedAt",
      appSettings: "key",
    });

    this.version(2).stores({
      profiles: "++id, name",
      wordLists: "++id, name, isPreset, ageMin, ageMax",
      words: "++id, wordListId, text, difficulty",
      practiceAttempts:
        "++id, profileId, wordId, wordText, mode, [profileId+mode], [profileId+wordId], attemptedAt",
      sessionSummaries: "++id, profileId, wordListId, mode, startedAt",
      appSettings: "key",
      audioCache: "word",
    });

    this.version(3).stores({
      profiles: "++id, name",
      wordLists: "++id, name, isPreset, ageMin, ageMax",
      words: "++id, wordListId, text, difficulty",
      practiceAttempts:
        "++id, profileId, wordId, wordText, mode, [profileId+mode], [profileId+wordId], attemptedAt",
      sessionSummaries: "++id, profileId, wordListId, mode, startedAt",
      appSettings: "key",
      audioCache: "word",
      wordMastery:
        "++id, [profileId+wordId+mode], [profileId+mode], [profileId+mode+stage], nextReviewAt",
    }).upgrade(async (tx) => {
      // Bootstrap mastery records from existing practice attempts
      const attempts = await tx.table("practiceAttempts").toArray();

      // Group by profileId+wordId+mode
      const grouped = new Map<string, { profileId: number; wordId: number; wordText: string; mode: string; successes: number; total: number; lastAttempt: Date }>();
      for (const a of attempts) {
        const key = `${a.profileId}-${a.wordId}-${a.mode}`;
        const entry = grouped.get(key) ?? {
          profileId: a.profileId,
          wordId: a.wordId,
          wordText: a.wordText,
          mode: a.mode,
          successes: 0,
          total: 0,
          lastAttempt: new Date(0),
        };
        entry.total++;
        if (a.success) entry.successes++;
        if (new Date(a.attemptedAt) > entry.lastAttempt) {
          entry.lastAttempt = new Date(a.attemptedAt);
        }
        grouped.set(key, entry);
      }

      const now = new Date();
      const masteryTable = tx.table("wordMastery");
      for (const entry of grouped.values()) {
        const accuracy = entry.successes / entry.total;
        // If strong track record, give stage 1 to let spaced repetition take over
        const stage = accuracy >= 0.8 && entry.total >= 3 ? 1 : 0;
        const twoDays = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
        await masteryTable.add({
          profileId: entry.profileId,
          wordId: entry.wordId,
          wordText: entry.wordText,
          mode: entry.mode,
          stage,
          lastPassedAt: stage === 1 ? entry.lastAttempt : null,
          nextReviewAt: stage === 1 ? twoDays : null,
          updatedAt: now,
        });
      }
    });
  }
}

export const db = new SpellingMasterDB();
