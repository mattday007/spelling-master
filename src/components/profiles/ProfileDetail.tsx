"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useProfile as useDbProfile, useAttempts, useSessions } from "@/db/hooks";
import { AVATARS } from "@/types";
import { db } from "@/db/database";

interface ProfileDetailProps {
  profileId: number;
  onBack: () => void;
}

export function ProfileDetail({ profileId, onBack }: ProfileDetailProps) {
  const profile = useDbProfile(profileId);
  const attempts = useAttempts(profileId);
  const sessions = useSessions(profileId);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [age, setAge] = useState(6);

  if (!profile) {
    return <p className="text-muted">Loading profile...</p>;
  }

  const avatar = AVATARS.find((a) => a.id === profile.avatarId) ?? AVATARS[0];
  const totalAttempts = attempts.length;
  const correctAttempts = attempts.filter((a) => a.success).length;
  const accuracy = totalAttempts > 0 ? (correctAttempts / totalAttempts) * 100 : 0;

  const spellingAttempts = attempts.filter((a) => a.mode === "spelling");
  const pronunciationAttempts = attempts.filter((a) => a.mode === "pronunciation");
  const spellingAccuracy =
    spellingAttempts.length > 0
      ? (spellingAttempts.filter((a) => a.success).length / spellingAttempts.length) * 100
      : 0;
  const pronunciationAccuracy =
    pronunciationAttempts.length > 0
      ? (pronunciationAttempts.filter((a) => a.success).length / pronunciationAttempts.length) * 100
      : 0;

  const wordAccuracy = new Map<string, { correct: number; total: number }>();
  for (const attempt of attempts) {
    const existing = wordAccuracy.get(attempt.wordText) ?? { correct: 0, total: 0 };
    existing.total++;
    if (attempt.success) existing.correct++;
    wordAccuracy.set(attempt.wordText, existing);
  }

  const startEdit = () => {
    setName(profile.name);
    setAge(profile.age);
    setEditing(true);
  };

  const saveEdit = async () => {
    await db.profiles.update(profileId, { name, age, updatedAt: new Date() });
    setEditing(false);
  };

  const deleteProfile = async () => {
    if (confirm(`Delete ${profile.name}'s profile and all their progress? This cannot be undone.`)) {
      await db.practiceAttempts.where("profileId").equals(profileId).delete();
      await db.sessionSummaries.where("profileId").equals(profileId).delete();
      await db.profiles.delete(profileId);
      onBack();
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-2xl">
      <Button
        variant="ghost"
        size="sm"
        onClick={onBack}
        className="self-start text-muted"
      >
        &larr; Back
      </Button>

      <div className="flex items-center gap-4">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center text-4xl shadow-lg"
          style={{
            background: `linear-gradient(135deg, ${avatar.color}40, ${avatar.color}15)`,
            border: `3px solid ${avatar.color}`,
          }}
        >
          {avatar.emoji}
        </div>
        <div>
          {editing ? (
            <div className="space-y-2">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="px-3 py-2 rounded-xl border-2 border-gray-200 font-bold text-xl focus:border-blue outline-none"
              />
              <div className="flex items-center gap-2">
                <label className="text-sm font-bold">Age:</label>
                <input
                  type="number"
                  min={4}
                  max={12}
                  value={age}
                  onChange={(e) => setAge(Number(e.target.value))}
                  className="w-16 px-2 py-1 rounded-lg border-2 border-gray-200 font-bold focus:border-blue outline-none"
                />
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={saveEdit}>Save</Button>
                <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <>
              <h1 className="text-3xl font-black">{profile.name}</h1>
              <p className="text-muted">Age {profile.age}</p>
            </>
          )}
        </div>
      </div>

      {!editing && (
        <div className="flex gap-3">
          <Button size="sm" variant="secondary" onClick={startEdit}>Edit Profile</Button>
          <Button size="sm" variant="danger" onClick={deleteProfile}>Delete</Button>
        </div>
      )}

      <Card className="w-full space-y-4">
        <h3 className="text-xl font-bold">Overall Progress</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-3xl font-black text-blue">{totalAttempts}</p>
            <p className="text-sm text-muted">Attempts</p>
          </div>
          <div>
            <p className="text-3xl font-black text-green">{correctAttempts}</p>
            <p className="text-sm text-muted">Correct</p>
          </div>
          <div>
            <p className="text-3xl font-black text-purple">{sessions.length}</p>
            <p className="text-sm text-muted">Sessions</p>
          </div>
        </div>
        <ProgressBar value={accuracy} label="Overall Accuracy" />
        <ProgressBar value={spellingAccuracy} label="Spelling Accuracy" color="var(--color-purple)" />
        <ProgressBar value={pronunciationAccuracy} label="Pronunciation Accuracy" color="var(--color-pink)" />
      </Card>

      {wordAccuracy.size > 0 && (
        <Card className="w-full">
          <h3 className="text-xl font-bold mb-4">Word Accuracy</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {Array.from(wordAccuracy.entries())
              .sort((a, b) => a[1].correct / a[1].total - b[1].correct / b[1].total)
              .map(([word, stats]) => (
                <div key={word} className="flex items-center gap-3">
                  <span className="font-semibold w-28 truncate">{word}</span>
                  <ProgressBar
                    value={(stats.correct / stats.total) * 100}
                  />
                  <span className="text-sm text-muted whitespace-nowrap">
                    {stats.correct}/{stats.total}
                  </span>
                </div>
              ))}
          </div>
        </Card>
      )}
    </div>
  );
}
