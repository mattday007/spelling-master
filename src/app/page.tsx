"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useProfile } from "@/context/ProfileContext";
import { useProfiles } from "@/db/hooks";
import { seedDatabase } from "@/db/seed";
import { GradientBlob } from "@/components/ui/GradientBlob";
import { PageWrapper } from "@/components/ui/PageWrapper";
import { ProfileSelector } from "@/components/profiles/ProfileSelector";
import { Button } from "@/components/ui/Button";
import type { Profile } from "@/types";

export default function HomePage() {
  const router = useRouter();
  const profiles = useProfiles();
  const { setActiveProfile } = useProfile();

  useEffect(() => {
    seedDatabase();
  }, []);

  const handleSelect = (profile: Profile) => {
    setActiveProfile(profile);
    router.push("/play");
  };

  const handleAddNew = () => {
    router.push("/setup");
  };

  return (
    <>
      <GradientBlob variant="home" />
      <PageWrapper>
        <div className="flex flex-col items-center gap-8 w-full max-w-2xl mt-8">
          <div className="text-center">
            <h1 className="text-5xl sm:text-6xl font-black text-foreground mb-3">
              Spelling Master
            </h1>
            <p className="text-xl text-muted font-semibold">
              Learn to spell and say words!
            </p>
          </div>

          {profiles.length > 0 ? (
            <>
              <p className="text-lg text-muted font-semibold">Who&apos;s practising today?</p>
              <ProfileSelector
                profiles={profiles}
                onSelect={handleSelect}
                onAddNew={handleAddNew}
              />
            </>
          ) : (
            <div className="flex flex-col items-center gap-6 mt-8">
              <p className="text-lg text-muted text-center">
                Let&apos;s get started by adding a learner!
              </p>
              <Button size="lg" onClick={handleAddNew}>
                Create First Profile
              </Button>
            </div>
          )}

          <div className="mt-auto pt-12">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/parent")}
              className="text-muted"
            >
              Parent Settings
            </Button>
          </div>
        </div>
      </PageWrapper>
    </>
  );
}
