export interface Profile {
  id?: number;
  name: string;
  age: number;
  avatarId: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface WordList {
  id?: number;
  name: string;
  isPreset: boolean;
  ageMin: number;
  ageMax: number;
  createdAt: Date;
}

export interface Word {
  id?: number;
  wordListId: number;
  text: string;
  difficulty: number;
}

export type PracticeMode = "spelling" | "pronunciation";

export interface PracticeAttempt {
  id?: number;
  profileId: number;
  wordId: number;
  wordText: string;
  mode: PracticeMode;
  success: boolean;
  recognisedText: string;
  score: number;
  attemptedAt: Date;
}

export interface SessionSummary {
  id?: number;
  profileId: number;
  wordListId: number;
  mode: PracticeMode;
  totalWords: number;
  correctCount: number;
  startedAt: Date;
  endedAt: Date;
}

export interface AppSetting {
  key: string;
  value: string;
}

export interface AudioCacheEntry {
  word: string; // Primary key — lowercase, trimmed word text
  blob: Blob; // MP3 audio data
  createdAt: Date;
}

export interface Avatar {
  id: number;
  emoji: string;
  color: string;
}

export const AVATARS: Avatar[] = [
  { id: 1, emoji: "🦁", color: "#FF8C42" },
  { id: 2, emoji: "🦋", color: "#4F8CFF" },
  { id: 3, emoji: "🌸", color: "#D946EF" },
  { id: 4, emoji: "🐸", color: "#00B894" },
  { id: 5, emoji: "🦊", color: "#FF6B6B" },
  { id: 6, emoji: "🐬", color: "#6C5CE7" },
  { id: 7, emoji: "🌟", color: "#FDCB6E" },
  { id: 8, emoji: "🐼", color: "#636e72" },
];

export type MasteryStage = 0 | 1 | 2 | 3;

export interface WordMastery {
  id?: number;
  profileId: number;
  wordId: number;
  wordText: string;
  mode: PracticeMode;
  stage: MasteryStage;
  lastPassedAt: Date | null;
  nextReviewAt: Date | null;
  updatedAt: Date;
}

export type SessionState =
  | "idle"
  | "prompting"
  | "writing"
  | "recording"
  | "checking"
  | "feedback"
  | "complete";

export interface SessionAction {
  type:
    | "START"
    | "NEXT_WORD"
    | "BEGIN_INPUT"
    | "SUBMIT"
    | "SHOW_FEEDBACK"
    | "COMPLETE";
  payload?: Record<string, unknown>;
}
