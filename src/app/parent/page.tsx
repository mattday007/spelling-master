"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GradientBlob } from "@/components/ui/GradientBlob";
import { PageWrapper } from "@/components/ui/PageWrapper";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PinInput } from "@/components/ui/PinInput";
import { ProfileDetail } from "@/components/profiles/ProfileDetail";
import { useProfiles } from "@/db/hooks";
import { useAppSetting, setAppSetting } from "@/db/hooks";
import { AVATARS } from "@/types";
import { db } from "@/db/database";

function PinGate({ onUnlock }: { onUnlock: () => void }) {
  const savedPin = useAppSetting("parentPin");
  const [error, setError] = useState(false);

  // Derive from savedPin directly rather than syncing via effect
  const isSettingPin = savedPin === undefined;

  const handlePin = async (pin: string) => {
    if (isSettingPin) {
      await setAppSetting("parentPin", pin);
      onUnlock();
    } else if (pin === savedPin) {
      onUnlock();
    } else {
      setError(true);
      setTimeout(() => setError(false), 600);
    }
  };

  return (
    <Card className="w-full max-w-sm text-center space-y-6">
      <h2 className="text-2xl font-bold">
        {isSettingPin ? "Set a Parent PIN" : "Enter Parent PIN"}
      </h2>
      <p className="text-muted">
        {isSettingPin
          ? "Choose a 4-digit PIN to protect parent settings."
          : "Enter your 4-digit PIN to access settings."}
      </p>
      <PinInput onComplete={handlePin} error={error} />
      {error && (
        <p className="text-coral font-semibold text-sm">Incorrect PIN. Try again.</p>
      )}
    </Card>
  );
}

function ApiKeySection() {
  const savedKey = useAppSetting("googleCloudApiKey") as string | undefined;
  const [editing, setEditing] = useState(false);
  const [keyInput, setKeyInput] = useState("");
  const hasEnvKey = !!process.env.NEXT_PUBLIC_GOOGLE_CLOUD_API_KEY;

  const handleSave = async () => {
    const trimmed = keyInput.trim();
    if (trimmed) {
      await setAppSetting("googleCloudApiKey", trimmed);
    } else {
      await db.appSettings.delete("googleCloudApiKey");
    }
    setEditing(false);
    setKeyInput("");
  };

  if (hasEnvKey) {
    return (
      <Card className="w-full">
        <h3 className="text-lg font-bold mb-2">Voice Generation</h3>
        <p className="text-sm text-muted">
          Google Cloud TTS API key is configured via environment variable.
          Custom words will automatically get high-quality audio.
        </p>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <h3 className="text-lg font-bold mb-2">Voice Generation</h3>
      {!editing ? (
        <div className="space-y-2">
          <p className="text-sm text-muted">
            {savedKey
              ? "Google Cloud TTS API key is configured. Custom words will get high-quality audio."
              : "Add a Google Cloud TTS API key to generate high-quality audio for custom words."}
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setKeyInput(savedKey ?? "");
                setEditing(true);
              }}
            >
              {savedKey ? "Change Key" : "Add API Key"}
            </Button>
            {savedKey && (
              <Button
                size="sm"
                variant="danger"
                onClick={async () => {
                  await db.appSettings.delete("googleCloudApiKey");
                }}
              >
                Remove
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <input
            type="password"
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            placeholder="Google Cloud API key"
            className="w-full px-4 py-2 rounded-xl border-2 border-gray-200 font-mono text-sm focus:border-blue outline-none"
            autoFocus
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave}>
              Save
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setEditing(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

function ParentDashboard() {
  const router = useRouter();
  const profiles = useProfiles();
  const [selectedProfileId, setSelectedProfileId] = useState<number | null>(null);

  const handleResetPin = async () => {
    if (confirm("Reset parent PIN? You'll need to set a new one.")) {
      await db.appSettings.delete("parentPin");
      window.location.reload();
    }
  };

  if (selectedProfileId) {
    return (
      <ProfileDetail
        profileId={selectedProfileId}
        onBack={() => setSelectedProfileId(null)}
      />
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-2xl">
      <h1 className="text-4xl font-black text-foreground">Parent Dashboard</h1>
      <p className="text-lg text-muted">Manage profiles and word lists</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
        <Card
          className="cursor-pointer hover:shadow-2xl transition-shadow"
          onClick={() => router.push("/parent/words")}
        >
          <div className="text-center space-y-2">
            <div className="text-4xl">📝</div>
            <h3 className="text-xl font-bold">Word Lists</h3>
            <p className="text-sm text-muted">Manage and create word lists</p>
          </div>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-2xl transition-shadow"
          onClick={handleResetPin}
        >
          <div className="text-center space-y-2">
            <div className="text-4xl">🔑</div>
            <h3 className="text-xl font-bold">Reset PIN</h3>
            <p className="text-sm text-muted">Change your parent PIN</p>
          </div>
        </Card>
      </div>

      {profiles.length > 0 && (
        <Card className="w-full">
          <h3 className="text-xl font-bold mb-4">Learner Profiles</h3>
          <div className="space-y-3">
            {profiles.map((profile) => {
              const avatar = AVATARS.find((a) => a.id === profile.avatarId) ?? AVATARS[0];
              return (
                <button
                  key={profile.id}
                  onClick={() => setSelectedProfileId(profile.id!)}
                  className="w-full flex items-center gap-4 p-3 rounded-2xl hover:bg-gray-50 transition-colors text-left"
                >
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                    style={{
                      background: `linear-gradient(135deg, ${avatar.color}40, ${avatar.color}15)`,
                    }}
                  >
                    {avatar.emoji}
                  </div>
                  <div>
                    <p className="font-bold">{profile.name}</p>
                    <p className="text-sm text-muted">Age {profile.age}</p>
                  </div>
                  <span className="ml-auto text-muted">&rarr;</span>
                </button>
              );
            })}
          </div>
        </Card>
      )}

      <ApiKeySection />
    </div>
  );
}

export default function ParentPage() {
  const router = useRouter();
  const [unlocked, setUnlocked] = useState(false);

  return (
    <>
      <GradientBlob variant="parent" />
      <PageWrapper>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/")}
          className="self-start text-muted mb-4"
        >
          &larr; Home
        </Button>

        {unlocked ? (
          <ParentDashboard />
        ) : (
          <div className="flex flex-col items-center gap-6 mt-12">
            <PinGate onUnlock={() => setUnlocked(true)} />
          </div>
        )}
      </PageWrapper>
    </>
  );
}
