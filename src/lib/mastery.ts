import { db } from "@/db/database";
import type { MasteryStage, PracticeMode } from "@/types";

interface WordResult {
  wordId: number;
  wordText: string;
  success: boolean;
}

const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000;
const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export async function updateMasteryAfterSession(
  profileId: number,
  mode: PracticeMode,
  results: WordResult[]
) {
  const now = new Date();

  for (const result of results) {
    const existing = await db.wordMastery
      .where("[profileId+wordId+mode]")
      .equals([profileId, result.wordId, mode])
      .first();

    if (!existing) {
      // No record yet
      if (result.success) {
        await db.wordMastery.add({
          profileId,
          wordId: result.wordId,
          wordText: result.wordText,
          mode,
          stage: 1,
          lastPassedAt: now,
          nextReviewAt: new Date(now.getTime() + TWO_DAYS_MS),
          updatedAt: now,
        });
      } else {
        await db.wordMastery.add({
          profileId,
          wordId: result.wordId,
          wordText: result.wordText,
          mode,
          stage: 0,
          lastPassedAt: null,
          nextReviewAt: null,
          updatedAt: now,
        });
      }
      continue;
    }

    // Stage 3 — already known, skip
    if (existing.stage === 3) continue;

    const isDue = existing.nextReviewAt != null && now >= existing.nextReviewAt;

    if (result.success) {
      if (existing.stage === 0) {
        // Stage 0 + success → advance to stage 1
        await db.wordMastery.update(existing.id!, {
          stage: 1 as MasteryStage,
          lastPassedAt: now,
          nextReviewAt: new Date(now.getTime() + TWO_DAYS_MS),
          updatedAt: now,
        });
      } else if (existing.stage === 1 && isDue) {
        // Stage 1 + success + due → advance to stage 2
        await db.wordMastery.update(existing.id!, {
          stage: 2 as MasteryStage,
          lastPassedAt: now,
          nextReviewAt: new Date(now.getTime() + ONE_WEEK_MS),
          updatedAt: now,
        });
      } else if (existing.stage === 2 && isDue) {
        // Stage 2 + success + due → advance to stage 3 (known!)
        await db.wordMastery.update(existing.id!, {
          stage: 3 as MasteryStage,
          lastPassedAt: now,
          nextReviewAt: null,
          updatedAt: now,
        });
      }
      // Success but not yet due — no stage change
    } else {
      // Failure
      if (isDue && (existing.stage === 1 || existing.stage === 2)) {
        // Failed a scheduled retest → drop to stage 1
        await db.wordMastery.update(existing.id!, {
          stage: 1 as MasteryStage,
          lastPassedAt: existing.lastPassedAt,
          nextReviewAt: null,
          updatedAt: now,
        });
      }
      // Fail + not due → no change (extra practice, not penalized)
    }
  }
}
