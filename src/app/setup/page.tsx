"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/db/database";
import { useProfile } from "@/context/ProfileContext";
import { GradientBlob } from "@/components/ui/GradientBlob";
import { PageWrapper } from "@/components/ui/PageWrapper";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { AvatarPicker } from "@/components/profiles/AvatarPicker";

export default function SetupPage() {
  const router = useRouter();
  const { setActiveProfile } = useProfile();
  const [name, setName] = useState("");
  const [age, setAge] = useState(6);
  const [avatarId, setAvatarId] = useState(1);
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setSaving(true);

    const now = new Date();
    const id = await db.profiles.add({
      name: name.trim(),
      age,
      avatarId,
      createdAt: now,
      updatedAt: now,
    });

    const profile = await db.profiles.get(id);
    if (profile) {
      setActiveProfile(profile);
      router.push("/play");
    }
  };

  return (
    <>
      <GradientBlob variant="home" />
      <PageWrapper>
        <div className="flex flex-col items-center gap-6 w-full max-w-md mt-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="self-start text-muted"
          >
            &larr; Back
          </Button>

          <h1 className="text-4xl font-black text-foreground">New Learner</h1>
          <p className="text-lg text-muted">Set up a profile to start practising!</p>

          <Card className="w-full space-y-6">
            <div>
              <label className="block text-sm font-bold text-foreground mb-2">
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter name..."
                className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 text-lg font-semibold focus:border-blue focus:ring-2 focus:ring-blue/20 outline-none transition-colors"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-foreground mb-2">
                Age: {age}
              </label>
              <input
                type="range"
                min={4}
                max={12}
                value={age}
                onChange={(e) => setAge(Number(e.target.value))}
                className="w-full accent-blue"
              />
              <div className="flex justify-between text-xs text-muted mt-1">
                <span>4</span>
                <span>12</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-foreground mb-3">
                Choose an Avatar
              </label>
              <AvatarPicker selected={avatarId} onSelect={setAvatarId} />
            </div>

            <Button
              size="lg"
              className="w-full"
              onClick={handleCreate}
              disabled={!name.trim() || saving}
            >
              {saving ? "Creating..." : "Let's Go!"}
            </Button>
          </Card>
        </div>
      </PageWrapper>
    </>
  );
}
