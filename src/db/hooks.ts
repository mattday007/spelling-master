import { useLiveQuery } from "dexie-react-hooks";
import { db } from "./database";
import type { PracticeMode, WordMastery } from "@/types";

export function useProfiles() {
  return useLiveQuery(() => db.profiles.toArray()) ?? [];
}

export function useProfile(id: number | undefined) {
  return useLiveQuery(() => (id ? db.profiles.get(id) : undefined), [id]);
}

export function useWordLists() {
  return useLiveQuery(() => db.wordLists.toArray()) ?? [];
}

export function usePresetWordLists(age?: number) {
  return (
    useLiveQuery(
      () =>
        age
          ? db.wordLists
              .filter((wl) => wl.isPreset && age >= wl.ageMin && age <= wl.ageMax)
              .toArray()
          : db.wordLists.filter((wl) => wl.isPreset).toArray(),
      [age]
    ) ?? []
  );
}

export function useCustomWordLists() {
  return (
    useLiveQuery(() =>
      db.wordLists.filter((wl) => !wl.isPreset).toArray()
    ) ?? []
  );
}

export function useWordsForList(listId: number | undefined) {
  return (
    useLiveQuery(
      () =>
        listId
          ? db.words.where("wordListId").equals(listId).toArray()
          : [],
      [listId]
    ) ?? []
  );
}

export function useAttempts(profileId: number | undefined, mode?: PracticeMode) {
  return (
    useLiveQuery(
      () => {
        if (!profileId) return [];
        if (mode) {
          return db.practiceAttempts
            .where("[profileId+mode]")
            .equals([profileId, mode])
            .toArray();
        }
        return db.practiceAttempts
          .where("profileId")
          .equals(profileId)
          .toArray();
      },
      [profileId, mode]
    ) ?? []
  );
}

export function useSessions(profileId: number | undefined) {
  return (
    useLiveQuery(
      () =>
        profileId
          ? db.sessionSummaries
              .where("profileId")
              .equals(profileId)
              .toArray()
          : [],
      [profileId]
    ) ?? []
  );
}

export function useAppSetting(key: string) {
  const setting = useLiveQuery(() => db.appSettings.get(key), [key]);
  return setting?.value ? JSON.parse(setting.value) : undefined;
}

export async function setAppSetting(key: string, value: unknown) {
  await db.appSettings.put({ key, value: JSON.stringify(value) });
}

export function useWordMastery(
  profileId: number | undefined,
  mode?: PracticeMode
): WordMastery[] {
  return (
    useLiveQuery(
      () => {
        if (!profileId) return [];
        if (mode) {
          return db.wordMastery
            .where("[profileId+mode]")
            .equals([profileId, mode])
            .toArray();
        }
        return db.wordMastery
          .where("[profileId+mode]")
          .between([profileId, ""], [profileId, "\uffff"])
          .toArray();
      },
      [profileId, mode]
    ) ?? []
  );
}

export function useVocabularySize(
  profileId: number | undefined,
  mode: PracticeMode
): number {
  return (
    useLiveQuery(
      () => {
        if (!profileId) return 0;
        return db.wordMastery
          .where("[profileId+mode+stage]")
          .equals([profileId, mode, 3])
          .count();
      },
      [profileId, mode]
    ) ?? 0
  );
}

export function useTodayAttempts(profileId: number | undefined) {
  return (
    useLiveQuery(
      () => {
        if (!profileId) return [];
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        return db.practiceAttempts
          .where("attemptedAt")
          .aboveOrEqual(startOfDay)
          .filter((a) => a.profileId === profileId)
          .toArray();
      },
      [profileId]
    ) ?? []
  );
}
